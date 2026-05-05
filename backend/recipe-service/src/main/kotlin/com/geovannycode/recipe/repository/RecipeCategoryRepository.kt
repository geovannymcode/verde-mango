package com.geovannycode.recipe.repository

import com.geovannycode.recipe.entity.RecipeCategory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface RecipeCategoryRepository : JpaRepository<RecipeCategory, Long> {

    fun findBySlug(slug: String): Optional<RecipeCategory>

    fun findBySlugAndActiveTrue(slug: String): Optional<RecipeCategory>

    fun existsBySlug(slug: String): Boolean

    @Query("SELECT c FROM RecipeCategory c WHERE c.parent IS NULL AND c.active = true ORDER BY c.displayOrder")
    fun findRootCategories(): List<RecipeCategory>

    @Query("SELECT c FROM RecipeCategory c WHERE c.active = true ORDER BY c.displayOrder")
    fun findAllActive(): List<RecipeCategory>

    @Query("SELECT c FROM RecipeCategory c LEFT JOIN FETCH c.children WHERE c.parent IS NULL AND c.active = true ORDER BY c.displayOrder")
    fun findRootCategoriesWithChildren(): List<RecipeCategory>

    fun findByParentIdAndActiveTrue(parentId: Long): List<RecipeCategory>

    @Query("SELECT c FROM RecipeCategory c WHERE c.recipeCount > 0 AND c.active = true ORDER BY c.recipeCount DESC")
    fun findPopularCategories(): List<RecipeCategory>
}