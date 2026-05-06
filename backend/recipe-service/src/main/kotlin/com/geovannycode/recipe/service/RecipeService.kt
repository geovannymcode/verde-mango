package com.geovannycode.recipe.service

import com.geovannycode.recipe.dto.CreateRecipeRequest
import com.geovannycode.recipe.dto.RecipeFilterParams
import com.geovannycode.recipe.dto.RecipeListResponse
import com.geovannycode.recipe.dto.RecipeResponse
import com.geovannycode.recipe.dto.UpdateRecipeRequest
import com.geovannycode.recipe.entity.Recipe
import com.geovannycode.recipe.entity.RecipeStatus
import com.geovannycode.recipe.repository.RecipeCategoryRepository
import com.geovannycode.recipe.repository.RecipeRepository
import com.geovannycode.recipe.repository.RecipeTagRepository
import com.geovannycode.shared.dto.PageResponse
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class RecipeService(
    private val recipeRepository: RecipeRepository,
    private val categoryRepository: RecipeCategoryRepository,
    private val tagRepository: RecipeTagRepository,
    private val slugGenerator: SlugGenerator,
    @Value("\${recipe.featured-limit:6}")
    private val featuredLimit: Int,
    @Value("\${recipe.popular-limit:10}")
    private val popularLimit: Int
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ==================== Consultas públicas ====================

    @Transactional(readOnly = true)
    fun getPublishedRecipes(page: Int, size: Int): PageResponse<RecipeListResponse> {
        val pageable = PageRequest.of(page, size)
        val recipePage = recipeRepository.findByStatusOrderByPublishedAtDesc(RecipeStatus.PUBLISHED, pageable)

        return PageResponse.of(
            content = recipePage.content.map { RecipeListResponse.from(it) },
            page = page,
            size = size,
            totalElements = recipePage.totalElements
        )
    }

    @Transactional(readOnly = true)
    @Cacheable(value = ["recipes"], key = "'featured'")
    fun getFeaturedRecipes(): List<RecipeListResponse> {
        val pageable = PageRequest.of(0, featuredLimit)
        return recipeRepository.findFeaturedRecipes(pageable)
            .content.map { RecipeListResponse.from(it) }
    }

    @Transactional(readOnly = true)
    @Cacheable(value = ["recipes"], key = "'popular'")
    fun getPopularRecipes(): List<RecipeListResponse> {
        val pageable = PageRequest.of(0, popularLimit)
        return recipeRepository.findPopularRecipes(pageable)
            .content.map { RecipeListResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getLatestRecipes(limit: Int = 6): List<RecipeListResponse> {
        val pageable = PageRequest.of(0, limit)
        return recipeRepository.findLatestRecipes(pageable)
            .content.map { RecipeListResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getTopRatedRecipes(limit: Int = 10): List<RecipeListResponse> {
        val pageable = PageRequest.of(0, limit)
        return recipeRepository.findTopRatedRecipes(pageable)
            .content.map { RecipeListResponse.from(it) }
    }

    @Transactional
    fun getRecipeBySlug(slug: String): RecipeResponse {
        val recipe = recipeRepository.findBySlugWithDetails(slug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", slug) }

        if (!recipe.isPublished) {
            throw ResourceNotFoundException("Receta", "slug", slug)
        }

        // Incrementar vistas (async en producción)
        recipeRepository.incrementViews(recipe.id)

        return RecipeResponse.from(recipe)
    }

    @Transactional(readOnly = true)
    fun getRecipesByCategory(categorySlug: String, page: Int, size: Int): PageResponse<RecipeListResponse> {
        val pageable = PageRequest.of(page, size)
        val recipePage = recipeRepository.findByCategorySlug(categorySlug, pageable)

        return PageResponse.of(
            content = recipePage.content.map { RecipeListResponse.from(it) },
            page = page,
            size = size,
            totalElements = recipePage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getRecipesByTag(tagSlug: String, page: Int, size: Int): PageResponse<RecipeListResponse> {
        val pageable = PageRequest.of(page, size)
        val recipePage = recipeRepository.findByTagSlug(tagSlug, pageable)

        return PageResponse.of(
            content = recipePage.content.map { RecipeListResponse.from(it) },
            page = page,
            size = size,
            totalElements = recipePage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun searchRecipes(params: RecipeFilterParams): PageResponse<RecipeListResponse> {
        val pageable = PageRequest.of(params.page, params.size)

        val recipePage = when {
            !params.search.isNullOrBlank() -> recipeRepository.searchByText(params.search, pageable)
            !params.categorySlug.isNullOrBlank() -> recipeRepository.findByCategorySlug(params.categorySlug, pageable)
            !params.tagSlug.isNullOrBlank() -> recipeRepository.findByTagSlug(params.tagSlug, pageable)
            else -> {
                val categoryId = params.categorySlug?.let {
                    categoryRepository.findBySlug(it).orElse(null)?.id
                }
                recipeRepository.findWithFilters(params.difficulty, categoryId, params.maxTime, pageable)
            }
        }

        return PageResponse.of(
            content = recipePage.content.map { RecipeListResponse.from(it) },
            page = params.page,
            size = params.size,
            totalElements = recipePage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getRelatedRecipes(recipeSlug: String, limit: Int = 4): List<RecipeListResponse> {
        val recipe = recipeRepository.findBySlug(recipeSlug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", recipeSlug) }

        val categoryId = recipe.category?.id ?: return emptyList()
        val pageable = PageRequest.of(0, limit)

        return recipeRepository.findRelatedRecipes(categoryId, recipe.id, pageable)
            .map { RecipeListResponse.from(it) }
    }

    // ==================== Admin ====================

    @Transactional(readOnly = true)
    fun getAllRecipesForAdmin(status: RecipeStatus?, search: String?, page: Int, size: Int): PageResponse<RecipeListResponse> {
        val pageable = PageRequest.of(page, size)
        val recipePage = recipeRepository.findAllForAdmin(status, search, pageable)

        return PageResponse.of(
            content = recipePage.content.map { RecipeListResponse.from(it) },
            page = page,
            size = size,
            totalElements = recipePage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getRecipeById(id: Long): RecipeResponse {
        val recipe = recipeRepository.findByIdWithDetails(id)
            .orElseThrow { ResourceNotFoundException("Receta", "id", id) }
        return RecipeResponse.from(recipe)
    }

    @Transactional
    @CacheEvict(value = ["recipes"], allEntries = true)
    fun createRecipe(request: CreateRecipeRequest, authorId: Long?, authorName: String?): RecipeResponse {
        val slug = slugGenerator.generateUnique(request.title) { recipeRepository.existsBySlug(it) }

        val category = request.categoryId?.let { catId ->
            categoryRepository.findById(catId)
                .orElseThrow { ResourceNotFoundException("Categoría", "id", catId) }
        }

        val recipe = Recipe(
            title = request.title,
            slug = slug,
            description = request.description,
            introduction = request.introduction,
            tips = request.tips,
            prepTime = request.prepTime,
            cookTime = request.cookTime,
            servings = request.servings,
            servingsUnit = request.servingsUnit,
            difficulty = request.difficulty,
            category = category,
            primaryImageUrl = request.primaryImageUrl,
            metaTitle = request.metaTitle ?: request.title.take(70),
            metaDescription = request.metaDescription ?: request.description.take(160),
            calories = request.calories,
            proteinGrams = request.proteinGrams,
            carbsGrams = request.carbsGrams,
            fatGrams = request.fatGrams,
            fiberGrams = request.fiberGrams,
            authorId = authorId,
            authorName = authorName
        )

        // Agregar pasos
        request.steps.forEach { stepReq ->
            recipe.addStep(
                instruction = stepReq.instruction,
                tip = stepReq.tip,
                imageUrl = stepReq.imageUrl
            ).also { it.estimatedTime = stepReq.estimatedTime }
        }

        // Agregar ingredientes
        request.ingredients.forEach { ingReq ->
            recipe.addIngredient(
                name = ingReq.name,
                quantity = ingReq.quantity,
                unit = ingReq.unit,
                group = ingReq.ingredientGroup,
                optional = ingReq.optional,
                productId = ingReq.productId
            )
        }

        // Agregar tags
        if (request.tagIds.isNotEmpty()) {
            val tags = tagRepository.findAllById(request.tagIds)
            tags.forEach { recipe.addTag(it) }
        }

        val saved = recipeRepository.save(recipe)
        logger.info("Receta creada: ${saved.title} (${saved.slug})")

        return RecipeResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipes"], allEntries = true)
    fun updateRecipe(id: Long, request: UpdateRecipeRequest): RecipeResponse {
        val recipe = recipeRepository.findByIdWithDetails(id)
            .orElseThrow { ResourceNotFoundException("Receta", "id", id) }

        // Actualizar campos básicos
        request.title?.let {
            recipe.title = it
            recipe.slug = slugGenerator.generateUnique(it) { slug ->
                recipeRepository.existsBySlug(slug) && recipe.slug != slug
            }
        }
        request.description?.let { recipe.description = it }
        request.introduction?.let { recipe.introduction = it }
        request.tips?.let { recipe.tips = it }
        request.prepTime?.let { recipe.prepTime = it }
        request.cookTime?.let { recipe.cookTime = it }
        request.servings?.let { recipe.servings = it }
        request.servingsUnit?.let { recipe.servingsUnit = it }
        request.difficulty?.let { recipe.difficulty = it }
        request.primaryImageUrl?.let { recipe.primaryImageUrl = it }
        request.metaTitle?.let { recipe.metaTitle = it }
        request.metaDescription?.let { recipe.metaDescription = it }
        request.calories?.let { recipe.calories = it }
        request.proteinGrams?.let { recipe.proteinGrams = it }
        request.carbsGrams?.let { recipe.carbsGrams = it }
        request.fatGrams?.let { recipe.fatGrams = it }
        request.fiberGrams?.let { recipe.fiberGrams = it }

        // Actualizar categoría
        request.categoryId?.let { catId ->
            recipe.category = categoryRepository.findById(catId)
                .orElseThrow { ResourceNotFoundException("Categoría", "id", catId) }
        }

        // Actualizar pasos (reemplazar todos)
        request.steps?.let { newSteps ->
            recipe.steps.clear()
            newSteps.forEach { stepReq ->
                recipe.addStep(stepReq.instruction, stepReq.tip, stepReq.imageUrl)
                    .also { it.estimatedTime = stepReq.estimatedTime }
            }
            recipe.reorderSteps()
        }

        // Actualizar ingredientes (reemplazar todos)
        request.ingredients?.let { newIngredients ->
            recipe.ingredients.clear()
            newIngredients.forEach { ingReq ->
                recipe.addIngredient(
                    name = ingReq.name,
                    quantity = ingReq.quantity,
                    unit = ingReq.unit,
                    group = ingReq.ingredientGroup,
                    optional = ingReq.optional,
                    productId = ingReq.productId
                )
            }
        }

        // Actualizar tags
        request.tagIds?.let { newTagIds ->
            recipe.tags.clear()
            val tags = tagRepository.findAllById(newTagIds)
            tags.forEach { recipe.addTag(it) }
        }

        val saved = recipeRepository.save(recipe)
        logger.info("Receta actualizada: ${saved.title}")

        return RecipeResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipes"], allEntries = true)
    fun publishRecipe(id: Long): RecipeResponse {
        val recipe = recipeRepository.findByIdWithDetails(id)
            .orElseThrow { ResourceNotFoundException("Receta", "id", id) }

        recipe.publish()

        // Actualizar contador de categoría
        recipe.category?.incrementRecipeCount()

        val saved = recipeRepository.save(recipe)
        logger.info("Receta publicada: ${saved.title}")

        return RecipeResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipes"], allEntries = true)
    fun unpublishRecipe(id: Long): RecipeResponse {
        val recipe = recipeRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Receta", "id", id) }

        // Actualizar contador de categoría antes de despublicar
        if (recipe.isPublished) {
            recipe.category?.decrementRecipeCount()
        }

        recipe.unpublish()
        val saved = recipeRepository.save(recipe)
        logger.info("Receta despublicada: ${saved.title}")

        return RecipeResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipes"], allEntries = true)
    fun featureRecipe(id: Long, featured: Boolean): RecipeResponse {
        val recipe = recipeRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Receta", "id", id) }

        if (featured) {
            recipe.feature()
        } else {
            recipe.unfeature()
        }

        val saved = recipeRepository.save(recipe)
        return RecipeResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["recipes"], allEntries = true)
    fun deleteRecipe(id: Long) {
        val recipe = recipeRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Receta", "id", id) }

        // Actualizar contador de categoría
        if (recipe.isPublished) {
            recipe.category?.decrementRecipeCount()
        }

        recipeRepository.delete(recipe)
        logger.info("Receta eliminada: ${recipe.title}")
    }
}