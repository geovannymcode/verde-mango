package com.geovannycode.verdemango.catalog.web

import com.geovannycode.verdemango.catalog.domain.ProductRating
import com.geovannycode.verdemango.catalog.repository.RatingStatsProjection
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size

// ==================== REQUEST DTOs ====================

data class CreateRatingRequest(
    @field:Min(1) @field:Max(5) val rating: Int,
    @field:Size(max = 100) val title: String? = null,
    @field:Size(max = 1000) val comment: String? = null
)

data class UpdateRatingRequest(
    @field:Min(1) @field:Max(5) val rating: Int? = null,
    @field:Size(max = 100) val title: String? = null,
    @field:Size(max = 1000) val comment: String? = null
)

// ==================== RESPONSE DTOs ====================

data class RatingResponse(
    val id: Long,
    val productId: Long,
    val userId: Long,
    val rating: Int,
    val title: String?,
    val comment: String?,
    val verifiedPurchase: Boolean,
    val helpfulCount: Int,
    val createdAt: java.time.Instant,
    val updatedAt: java.time.Instant
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
        fun from(stats: RatingStatsProjection): RatingStatsResponse {
            val total = stats.getTotal().toInt()
            if (total == 0) return empty()

            val five = (stats.getFiveStars() ?: 0L).toInt()
            val four = (stats.getFourStars() ?: 0L).toInt()
            val three = (stats.getThreeStars() ?: 0L).toInt()
            val two = (stats.getTwoStars() ?: 0L).toInt()
            val one = (stats.getOneStar() ?: 0L).toInt()

            fun pct(c: Int): Int = if (total > 0) (c * 100 / total) else 0

            return RatingStatsResponse(
                totalRatings = total,
                averageRating = stats.getAverage(),
                fiveStarCount = five, fourStarCount = four, threeStarCount = three,
                twoStarCount = two, oneStarCount = one,
                fiveStarPercentage = pct(five), fourStarPercentage = pct(four),
                threeStarPercentage = pct(three), twoStarPercentage = pct(two),
                oneStarPercentage = pct(one)
            )
        }

        fun empty() = RatingStatsResponse(
            totalRatings = 0, averageRating = null,
            fiveStarCount = 0, fourStarCount = 0, threeStarCount = 0,
            twoStarCount = 0, oneStarCount = 0,
            fiveStarPercentage = 0, fourStarPercentage = 0,
            threeStarPercentage = 0, twoStarPercentage = 0,
            oneStarPercentage = 0
        )
    }
}
