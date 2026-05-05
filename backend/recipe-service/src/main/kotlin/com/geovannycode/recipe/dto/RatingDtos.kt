package com.geovannycode.recipe.dto

import com.geovannycode.recipe.entity.RecipeRating
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.Instant

// ==================== REQUEST DTOs ====================

data class CreateRatingRequest(
    @field:Min(1, message = "El rating mínimo es 1")
    @field:Max(5, message = "El rating máximo es 5")
    val rating: Int,

    @field:Size(max = 2000, message = "El comentario no puede exceder 2000 caracteres")
    val comment: String? = null,

    val madeRecipe: Boolean = false
)

data class UpdateRatingRequest(
    @field:Min(1)
    @field:Max(5)
    val rating: Int? = null,

    @field:Size(max = 2000)
    val comment: String? = null,

    val madeRecipe: Boolean? = null
)

// ==================== RESPONSE DTOs ====================

data class RatingResponse(
    val id: Long,
    val userId: Long,
    val userName: String?,
    val rating: Int,
    val comment: String?,
    val madeRecipe: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(rating: RecipeRating) = RatingResponse(
            id = rating.id,
            userId = rating.userId,
            userName = rating.userName,
            rating = rating.rating,
            comment = rating.comment,
            madeRecipe = rating.madeRecipe,
            createdAt = rating.createdAt
        )
    }
}

data class RatingStatsResponse(
    val averageRating: Double,
    val totalRatings: Long,
    val distribution: Map<Int, Long>
)