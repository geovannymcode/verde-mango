package com.geovannycode.product.service

import com.geovannycode.product.dto.CategoryResponse
import com.geovannycode.product.dto.CategorySummary
import com.geovannycode.product.dto.CategoryWithChildren
import com.geovannycode.product.dto.CreateCategoryRequest
import com.geovannycode.product.dto.ReorderCategoriesRequest
import com.geovannycode.product.dto.UpdateCategoryRequest
import com.geovannycode.product.entity.Category
import com.geovannycode.product.repository.CategoryRepository
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import com.geovannycode.shared.exception.ResourceNotFoundException
import com.geovannycode.shared.util.toSlug
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CategoryService(
    private val categoryRepository: CategoryRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ============== Consultas públicas ==============

    /**
     * Obtiene todas las categorías activas ordenadas
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["categories"], key = "'all'")
    fun getAllActive(): List<CategorySummary> {
        logger.debug("Obteniendo todas las categorías activas")

        return categoryRepository.findByActiveTrueOrderBySortOrderAsc()
            .map { CategorySummary.from(it, it.activeProductCount) }
    }

    /**
     * Obtiene categorías raíz con sus hijos (para menú de navegación)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["categories"], key = "'menu'")
    fun getCategoryMenu(): List<CategoryWithChildren> {
        logger.debug("Obteniendo menú de categorías")

        return categoryRepository.findRootCategoriesWithChildren()
            .map { CategoryWithChildren.from(it) }
    }

    /**
     * Obtiene una categoría por slug
     */
    @Transactional(readOnly = true)
    fun getBySlug(slug: String): CategoryResponse {
        val category = categoryRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow { ResourceNotFoundException("Categoría", "slug", slug) }

        return CategoryResponse.from(category, category.activeProductCount)
    }

    /**
     * Obtiene una categoría por ID
     */
    @Transactional(readOnly = true)
    fun getById(id: Long): CategoryResponse {
        val category = findById(id)
        return CategoryResponse.from(category, category.activeProductCount)
    }

    // ============== Operaciones admin ==============

    /**
     * Crea una nueva categoría
     */
    @Transactional
    @CacheEvict(value = ["categories"], allEntries = true)
    fun create(request: CreateCategoryRequest): CategoryResponse {
        logger.info("Creando categoría: ${request.name}")

        val slug = request.slug?.takeIf { it.isNotBlank() } ?: request.name.toSlug()

        // Verificar slug único
        if (categoryRepository.existsBySlug(slug)) {
            throw ResourceAlreadyExistsException("Categoría", "slug", slug)
        }

        // Obtener categoría padre si se especifica
        val parent = request.parentId?.let { parentId ->
            categoryRepository.findById(parentId)
                .orElseThrow { ResourceNotFoundException("Categoría padre", "id", parentId) }
        }

        val category = Category(
            name = request.name.trim(),
            slug = slug,
            description = request.description?.trim(),
            imageUrl = request.imageUrl,
            parent = parent,
            sortOrder = request.sortOrder,
            metaTitle = request.metaTitle,
            metaDescription = request.metaDescription
        )

        val saved = categoryRepository.save(category)
        logger.info("Categoría creada: ${saved.id}")

        return CategoryResponse.from(saved)
    }

    /**
     * Actualiza una categoría existente
     */
    @Transactional
    @CacheEvict(value = ["categories"], allEntries = true)
    fun update(id: Long, request: UpdateCategoryRequest): CategoryResponse {
        logger.info("Actualizando categoría: $id")

        val category = findById(id)

        request.name?.let { name ->
            category.name = name.trim()
        }

        request.slug?.let { slug ->
            if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
                throw ResourceAlreadyExistsException("Categoría", "slug", slug)
            }
            category.slug = slug
        }

        request.description?.let { category.description = it.trim() }
        request.imageUrl?.let { category.imageUrl = it }
        request.sortOrder?.let { category.sortOrder = it }
        request.active?.let { category.active = it }
        request.metaTitle?.let { category.metaTitle = it }
        request.metaDescription?.let { category.metaDescription = it }

        request.parentId?.let { parentId ->
            // Evitar referencias circulares
            require(parentId != id) { "Una categoría no puede ser su propio padre" }

            val parent = categoryRepository.findById(parentId)
                .orElseThrow { ResourceNotFoundException("Categoría padre", "id", parentId) }
            category.parent = parent
        }

        val saved = categoryRepository.save(category)
        return CategoryResponse.from(saved)
    }

    /**
     * Elimina (desactiva) una categoría
     */
    @Transactional
    @CacheEvict(value = ["categories"], allEntries = true)
    fun delete(id: Long) {
        logger.info("Desactivando categoría: $id")

        val category = findById(id)
        category.deactivate(includeChildren = true)
        categoryRepository.save(category)
    }

    /**
     * Reordena categorías
     */
    @Transactional
    @CacheEvict(value = ["categories"], allEntries = true)
    fun reorder(request: ReorderCategoriesRequest) {
        logger.info("Reordenando ${request.categoryOrders.size} categorías")

        request.categoryOrders.forEach { order ->
            categoryRepository.updateSortOrder(order.categoryId, order.sortOrder)
        }
    }

    // ============== Métodos privados ==============

    private fun findById(id: Long): Category =
        categoryRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Categoría", "id", id) }
}