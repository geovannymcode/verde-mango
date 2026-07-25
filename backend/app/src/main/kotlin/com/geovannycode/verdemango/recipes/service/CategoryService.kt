package com.geovannycode.verdemango.recipes.service

import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import com.geovannycode.verdemango.recipes.domain.RecipeCategory
import com.geovannycode.verdemango.recipes.repository.RecipeCategoryRepository
import com.geovannycode.verdemango.recipes.web.CategoryResponse
import com.geovannycode.verdemango.recipes.web.CategorySummaryResponse
import com.geovannycode.verdemango.recipes.web.CategoryTreeResponse
import com.geovannycode.verdemango.recipes.web.CreateCategoryRequest
import com.geovannycode.verdemango.recipes.web.UpdateCategoryRequest
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service("recipeCategoryService")
class CategoryService(
    private val categoryRepository: RecipeCategoryRepository,
    private val slugGenerator: SlugGenerator
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ==================== Consultas públicas ====================

    @Transactional(readOnly = true)
    @Cacheable(value = ["recipeCategories"], key = "'all'")
    fun getAllCategories(): List<CategoryResponse> {
        return categoryRepository.findRootCategoriesWithChildren()
            .map { CategoryResponse.from(it) }
    }

    @Transactional(readOnly = true)
    @Cacheable(value = ["recipeCategories"], key = "'tree'")
    fun getCategoryTree(): List<CategoryTreeResponse> {
        return categoryRepository.findRootCategoriesWithChildren()
            .map { CategoryTreeResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getCategoryBySlug(slug: String): CategoryResponse {
        val category = categoryRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow { ResourceNotFoundException("Categoría", "slug", slug) }
        return CategoryResponse.from(category)
    }

    @Transactional(readOnly = true)
    fun getSubcategories(parentId: Long): List<CategorySummaryResponse> {
        return categoryRepository.findByParentIdAndActiveTrue(parentId)
            .map { CategorySummaryResponse.from(it) }
    }

    // ==================== Admin ====================

    @Transactional
    @CacheEvict(value = ["recipeCategories"], allEntries = true)
    fun createCategory(request: CreateCategoryRequest): CategoryResponse {
        val slug = slugGenerator.generateUnique(request.name) { categoryRepository.existsBySlug(it) }

        val parent = request.parentId?.let { parentId ->
            categoryRepository.findById(parentId)
                .orElseThrow { ResourceNotFoundException("Categoría padre", "id", parentId) }
        }

        val category = RecipeCategory(
            name = request.name,
            slug = slug,
            description = request.description,
            imageUrl = request.imageUrl,
            parent = parent,
            displayOrder = request.displayOrder
        )

        val saved = categoryRepository.save(category)
        logger.info("Categoría creada: ${saved.name} (${saved.slug})")

        return CategoryResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipeCategories"], allEntries = true)
    fun updateCategory(id: Long, request: UpdateCategoryRequest): CategoryResponse {
        val category = categoryRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Categoría", "id", id) }

        request.name?.let {
            category.name = it
            category.slug = slugGenerator.generateUnique(it) { slug ->
                categoryRepository.existsBySlug(slug) && category.slug != slug
            }
        }
        request.description?.let { category.description = it }
        request.imageUrl?.let { category.imageUrl = it }
        request.displayOrder?.let { category.displayOrder = it }

        val saved = categoryRepository.save(category)
        logger.info("Categoría actualizada: ${saved.name}")

        return CategoryResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipeCategories"], allEntries = true)
    fun deleteCategory(id: Long) {
        val category = categoryRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Categoría", "id", id) }

        if (category.recipeCount > 0) {
            throw IllegalStateException("No se puede eliminar una categoría con recetas")
        }

        categoryRepository.delete(category)
        logger.info("Categoría eliminada: ${category.name}")
    }

    @Transactional
    @CacheEvict(value = ["recipeCategories"], allEntries = true)
    fun toggleActive(id: Long): CategoryResponse {
        val category = categoryRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Categoría", "id", id) }

        if (category.active) {
            category.deactivate()
        } else {
            category.activate()
        }

        val saved = categoryRepository.save(category)
        return CategoryResponse.from(saved)
    }
}
