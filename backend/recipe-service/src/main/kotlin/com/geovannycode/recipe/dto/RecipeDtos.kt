package com.geovannycode.recipe.dto

import com.geovannycode.recipe.entity.Recipe
import com.geovannycode.recipe.entity.RecipeDifficulty
import com.geovannycode.recipe.entity.RecipeImage
import com.geovannycode.recipe.entity.RecipeIngredient
import com.geovannycode.recipe.entity.RecipeStatus
import com.geovannycode.recipe.entity.RecipeStep
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant

// ==================== REQUEST DTOs ====================

data class CreateRecipeRequest(
    @field:NotBlank(message = "El título es requerido")
    @field:Size(max = 200)
    val title: String,

    @field:NotBlank(message = "La descripción es requerida")
    val description: String,

    val introduction: String? = null,
    val tips: String? = null,

    @field:Min(0)
    val prepTime: Int = 0,

    @field:Min(0)
    val cookTime: Int = 0,

    @field:Min(1)
    val servings: Int = 4,

    val servingsUnit: String = "porciones",

    val difficulty: RecipeDifficulty = RecipeDifficulty.MEDIUM,

    val categoryId: Long? = null,

    val primaryImageUrl: String? = null,

    val metaTitle: String? = null,
    val metaDescription: String? = null,

    // Nutrición
    val calories: Int? = null,
    val proteinGrams: BigDecimal? = null,
    val carbsGrams: BigDecimal? = null,
    val fatGrams: BigDecimal? = null,
    val fiberGrams: BigDecimal? = null,

    @field:Valid
    val steps: List<RecipeStepRequest> = emptyList(),

    @field:Valid
    val ingredients: List<RecipeIngredientRequest> = emptyList(),

    val tagIds: List<Long> = emptyList()
)

data class UpdateRecipeRequest(
    @field:Size(max = 200)
    val title: String? = null,

    val description: String? = null,
    val introduction: String? = null,
    val tips: String? = null,

    @field:Min(0)
    val prepTime: Int? = null,

    @field:Min(0)
    val cookTime: Int? = null,

    @field:Min(1)
    val servings: Int? = null,

    val servingsUnit: String? = null,
    val difficulty: RecipeDifficulty? = null,
    val categoryId: Long? = null,
    val primaryImageUrl: String? = null,
    val metaTitle: String? = null,
    val metaDescription: String? = null,

    val calories: Int? = null,
    val proteinGrams: BigDecimal? = null,
    val carbsGrams: BigDecimal? = null,
    val fatGrams: BigDecimal? = null,
    val fiberGrams: BigDecimal? = null,

    @field:Valid
    val steps: List<RecipeStepRequest>? = null,

    @field:Valid
    val ingredients: List<RecipeIngredientRequest>? = null,

    val tagIds: List<Long>? = null
)

data class RecipeStepRequest(
    @field:Min(1)
    val stepNumber: Int,

    @field:NotBlank(message = "La instrucción es requerida")
    val instruction: String,

    val imageUrl: String? = null,
    val tip: String? = null,
    val estimatedTime: Int? = null
)

data class RecipeIngredientRequest(
    @field:NotBlank(message = "El nombre del ingrediente es requerido")
    val name: String,

    val quantity: BigDecimal? = null,
    val unit: String? = null,
    val preparationNotes: String? = null,
    val ingredientGroup: String? = null,
    val displayOrder: Int = 0,
    val optional: Boolean = false,
    val productId: Long? = null
)

data class RecipeFilterParams(
    val search: String? = null,
    val categorySlug: String? = null,
    val tagSlug: String? = null,
    val difficulty: RecipeDifficulty? = null,
    val maxTime: Int? = null,
    val page: Int = 0,
    val size: Int = 12
)

// ==================== RESPONSE DTOs ====================

