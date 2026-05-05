package com.geovannycode.recipe.repository

import com.geovannycode.recipe.entity.RecipeRating
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface RecipeRatingRepository : JpaRepository<RecipeRating, Long> {

    fun findByRecipeIdAndUserId(recipeId: Long, userId: Long): Optional<RecipeRating>

    fun existsByRecipeIdAndUserId(recipeId: Long, userId: Long): Boolean

    fun findByRecipeIdAndApprovedTrueOrderByCreatedAtDesc(recipeId: Long, pageable: Pageable): Page<RecipeRating>

    @Query("SELECT AVG(r.rating) FROM RecipeRating r WHERE r.recipe.id = :recipeId AND r.approved = true")
    fun getAverageRating(@Param("recipeId") recipeId: Long): Double?

    @Query("SELECT COUNT(r) FROM RecipeRating r WHERE r.recipe.id = :recipeId AND r.approved = true")
    fun countApprovedRatings(@Param("recipeId") recipeId: Long): Long

    @Query("""
        SELECT r.rating, COUNT(r) FROM RecipeRating r 
        WHERE r.recipe.id = :recipeId AND r.approved = true 
        GROUP BY r.rating ORDER BY r.rating DESC
    """)
    fun getRatingDistribution(@Param("recipeId") recipeId: Long): List<Array<Any>>

    fun findByApprovedFalseOrderByCreatedAtDesc(pageable: Pageable): Page<RecipeRating>
}