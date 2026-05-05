package com.geovannycode.recipe.dto

import com.geovannycode.recipe.entity.RecipeTag
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateTagRequest(
    @field:NotBlank(message = "El nombre es requerido")
    @field:Size(max = 50)
    val name: String
)

data class TagResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val recipeCount: Int
) {
    companion object {
        fun from(tag: RecipeTag) = TagResponse(
            id = tag.id,
            name = tag.name,
            slug = tag.slug,
            recipeCount = tag.recipeCount
        )
    }
}