data class RecipeResponse(
    val id: Long,
    val title: String,
    val slug: String,
    val description: String,
    val introduction: String?,
    val tips: String?,
    val prepTime: Int,
    val cookTime: Int,
    val totalTime: Int,
    val totalTimeFormatted: String,
    val servings: Int,
    val servingsUnit: String,
    val difficulty: RecipeDifficulty,
    val difficultyLabel: String,
    val category: CategorySummaryResponse?,
    val status: RecipeStatus,
    val featured: Boolean,
    val primaryImageUrl: String?,
    val nutrition: NutritionResponse?,
    val views: Long,
    val ratingCount: Int,
    val ratingAverage: BigDecimal,
    val ratingFormatted: String,
    val authorName: String?,
    val steps: List<RecipeStepResponse>,
    val ingredients: List<RecipeIngredientResponse>,
    val images: List<RecipeImageResponse>,
    val tags: List<TagResponse>,
    val publishedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(recipe: Recipe) = RecipeResponse(
            id = recipe.id,
            title = recipe.title,
            slug = recipe.slug,
            description = recipe.description,
            introduction = recipe.introduction,
            tips = recipe.tips,
            prepTime = recipe.prepTime,
            cookTime = recipe.cookTime,
            totalTime = recipe.totalTime,
            totalTimeFormatted = recipe.totalTimeFormatted,
            servings = recipe.servings,
            servingsUnit = recipe.servingsUnit,
            difficulty = recipe.difficulty,
            difficultyLabel = recipe.difficultyLabel,
            category = recipe.category?.let { CategorySummaryResponse.from(it) },
            status = recipe.status,
            featured = recipe.featured,
            primaryImageUrl = recipe.primaryImageUrl,
            nutrition = if (recipe.hasNutritionInfo) NutritionResponse.from(recipe) else null,
            views = recipe.views,
            ratingCount = recipe.ratingCount,
            ratingAverage = recipe.ratingAverage,
            ratingFormatted = recipe.ratingFormatted,
            authorName = recipe.authorName,
            steps = recipe.steps.map { RecipeStepResponse.from(it) },
            ingredients = recipe.ingredients.map { RecipeIngredientResponse.from(it) },
            images = recipe.images.map { RecipeImageResponse.from(it) },
            tags = recipe.tags.map { TagResponse.from(it) },
            publishedAt = recipe.publishedAt,
            createdAt = recipe.createdAt,
            updatedAt = recipe.updatedAt
        )
    }
}

data class RecipeListResponse(
    val id: Long,
    val title: String,
    val slug: String,
    val description: String,
    val primaryImageUrl: String?,
    val totalTime: Int,
    val totalTimeFormatted: String,
    val difficulty: RecipeDifficulty,
    val difficultyLabel: String,
    val category: CategorySummaryResponse?,
    val ratingAverage: BigDecimal,
    val ratingCount: Int,
    val featured: Boolean,
    val publishedAt: Instant?
) {
    companion object {
        fun from(recipe: Recipe) = RecipeListResponse(
            id = recipe.id,
            title = recipe.title,
            slug = recipe.slug,
            description = recipe.description,
            primaryImageUrl = recipe.primaryImageUrl,
            totalTime = recipe.totalTime,
            totalTimeFormatted = recipe.totalTimeFormatted,
            difficulty = recipe.difficulty,
            difficultyLabel = recipe.difficultyLabel,
            category = recipe.category?.let { CategorySummaryResponse.from(it) },
            ratingAverage = recipe.ratingAverage,
            ratingCount = recipe.ratingCount,
            featured = recipe.featured,
            publishedAt = recipe.publishedAt
        )
    }
}

data class RecipeStepResponse(
    val id: Long,
    val stepNumber: Int,
    val instruction: String,
    val imageUrl: String?,
    val tip: String?,
    val estimatedTime: Int?
) {
    companion object {
        fun from(step: RecipeStep) = RecipeStepResponse(
            id = step.id,
            stepNumber = step.stepNumber,
            instruction = step.instruction,
            imageUrl = step.imageUrl,
            tip = step.tip,
            estimatedTime = step.estimatedTime
        )
    }
}

data class RecipeIngredientResponse(
    val id: Long,
    val name: String,
    val quantity: BigDecimal?,
    val unit: String?,
    val preparationNotes: String?,
    val ingredientGroup: String?,
    val optional: Boolean,
    val formatted: String,
    val productId: Long?,
    val productName: String?,
    val productSlug: String?,
    val isLinkedToProduct: Boolean
) {
    companion object {
        fun from(ingredient: RecipeIngredient) = RecipeIngredientResponse(
            id = ingredient.id,
            name = ingredient.name,
            quantity = ingredient.quantity,
            unit = ingredient.unit,
            preparationNotes = ingredient.preparationNotes,
            ingredientGroup = ingredient.ingredientGroup,
            optional = ingredient.optional,
            formatted = ingredient.formatted,
            productId = ingredient.productId,
            productName = ingredient.productName,
            productSlug = ingredient.productSlug,
            isLinkedToProduct = ingredient.isLinkedToProduct
        )
    }
}

data class RecipeImageResponse(
    val id: Long,
    val imageUrl: String,
    val altText: String?,
    val caption: String?,
    val isPrimary: Boolean
) {
    companion object {
        fun from(image: RecipeImage) = RecipeImageResponse(
            id = image.id,
            imageUrl = image.imageUrl,
            altText = image.altText,
            caption = image.caption,
            isPrimary = image.isPrimary
        )
    }
}

data class NutritionResponse(
    val calories: Int?,
    val proteinGrams: BigDecimal?,
    val carbsGrams: BigDecimal?,
    val fatGrams: BigDecimal?,
    val fiberGrams: BigDecimal?
) {
    companion object {
        fun from(recipe: Recipe) = NutritionResponse(
            calories = recipe.calories,
            proteinGrams = recipe.proteinGrams,
            carbsGrams = recipe.carbsGrams,
            fatGrams = recipe.fatGrams,
            fiberGrams = recipe.fiberGrams
        )
    }
}