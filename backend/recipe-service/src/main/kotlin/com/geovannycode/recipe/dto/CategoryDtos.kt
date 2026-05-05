package com.geovannycode.recipe.dto

import com.geovannycode.recipe.entity.RecipeCategory
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

// ==================== REQUEST DTOs ====================

data class CreateCategoryRequest(
    @field:NotBlank(message = "El nombre es requerido")
    @field:Size(max = 100)
    val name: String,

    @field:Size(max = 500)
    val description: String? = null,

    val imageUrl: String? = null,
    val parentId: Long? = null,
    val displayOrder: Int = 0
)

data class UpdateCategoryRequest(
    @field:Size(max = 100)
    val name: String? = null,

    val description: String? = null,
    val imageUrl: String? = null,
    val displayOrder: Int? = null
)

// ==================== RESPONSE DTOs ====================

data class CategoryResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val description: String?,
    val imageUrl: String?,
    val parentId: Long?,
    val parentName: String?,
    val displayOrder: Int,
    val recipeCount: Int,
    val active: Boolean,
    val children: List<CategorySummaryResponse>
) {
    companion object {
        fun from(category: RecipeCategory) = CategoryResponse(
            id = category.id,
            name = category.name,
            slug = category.slug,
            description = category.description,
            imageUrl = category.imageUrl,
            parentId = category.parent?.id,
            parentName = category.parent?.name,
            displayOrder = category.displayOrder,
            recipeCount = category.recipeCount,
            active = category.active,
            children = category.children.map { CategorySummaryResponse.from(it) }
        )
    }
}

data class CategorySummaryResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val imageUrl: String?,
    val recipeCount: Int
) {
    companion object {
        fun from(category: RecipeCategory) = CategorySummaryResponse(
            id = category.id,
            name = category.name,
            slug = category.slug,
            imageUrl = category.imageUrl,
            recipeCount = category.recipeCount
        )
    }
}

data class CategoryTreeResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val recipeCount: Int,
    val children: List<CategoryTreeResponse>
) {
    companion object {
        fun from(category: RecipeCategory): CategoryTreeResponse = CategoryTreeResponse(
            id = category.id,
            name = category.name,
            slug = category.slug,
            recipeCount = category.recipeCount,
            children = category.children.filter { it.active }.map { from(it) }
        )
    }
}