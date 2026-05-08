package com.geovannycode.recipe.repository

import com.geovannycode.recipe.entity.RecipeTag
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface RecipeTagRepository : JpaRepository<RecipeTag, Long> {

    fun findBySlug(slug: String): Optional<RecipeTag>

    fun existsBySlug(slug: String): Boolean

    fun findByNameIgnoreCase(name: String): Optional<RecipeTag>

    @Query("SELECT t FROM RecipeTag t ORDER BY t.recipeCount DESC")
    fun findPopularTags(): List<RecipeTag>

    @Query("SELECT t FROM RecipeTag t WHERE t.recipeCount > 0 ORDER BY t.name")
    fun findTagsWithRecipes(): List<RecipeTag>

    fun findBySlugIn(slugs: List<String>): List<RecipeTag>
}