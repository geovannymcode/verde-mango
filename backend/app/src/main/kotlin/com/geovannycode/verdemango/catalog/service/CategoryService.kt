package com.geovannycode.verdemango.catalog.service

import com.geovannycode.verdemango.catalog.domain.Category
import com.geovannycode.verdemango.catalog.repository.CategoryRepository
import com.geovannycode.verdemango.catalog.web.CategoryResponse
import com.geovannycode.verdemango.catalog.web.CategorySummary
import com.geovannycode.verdemango.catalog.web.CategoryWithChildren
import com.geovannycode.verdemango.catalog.web.CreateCategoryRequest
import com.geovannycode.verdemango.catalog.web.ReorderCategoriesRequest
import com.geovannycode.verdemango.catalog.web.UpdateCategoryRequest
import com.geovannycode.verdemango.common.domain.ResourceAlreadyExistsException
import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import com.geovannycode.verdemango.common.domain.toSlug
import com.geovannycode.verdemango.common.domain.BusinessRuleException
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.domain.Sort
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CategoryService(
    private val categoryRepository: CategoryRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ============== Consultas públicas ==============

    @Transactional(readOnly = true)
    @Cacheable(value = ["categories"], key = "'all'")
    fun getAllActive(): List<CategorySummary> {
        logger.debug("Obteniendo todas las categorías activas")

        return categoryRepository.findByActiveTrueOrderBySortOrderAsc()
            .map { CategorySummary.from(it, it.activeProductCount) }
    }

    @Transactional(readOnly = true)
    @Cacheable(value = ["categories"], key = "'menu'")
    fun getCategoryMenu(): List<CategoryWithChildren> {
        logger.debug("Obteniendo menú de categorías")

        return categoryRepository.findRootCategoriesWithChildren()
            .map { CategoryWithChildren.from(it) }
    }

    @Transactional(readOnly = true)
    fun getBySlug(slug: String): CategoryResponse {
        val category = categoryRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow { ResourceNotFoundException("Categoría", "slug", slug) }

        return CategoryResponse.from(category, category.activeProductCount)
    }

    @Transactional(readOnly = true)
    fun getById(id: Long): CategoryResponse {
        val category = findById(id)
        return CategoryResponse.from(category, category.products.size)
    }

    @Transactional(readOnly = true)
    fun getAllAdmin(search: String?, active: Boolean?): List<CategoryResponse> {
        val filters = mutableListOf<Specification<Category>>()
        active?.let { value -> filters.add(Specification { root, _, cb -> cb.equal(root.get<Boolean>("active"), value) }) }
        search?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
            filters.add(Specification { root, _, cb -> cb.like(cb.lower(root.get("name")), "%${value.lowercase()}%") })
        }
        return categoryRepository.findAll(Specification.allOf(filters), Sort.by("sortOrder", "name", "id"))
            .map { CategoryResponse.from(it, it.products.size) }
    }

    // ============== Operaciones admin ==============

    @Transactional
    @CacheEvict(value = ["categories", "products"], allEntries = true)
    fun create(request: CreateCategoryRequest): CategoryResponse {
        logger.info("Creando categoría: ${request.name}")

        val slug = request.slug?.takeIf { it.isNotBlank() } ?: request.name.toSlug()

        if (categoryRepository.existsBySlug(slug)) {
            throw ResourceAlreadyExistsException("Categoría", "slug", slug)
        }

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

    @Transactional
    @CacheEvict(value = ["categories", "products"], allEntries = true)
    fun update(id: Long, request: UpdateCategoryRequest): CategoryResponse {
        logger.info("Actualizando categoría: $id")

        val category = findById(id)

        request.name?.let { category.name = it.trim() }
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
            require(parentId != id) { "Una categoría no puede ser su propio padre" }

            val parent = categoryRepository.findById(parentId)
                .orElseThrow { ResourceNotFoundException("Categoría padre", "id", parentId) }
            category.parent = parent
        }

        val saved = categoryRepository.save(category)
        return CategoryResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["categories", "products"], allEntries = true)
    fun delete(id: Long) {
        logger.info("Desactivando categoría: $id")

        val category = findById(id)
        fun countAssociated(node: Category): Int = node.products.size + node.children.sumOf { countAssociated(it) }
        val count = countAssociated(category)
        if (count > 0) throw BusinessRuleException("No se puede eliminar: hay $count productos asociados a esta categoría o sus subcategorías.", "CATEGORY_HAS_PRODUCTS")
        category.deactivate(includeChildren = true)
        categoryRepository.save(category)
    }

    @Transactional
    @CacheEvict(value = ["categories", "products"], allEntries = true)
    fun reorder(request: ReorderCategoriesRequest) {
        logger.info("Reordenando ${request.categoryOrders.size} categorías")

        require(request.categoryOrders.map { it.categoryId }.distinct().size == request.categoryOrders.size) { "Categorías repetidas" }
        request.categoryOrders.forEach { order ->
            require(order.sortOrder >= 0) { "El orden no puede ser negativo" }
            findById(order.categoryId)
            categoryRepository.updateSortOrder(order.categoryId, order.sortOrder)
        }
    }

    // ============== Métodos privados ==============

    private fun findById(id: Long): Category =
        categoryRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Categoría", "id", id) }
}
