package com.geovannycode.product.service

import com.geovannycode.product.dto.AddProductImageRequest
import com.geovannycode.product.dto.CreateProductRequest
import com.geovannycode.product.dto.ProductImageResponse
import com.geovannycode.product.dto.ProductListResponse
import com.geovannycode.product.dto.ProductResponse
import com.geovannycode.product.dto.StockOperation
import com.geovannycode.product.dto.UpdateProductRequest
import com.geovannycode.product.dto.UpdateStockRequest
import com.geovannycode.product.entity.Product
import com.geovannycode.product.messaging.ProductEventPublisher
import com.geovannycode.product.repository.CategoryRepository
import com.geovannycode.product.repository.ProductRepository
import com.geovannycode.product.repository.ProductSpecifications
import com.geovannycode.shared.dto.PageResponse
import com.geovannycode.shared.exception.InsufficientStockException
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import com.geovannycode.shared.exception.ResourceNotFoundException
import com.geovannycode.shared.util.toSlug
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val categoryRepository: CategoryRepository,
    private val eventPublisher: ProductEventPublisher,
    @Value("\${product.featured-products-limit:8}")
    private val featuredProductsLimit: Int,
    @Value("\${product.related-products-limit:4}")
    private val relatedProductsLimit: Int
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ============== Consultas públicas ==============

    /**
     * Obtiene productos con filtros y paginación
     */
    @Transactional(readOnly = true)
    fun getProducts(
        categorySlug: String? = null,
        minPrice: Long? = null,
        maxPrice: Long? = null,
        inStock: Boolean? = null,
        search: String? = null,
        page: Int = 0,
        size: Int = 20,
        sortBy: String = "createdAt",
        sortDir: String = "desc"
    ): PageResponse<ProductListResponse> {
        logger.debug("Buscando productos - category: $categorySlug, search: $search, page: $page")

        val sort = Sort.by(
            if (sortDir.equals("asc", ignoreCase = true)) Sort.Direction.ASC else Sort.Direction.DESC,
            mapSortField(sortBy)
        )
        val pageable = PageRequest.of(page, size.coerceIn(1, 100), sort)

        val specification: Specification<Product> = Specification.allOf(
            ProductSpecifications.isActive(),
            ProductSpecifications.hasCategorySlug(categorySlug),
            ProductSpecifications.priceGreaterOrEqual(minPrice),
            ProductSpecifications.priceLessOrEqual(maxPrice),
            ProductSpecifications.stockAvailability(inStock),
            ProductSpecifications.nameOrDescriptionContains(search)
        )

        val productPage = productRepository.findAll(specification, pageable)

        return PageResponse.of(
            content = productPage.content.map { ProductListResponse.from(it) },
            page = page,
            size = size,
            totalElements = productPage.totalElements
        )
    }

    /**
     * Obtiene un producto por slug
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["products"], key = "#slug")
    fun getBySlug(slug: String): ProductResponse {
        logger.debug("Obteniendo producto por slug: $slug")

        val product = productRepository.findBySlugWithImages(slug)
            .orElseThrow { ResourceNotFoundException("Producto", "slug", slug) }

        return ProductResponse.from(product)
    }

    /**
     * Obtiene un producto por ID
     */
    @Transactional(readOnly = true)
    fun getById(id: Long): ProductResponse {
        val product = findById(id)
        return ProductResponse.from(product)
    }

    /**
     * Obtiene productos destacados
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["products"], key = "'featured'")
    fun getFeatured(): List<ProductListResponse> {
        logger.debug("Obteniendo productos destacados")

        val pageable = PageRequest.of(0, featuredProductsLimit)
        return productRepository.findFeaturedWithImages(pageable)
            .content
            .map { ProductListResponse.from(it) }
    }

    /**
     * Obtiene productos relacionados
     */
    @Transactional(readOnly = true)
    fun getRelated(productId: Long): List<ProductListResponse> {
        logger.debug("Obteniendo productos relacionados para: $productId")

        val product = findById(productId)
        val categoryId = product.category?.id ?: return emptyList()

        val pageable = PageRequest.of(0, relatedProductsLimit)
        return productRepository.findRelatedProducts(categoryId, productId, pageable)
            .content
            .map { ProductListResponse.from(it) }
    }

    // ============== Operaciones admin ==============

    /**
     * Crea un nuevo producto
     */
    @Transactional
    @CacheEvict(value = ["products"], allEntries = true)
    fun create(request: CreateProductRequest): ProductResponse {
        logger.info("Creando producto: ${request.name}")

        val slug = request.slug?.takeIf { it.isNotBlank() } ?: request.name.toSlug()

        // Validaciones
        validateSlugUnique(slug)
        request.sku?.let { validateSkuUnique(it) }

        // Obtener categoría
        val category = request.categoryId?.let { catId ->
            categoryRepository.findById(catId)
                .orElseThrow { ResourceNotFoundException("Categoría", "id", catId) }
        }

        val product = Product(
            name = request.name.trim(),
            slug = slug,
            shortDescription = request.shortDescription?.trim(),
            description = request.description?.trim(),
            price = request.price,
            compareAtPrice = request.compareAtPrice,
            costPrice = request.costPrice,
            sku = request.sku?.trim(),
            barcode = request.barcode?.trim(),
            stock = request.stock,
            lowStockThreshold = request.lowStockThreshold,
            trackInventory = request.trackInventory,
            allowBackorder = request.allowBackorder,
            category = category,
            weightGrams = request.weightGrams,
            featured = request.featured,
            active = request.active,
            metaTitle = request.metaTitle,
            metaDescription = request.metaDescription
        )

        // Agregar imágenes
        request.imageUrls.forEachIndexed { index, url ->
            product.addImage(url = url, isPrimary = index == 0)
        }

        val saved = productRepository.save(product)
        logger.info("Producto creado: ${saved.id}")

        return ProductResponse.from(saved)
    }

    /**
     * Actualiza un producto existente
     */
    @Transactional
    @CacheEvict(value = ["products"], allEntries = true)
    fun update(id: Long, request: UpdateProductRequest): ProductResponse {
        logger.info("Actualizando producto: $id")

        val product = findById(id)

        request.name?.let { name ->
            product.name = name.trim()
        }

        request.slug?.let { slug ->
            if (productRepository.existsBySlugAndIdNot(slug, id)) {
                throw ResourceAlreadyExistsException("Producto", "slug", slug)
            }
            product.slug = slug
        }

        request.sku?.let { sku ->
            if (productRepository.existsBySkuAndIdNot(sku, id)) {
                throw ResourceAlreadyExistsException("Producto", "sku", sku)
            }
            product.sku = sku.trim()
        }

        request.shortDescription?.let { product.shortDescription = it.trim() }
        request.description?.let { product.description = it.trim() }
        request.price?.let { product.price = it }
        request.compareAtPrice?.let { product.compareAtPrice = it }
        request.costPrice?.let { product.costPrice = it }
        request.barcode?.let { product.barcode = it.trim() }
        request.stock?.let { product.stock = it }
        request.lowStockThreshold?.let { product.lowStockThreshold = it }
        request.trackInventory?.let { product.trackInventory = it }
        request.allowBackorder?.let { product.allowBackorder = it }
        request.weightGrams?.let { product.weightGrams = it }
        request.featured?.let { product.featured = it }
        request.active?.let { product.active = it }
        request.metaTitle?.let { product.metaTitle = it }
        request.metaDescription?.let { product.metaDescription = it }

        request.categoryId?.let { categoryId ->
            val category = categoryRepository.findById(categoryId)
                .orElseThrow { ResourceNotFoundException("Categoría", "id", categoryId) }
            product.category = category
        }

        val saved = productRepository.save(product)
        return ProductResponse.from(saved)
    }

    /**
     * Actualiza el stock de un producto
     */
    @Transactional
    @CacheEvict(value = ["products"], key = "#id")
    fun updateStock(id: Long, request: UpdateStockRequest): ProductResponse {
        logger.info("Actualizando stock del producto: $id, operación: ${request.operation}, cantidad: ${request.quantity}")

        val product = findById(id)
        val previousStock = product.stock

        when (request.operation) {
            StockOperation.ADD -> product.increaseStock(request.quantity)
            StockOperation.SUBTRACT -> {
                if (product.stock < request.quantity && !product.allowBackorder) {
                    throw InsufficientStockException(id, request.quantity, product.stock)
                }
                product.decreaseStock(request.quantity)
            }
            StockOperation.SET -> product.adjustStockTo(request.quantity)
        }

        val saved = productRepository.save(product)

        // Publicar evento si el stock bajó del umbral
        if (saved.isLowStock && previousStock > saved.lowStockThreshold) {
            eventPublisher.publishLowStockEvent(saved)
        }

        return ProductResponse.from(saved)
    }

    /**
     * Reserva stock para una orden
     */
    @Transactional
    fun reserveStock(productId: Long, quantity: Int) {
        logger.info("Reservando stock - producto: $productId, cantidad: $quantity")

        val product = findById(productId)

        if (!product.reserveStock(quantity)) {
            throw InsufficientStockException(productId, quantity, product.stock)
        }

        productRepository.save(product)

        // Verificar stock bajo
        if (product.isLowStock) {
            eventPublisher.publishLowStockEvent(product)
        }
    }

    /**
     * Libera stock reservado (cancelación de orden)
     */
    @Transactional
    fun releaseStock(productId: Long, quantity: Int) {
        logger.info("Liberando stock - producto: $productId, cantidad: $quantity")

        val product = findById(productId)
        product.releaseStock(quantity)
        productRepository.save(product)
    }

    /**
     * Agrega una imagen a un producto
     */
    @Transactional
    @CacheEvict(value = ["products"], key = "#productId")
    fun addImage(productId: Long, request: AddProductImageRequest): ProductImageResponse {
        logger.info("Agregando imagen al producto: $productId")

        val product = findById(productId)
        val image = product.addImage(
            url = request.url,
            altText = request.altText,
            isPrimary = request.isPrimary
        )

        productRepository.save(product)
        return ProductImageResponse.from(image)
    }

    /**
     * Elimina una imagen de un producto
     */
    @Transactional
    @CacheEvict(value = ["products"], key = "#productId")
    fun removeImage(productId: Long, imageId: Long) {
        logger.info("Eliminando imagen $imageId del producto: $productId")

        val product = findById(productId)

        if (!product.removeImage(imageId)) {
            throw ResourceNotFoundException("Imagen", "id", imageId)
        }

        productRepository.save(product)
    }

    /**
     * Establece imagen primaria
     */
    @Transactional
    @CacheEvict(value = ["products"], key = "#productId")
    fun setPrimaryImage(productId: Long, imageId: Long) {
        logger.info("Estableciendo imagen primaria $imageId para producto: $productId")

        val product = findById(productId)

        if (!product.setPrimaryImage(imageId)) {
            throw ResourceNotFoundException("Imagen", "id", imageId)
        }

        productRepository.save(product)
    }

    /**
     * Elimina (desactiva) un producto
     */
    @Transactional
    @CacheEvict(value = ["products"], allEntries = true)
    fun delete(id: Long) {
        logger.info("Desactivando producto: $id")

        val product = findById(id)
        product.unpublish()
        productRepository.save(product)
    }

    /**
     * Marca/desmarca producto como destacado
     */
    @Transactional
    @CacheEvict(value = ["products"], allEntries = true)
    fun setFeatured(id: Long, featured: Boolean) {
        logger.info("Cambiando featured a $featured para producto: $id")
        productRepository.updateFeatured(id, featured)
    }

    // ============== Métodos auxiliares ==============

    private fun findById(id: Long): Product =
        productRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Producto", "id", id) }

    private fun validateSlugUnique(slug: String) {
        if (productRepository.existsBySlug(slug)) {
            throw ResourceAlreadyExistsException("Producto", "slug", slug)
        }
    }

    private fun validateSkuUnique(sku: String) {
        if (productRepository.existsBySku(sku)) {
            throw ResourceAlreadyExistsException("Producto", "sku", sku)
        }
    }

    private fun mapSortField(sortBy: String): String = when (sortBy.lowercase()) {
        "name" -> "name"
        "price" -> "price"
        "rating" -> "averageRating"
        "newest", "createdat" -> "createdAt"
        "stock" -> "stock"
        else -> "createdAt"
    }
}