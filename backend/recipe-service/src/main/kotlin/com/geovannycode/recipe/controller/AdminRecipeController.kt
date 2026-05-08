package com.geovannycode.recipe.controller

import com.geovannycode.recipe.dto.CreateRecipeRequest
import com.geovannycode.recipe.dto.RecipeListResponse
import com.geovannycode.recipe.dto.RecipeResponse
import com.geovannycode.recipe.dto.UpdateRecipeRequest
import com.geovannycode.recipe.entity.RecipeStatus
import com.geovannycode.recipe.service.RecipeService
import com.geovannycode.shared.dto.ApiResponse
import com.geovannycode.shared.dto.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/admin/recipes")
@Tag(name = "Admin - Recipes", description = "Gestión de recetas (Admin)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
class AdminRecipeController(
    private val recipeService: RecipeService
) {

    @GetMapping
    @Operation(summary = "Listar todas las recetas")
    fun getAllRecipes(
        @RequestParam(required = false) status: RecipeStatus?,
        @RequestParam(required = false) search: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<RecipeListResponse>>> {
        val recipes = recipeService.getAllRecipesForAdmin(status, search, page, size)
        return ResponseEntity.ok(ApiResponse.success(recipes))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener receta por ID")
    fun getRecipeById(@PathVariable id: Long): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.getRecipeById(id)
        return ResponseEntity.ok(ApiResponse.success(recipe))
    }

    @PostMapping
    @Operation(summary = "Crear receta")
    fun createRecipe(
        @Valid @RequestBody request: CreateRecipeRequest,
        @AuthenticationPrincipal adminId: Long,
        @RequestHeader("X-User-Name", required = false) adminName: String?
    ): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.createRecipe(request, adminId, adminName)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(recipe, "Receta creada"))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar receta")
    fun updateRecipe(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateRecipeRequest
    ): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.updateRecipe(id, request)
        return ResponseEntity.ok(ApiResponse.success(recipe, "Receta actualizada"))
    }

    @PatchMapping("/{id}/publish")
    @Operation(summary = "Publicar receta")
    fun publishRecipe(@PathVariable id: Long): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.publishRecipe(id)
        return ResponseEntity.ok(ApiResponse.success(recipe, "Receta publicada"))
    }

    @PatchMapping("/{id}/unpublish")
    @Operation(summary = "Despublicar receta")
    fun unpublishRecipe(@PathVariable id: Long): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.unpublishRecipe(id)
        return ResponseEntity.ok(ApiResponse.success(recipe, "Receta despublicada"))
    }

    @PatchMapping("/{id}/feature")
    @Operation(summary = "Marcar como destacada")
    fun featureRecipe(
        @PathVariable id: Long,
        @RequestParam featured: Boolean
    ): ResponseEntity<ApiResponse<RecipeResponse>> {
        val recipe = recipeService.featureRecipe(id, featured)
        val message = if (featured) "Receta destacada" else "Receta quitada de destacadas"
        return ResponseEntity.ok(ApiResponse.success(recipe, message))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar receta")
    fun deleteRecipe(@PathVariable id: Long): ResponseEntity<ApiResponse<Unit>> {
        recipeService.deleteRecipe(id)
        return ResponseEntity.ok(ApiResponse.success(Unit, "Receta eliminada"))
    }
}