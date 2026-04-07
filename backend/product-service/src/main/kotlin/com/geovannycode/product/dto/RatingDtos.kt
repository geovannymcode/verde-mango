package com.geovannycode.product.dto

import com.geovannycode.product.entity.ProductRating
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.Instant

// ==================== REQUEST DTOs ====================

/**
 * DTO para crear un rating
 */
data class CreateRatingRequest(
    @field:Min(1, message = "El rating mínimo es 1")
    @field:Max(5, message = "El rating máximo es 5")
    val rating: Int,

    @field:Size(max = 100, message = "El título no puede exceder 100 caracteres")
    val title: String? = null,

    @field:Size(max = 1000, message = "El comentario no puede exceder 1000 caracteres")
    val comment: String? = null
)

/**
 * DTO para actualizar un rating
 */
data class UpdateRatingRequest(
    @field:Min(1)
    @field:Max(5)
    val rating: Int? = null,

    @field:Size(max = 100)
    val title: String? = null,

    @field:Size(max = 1000)
    val comment: String? = null
)

// ==================== RESPONSE DTOs ====================

/**
 * Respuesta de rating
 */
data class RatingResponse(
    val id: Long,
    val productId: Long,
    val userId: Long,
    val rating: Int,
    val title: String?,
    val comment: String?,
    val verifiedPurchase: Boolean,
    val helpfulCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(rating: ProductRating) = RatingResponse(
            id = rating.id,
            productId = rating.product.id,
            userId = rating.userId,
            rating = rating.rating.toInt(),
            title = rating.title,
            comment = rating.comment,
            verifiedPurchase = rating.verifiedPurchase,
            helpfulCount = rating.helpfulCount,
            createdAt = rating.createdAt,
            updatedAt = rating.updatedAt
        )
    }
}

/**
 * Estadísticas de ratings de un producto
 */
data class RatingStatsResponse(
    val totalRatings: Int,
    val averageRating: Double?,
    val fiveStarCount: Int,
    val fourStarCount: Int,
    val threeStarCount: Int,
    val twoStarCount: Int,
    val oneStarCount: Int,
    val fiveStarPercentage: Int,
    val fourStarPercentage: Int,
    val threeStarPercentage: Int,
    val twoStarPercentage: Int,
    val oneStarPercentage: Int
) {
    companion object {
        fun from(stats: Array<Any>?): RatingStatsResponse {
            if (stats == null || (stats[0] as Long) == 0L) {
                return empty()
            }

            val total = (stats[0] as Long).toInt()
            val avg = stats[1] as Double?
            val five = (stats[2] as Long).toInt()
            val four = (stats[3] as Long).toInt()
            val three = (stats[4] as Long).toInt()
            val two = (stats[5] as Long).toInt()
            val one = (stats[6] as Long).toInt()

            fun percentage(count: Int): Int =
                if (total > 0) (count * 100 / total) else 0

            return RatingStatsResponse(
                totalRatings = total,
                averageRating = avg,
                fiveStarCount = five,
                fourStarCount = four,
                threeStarCount = three,
                twoStarCount = two,
                oneStarCount = one,
                fiveStarPercentage = percentage(five),
                fourStarPercentage = percentage(four),
                threeStarPercentage = percentage(three),
                twoStarPercentage = percentage(two),
                oneStarPercentage = percentage(one)
            )
        }

        fun empty() = RatingStatsResponse(
            totalRatings = 0,
            averageRating = null,
            fiveStarCount = 0,
            fourStarCount = 0,
            threeStarCount = 0,
            twoStarCount = 0,
            oneStarCount = 0,
            fiveStarPercentage = 0,
            fourStarPercentage = 0,
            threeStarPercentage = 0,
            twoStarPercentage = 0,
            oneStarPercentage = 0
        )
    }
}