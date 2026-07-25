package com.geovannycode.verdemango.catalog.web

import com.geovannycode.verdemango.catalog.service.RatingService
import com.geovannycode.verdemango.common.domain.ApiResponse
import com.geovannycode.verdemango.common.domain.PageResponse
import com.geovannycode.verdemango.common.security.UserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/products/{productId}/ratings")
@Tag(name = "Ratings", description = "Calificaciones y reseñas de productos")
class RatingController(
    private val ratingService: RatingService
) {

    @GetMapping
    @Operation(summary = "Listar ratings de un producto")
    fun getRatings(
        @PathVariable productId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String
    ): ResponseEntity<ApiResponse<PageResponse<RatingResponse>>> {
        val ratings = ratingService.getRatings(productId, page, size, sortBy)
        return ResponseEntity.ok(ApiResponse.success(ratings))
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtener estadísticas de ratings")
    fun getStats(
        @PathVariable productId: Long
    ): ResponseEntity<ApiResponse<RatingStatsResponse>> {
        val stats = ratingService.getRatingStats(productId)
        return ResponseEntity.ok(ApiResponse.success(stats))
    }

    @PostMapping
    @Operation(summary = "Crear un rating")
    fun createRating(
        @PathVariable productId: Long,
        @Valid @RequestBody request: CreateRatingRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<RatingResponse>> {
        val rating = ratingService.createRating(productId, principal.id, request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(rating, "Rating creado exitosamente"))
    }

    @PutMapping("/{ratingId}")
    @Operation(summary = "Actualizar un rating")
    fun updateRating(
        @PathVariable productId: Long,
        @PathVariable ratingId: Long,
        @Valid @RequestBody request: UpdateRatingRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<RatingResponse>> {
        val rating = ratingService.updateRating(ratingId, principal.id, request)
        return ResponseEntity.ok(ApiResponse.success(rating))
    }

    @DeleteMapping("/{ratingId}")
    @Operation(summary = "Eliminar un rating")
    fun deleteRating(
        @PathVariable productId: Long,
        @PathVariable ratingId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<Nothing>> {
        ratingService.deleteRating(ratingId, principal.id)
        return ResponseEntity.ok(ApiResponse.success("Rating eliminado"))
    }

    @PostMapping("/{ratingId}/helpful")
    @Operation(summary = "Marcar rating como útil")
    fun markAsHelpful(
        @PathVariable productId: Long,
        @PathVariable ratingId: Long
    ): ResponseEntity<ApiResponse<Nothing>> {
        ratingService.markAsHelpful(ratingId)
        return ResponseEntity.ok(ApiResponse.success("Marcado como útil"))
    }
}
