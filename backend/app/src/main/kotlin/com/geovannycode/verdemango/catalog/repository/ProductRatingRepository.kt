package com.geovannycode.verdemango.catalog.repository

import com.geovannycode.verdemango.catalog.domain.ProductRating
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ProductRatingRepository : JpaRepository<ProductRating, Long> {

    fun findByProductIdAndApprovedTrue(productId: Long, pageable: Pageable): Page<ProductRating>

    fun findByProductId(productId: Long, pageable: Pageable): Page<ProductRating>

    fun findByProductIdAndUserId(productId: Long, userId: Long): Optional<ProductRating>

    fun existsByProductIdAndUserId(productId: Long, userId: Long): Boolean

    @Query("""
        SELECT 
            COUNT(r) AS total,
            AVG(r.rating) AS average,
            SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS fiveStars,
            SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS fourStars,
            SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS threeStars,
            SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS twoStars,
            SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS oneStar
        FROM ProductRating r 
        WHERE r.product.id = :productId AND r.approved = true
    """)
    fun getRatingStatistics(productId: Long): RatingStatsProjection

    fun findByUserId(userId: Long, pageable: Pageable): Page<ProductRating>

    fun countByUserId(userId: Long): Long

    fun findByApprovedFalse(pageable: Pageable): Page<ProductRating>

    @Modifying
    @Query("UPDATE ProductRating r SET r.approved = true WHERE r.id = :id")
    fun approve(id: Long): Int

    @Modifying
    @Query("UPDATE ProductRating r SET r.approved = false WHERE r.id = :id")
    fun reject(id: Long): Int

    @Modifying
    @Query("UPDATE ProductRating r SET r.helpfulCount = r.helpfulCount + 1 WHERE r.id = :id")
    fun incrementHelpfulCount(id: Long): Int

    @Query("""
        SELECT r FROM ProductRating r 
        WHERE r.product.id = :productId 
        AND r.approved = true 
        AND r.verifiedPurchase = true 
        ORDER BY r.createdAt DESC
    """)
    fun findVerifiedRatings(productId: Long, pageable: Pageable): Page<ProductRating>
}

interface RatingStatsProjection {
    fun getTotal(): Long
    fun getAverage(): Double?
    fun getFiveStars(): Long?
    fun getFourStars(): Long?
    fun getThreeStars(): Long?
    fun getTwoStars(): Long?
    fun getOneStar(): Long?
}
