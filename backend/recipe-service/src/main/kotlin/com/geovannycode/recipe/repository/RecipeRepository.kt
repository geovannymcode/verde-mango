package com.geovannycode.recipe.repository

import com.geovannycode.recipe.entity.Recipe
import com.geovannycode.recipe.entity.RecipeDifficulty
import com.geovannycode.recipe.entity.RecipeStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface RecipeRepository : JpaRepository<Recipe, Long>, JpaSpecificationExecutor<Recipe> {

    // ==================== Búsquedas básicas ====================

    fun findBySlug(slug: String): Optional<Recipe>

    fun findBySlugAndStatus(slug: String, status: RecipeStatus): Optional<Recipe>

    fun existsBySlug(slug: String): Boolean

    @Query("SELECT r FROM Recipe r LEFT JOIN FETCH r.steps LEFT JOIN FETCH r.ingredients LEFT JOIN FETCH r.images WHERE r.slug = :slug")
    fun findBySlugWithDetails(slug: String): Optional<Recipe>

    @Query("SELECT r FROM Recipe r LEFT JOIN FETCH r.steps LEFT JOIN FETCH r.ingredients LEFT JOIN FETCH r.images LEFT JOIN FETCH r.tags WHERE r.id = :id")
    fun findByIdWithDetails(@Param("id") id: Long): Optional<Recipe>

    // ==================== Listados públicos ====================

    fun findByStatusOrderByPublishedAtDesc(status: RecipeStatus, pageable: Pageable): Page<Recipe>

    @Query("SELECT r FROM Recipe r WHERE r.status = 'PUBLISHED' AND r.featured = true ORDER BY r.publishedAt DESC")
    fun findFeaturedRecipes(pageable: Pageable): Page<Recipe>

    @Query("SELECT r FROM Recipe r WHERE r.status = 'PUBLISHED' ORDER BY r.views DESC")
    fun findPopularRecipes(pageable: Pageable): Page<Recipe>

    @Query("SELECT r FROM Recipe r WHERE r.status = 'PUBLISHED' ORDER BY r.ratingAverage DESC, r.ratingCount DESC")
    fun findTopRatedRecipes(pageable: Pageable): Page<Recipe>

    @Query("SELECT r FROM Recipe r WHERE r.status = 'PUBLISHED' ORDER BY r.publishedAt DESC")
    fun findLatestRecipes(pageable: Pageable): Page<Recipe>

    // ==================== Búsquedas por categoría ====================

    fun findByCategoryIdAndStatus(categoryId: Long, status: RecipeStatus, pageable: Pageable): Page<Recipe>

    @Query("SELECT r FROM Recipe r WHERE r.category.slug = :slug AND r.status = 'PUBLISHED' ORDER BY r.publishedAt DESC")
    fun findByCategorySlug(@Param("slug") slug: String, pageable: Pageable): Page<Recipe>

    // ==================== Búsquedas por tag ====================

    @Query("SELECT r FROM Recipe r JOIN r.tags t WHERE t.slug = :tagSlug AND r.status = 'PUBLISHED' ORDER BY r.publishedAt DESC")
    fun findByTagSlug(@Param("tagSlug") tagSlug: String, pageable: Pageable): Page<Recipe>

    // ==================== Búsquedas por filtros ====================

    @Query("""
        SELECT r FROM Recipe r 
        WHERE r.status = 'PUBLISHED'
        AND (:difficulty IS NULL OR r.difficulty = :difficulty)
        AND (:categoryId IS NULL OR r.category.id = :categoryId)
        AND (:maxTime IS NULL OR (r.prepTime + r.cookTime) <= :maxTime)
        ORDER BY r.publishedAt DESC
    """)
    fun findWithFilters(
        @Param("difficulty") difficulty: RecipeDifficulty?,
        @Param("categoryId") categoryId: Long?,
        @Param("maxTime") maxTime: Int?,
        pageable: Pageable
    ): Page<Recipe>

    // ==================== Búsqueda de texto ====================

    @Query("""
        SELECT r FROM Recipe r 
        WHERE r.status = 'PUBLISHED'
        AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(r.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY r.publishedAt DESC
    """)
    fun searchByText(@Param("query") query: String, pageable: Pageable): Page<Recipe>

    // ==================== Admin ====================

    @Query("""
        SELECT r FROM Recipe r 
        WHERE (:status IS NULL OR r.status = :status)
        AND (:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY r.updatedAt DESC
    """)
    fun findAllForAdmin(
        @Param("status") status: RecipeStatus?,
        @Param("search") search: String?,
        pageable: Pageable
    ): Page<Recipe>

    fun countByStatus(status: RecipeStatus): Long

    // ==================== Actualizaciones ====================

    @Modifying
    @Query("UPDATE Recipe r SET r.views = r.views + 1 WHERE r.id = :id")
    fun incrementViews(@Param("id") id: Long)

    // ==================== Recetas relacionadas ====================

    @Query("""
        SELECT r FROM Recipe r 
        WHERE r.status = 'PUBLISHED' 
        AND r.category.id = :categoryId 
        AND r.id != :excludeId 
        ORDER BY r.ratingAverage DESC
    """)
    fun findRelatedRecipes(
        @Param("categoryId") categoryId: Long,
        @Param("excludeId") excludeId: Long,
        pageable: Pageable
    ): List<Recipe>
}