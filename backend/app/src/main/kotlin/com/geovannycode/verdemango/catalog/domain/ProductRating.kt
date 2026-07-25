package com.geovannycode.verdemango.catalog.domain

import com.geovannycode.verdemango.common.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(
    name = "product_ratings",
    indexes = [
        Index(name = "idx_product_ratings_product_id", columnList = "product_id"),
        Index(name = "idx_product_ratings_user_id", columnList = "user_id"),
        Index(name = "idx_product_ratings_approved", columnList = "approved")
    ]
)
class ProductRating(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    val product: Product,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(name = "rating", nullable = false)
    var rating: Short,

    @Column(name = "title", length = 100)
    var title: String? = null,

    @Column(name = "comment", columnDefinition = "TEXT")
    var comment: String? = null,

    @Column(name = "verified_purchase", nullable = false)
    var verifiedPurchase: Boolean = false,

    @Column(name = "approved", nullable = false)
    var approved: Boolean = true,

    @Column(name = "helpful_count", nullable = false)
    var helpfulCount: Int = 0

) : BaseEntity() {

    init {
        require(rating.toInt() in 1..5) { "Rating debe estar entre 1 y 5" }
    }

    val ratingValue: Int
        get() = rating.toInt()

    val hasComment: Boolean
        get() = !comment.isNullOrBlank()

    val isPositive: Boolean
        get() = rating >= 4.toShort()

    val isNegative: Boolean
        get() = rating <= 2.toShort()

    val isNeutral: Boolean
        get() = rating == 3.toShort()

    fun markAsHelpful() {
        this.helpfulCount++
    }

    fun approve() {
        this.approved = true
    }

    fun reject() {
        this.approved = false
    }

    fun updateRating(newRating: Int) {
        require(newRating in 1..5) { "Rating debe estar entre 1 y 5" }
        this.rating = newRating.toShort()
    }

    override fun toString(): String =
        "ProductRating(id=$id, productId=${product.id}, userId=$userId, rating=$rating, approved=$approved)"
}
