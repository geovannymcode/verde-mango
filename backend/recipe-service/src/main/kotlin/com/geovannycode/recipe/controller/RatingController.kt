package com.geovannycode.recipe.controller

import com.geovannycode.recipe.dto.CreateRatingRequest
import com.geovannycode.recipe.dto.RatingResponse
import com.geovannycode.recipe.dto.RatingStatsResponse
import com.geovannycode.recipe.dto.UpdateRatingRequest
import com.geovannycode.recipe.service.RatingService
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
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/recipes/{recipeSlug}/ratings")
@Tag(name = "Recipe Ratings", description = "Calificaciones de recetas")
class RatingController(
    private val ratingService: RatingService
) {

    @GetMapping
    @Operation(summary = "Listar calificaciones de una receta")
    fun getRatings(
        @PathVariable recipeSlug: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<RatingResponse>>> {
        val ratings = ratingService.getRatings(recipeSlug, page, size)
        return ResponseEntity.ok(ApiResponse.success(ratings))
    }

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de calificaciones")
    fun getRatingStats(@PathVariable recipeSlug: String): ResponseEntity<ApiResponse<RatingStatsResponse>> {
        val stats = ratingService.getRatingStats(recipeSlug)
        return ResponseEntity.ok(ApiResponse.success(stats))
    }

    @PostMapping
    @Operation(summary = "Calificar receta")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    fun createRating(
        @PathVariable recipeSlug: String,
        @AuthenticationPrincipal userId: Long,
        @RequestHeader("X-User-Name", required = false) userName: String?,
        @Valid @RequestBody request: CreateRatingRequest
    ): ResponseEntity<ApiResponse<RatingResponse>> {
        val rating = ratingService.createRating(recipeSlug, userId, userName, request)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(rating, "Calificación agregada"))
    }

    @PutMapping
    @Operation(summary = "Actualizar mi calificación")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    fun updateRating(
        @PathVariable recipeSlug: String,
        @AuthenticationPrincipal userId: Long,
        @Valid @RequestBody request: UpdateRatingRequest
    ): ResponseEntity<ApiResponse<RatingResponse>> {
        val rating = ratingService.updateRating(recipeSlug, userId, request)
        return ResponseEntity.ok(ApiResponse.success(rating, "Calificación actualizada"))
    }

    @DeleteMapping
    @Operation(summary = "Eliminar mi calificación")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    fun deleteRating(
        @PathVariable recipeSlug: String,
        @AuthenticationPrincipal userId: Long
    ): ResponseEntity<ApiResponse<Unit>> {
        ratingService.deleteRating(recipeSlug, userId)
        return ResponseEntity.ok(ApiResponse.success(Unit, "Calificación eliminada"))
    }
}