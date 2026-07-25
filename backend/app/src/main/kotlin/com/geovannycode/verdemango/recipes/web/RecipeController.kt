package com.geovannycode.verdemango.recipes.web

import com.geovannycode.verdemango.common.domain.ApiResponse
import com.geovannycode.verdemango.common.domain.PageResponse
import com.geovannycode.verdemango.recipes.domain.RecipeDifficulty
import com.geovannycode.verdemango.recipes.service.RecipeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/recipes")
@Tag(name = "Recipes", description = "Recetas públicas")
class RecipeController(
    private val recipeService: RecipeService
) {

    @GetMapping
    @Operation(summary = "Listar recetas publicadas")
    fun getRecipes(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "12") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<RecipeListResponse>>> {
        val recipes = recipeService.getPublishedRecipes(page, size)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/featured")
    @Operation(summary = "Recetas destacadas")
    fun getFeaturedRecipes(): ResponseEntity<ApiResponse<List<RecipeListResponse>>> {
        val recipes = recipeService.getFeaturedRecipes()
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/popular")
    @Operation(summary = "Recetas populares")
    fun getPopularRecipes(): ResponseEntity<ApiResponse<List<RecipeListResponse>>> {
        val recipes = recipeService.getPopularRecipes()
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/latest")
    @Operation(summary = "Últimas recetas")
    fun getLatestRecipes(
        @RequestParam(defaultValue = "6") limit: Int
    ): ResponseEntity<ApiResponse<List<RecipeListResponse>>> {
        val recipes = recipeService.getLatestRecipes(limit)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/top-rated")
    @Operation(summary = "Recetas mejor calificadas")
    fun getTopRatedRecipes(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<ApiResponse<List<RecipeListResponse>>> {
        val recipes = recipeService.getTopRatedRecipes(limit)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Detalle de receta por slug")
    fun getRecipeBySlug(@PathVariable slug: String): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.getRecipeBySlug(slug)
        return ResponseEntity.ok(ApiResponse.success(recipe))
    }

    @GetMapping("/{slug}/related")
    @Operation(summary = "Recetas relacionadas")
    fun getRelatedRecipes(
        @PathVariable slug: String,
        @RequestParam(defaultValue = "4") limit: Int
    ): ResponseEntity<ApiResponse<List<RecipeListResponse>>> {
        val recipes = recipeService.getRelatedRecipes(slug, limit)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/category/{categorySlug}")
    @Operation(summary = "Recetas por categoría")
    fun getRecipesByCategory(
        @PathVariable categorySlug: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "12") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<RecipeListResponse>>> {
        val recipes = recipeService.getRecipesByCategory(categorySlug, page, size)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/tag/{tagSlug}")
    @Operation(summary = "Recetas por tag")
    fun getRecipesByTag(
        @PathVariable tagSlug: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "12") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<RecipeListResponse>>> {
        val recipes = recipeService.getRecipesByTag(tagSlug, page, size)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar recetas")
    fun searchRecipes(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) tag: String?,
        @RequestParam(required = false) difficulty: RecipeDifficulty?,
        @RequestParam(required = false) maxTime: Int?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "12") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<RecipeListResponse>>> {
        val params = RecipeFilterParams(
            search = search, categorySlug = category, tagSlug = tag,
            difficulty = difficulty, maxTime = maxTime, page = page, size = size
        )
        val recipes = recipeService.searchRecipes(params)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }
}
