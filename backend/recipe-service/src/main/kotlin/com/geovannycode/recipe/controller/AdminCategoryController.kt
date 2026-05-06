package com.geovannycode.recipe.controller

import com.geovannycode.recipe.dto.CategoryResponse
import com.geovannycode.recipe.dto.CreateCategoryRequest
import com.geovannycode.recipe.dto.UpdateCategoryRequest
import com.geovannycode.recipe.service.CategoryService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/admin/recipes/categories")
@Tag(name = "Admin - Categories", description = "Gestión de categorías (Admin)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
class AdminCategoryController(
    private val categoryService: CategoryService
) {

    @PostMapping
    @Operation(summary = "Crear categoría")
    fun createCategory(
        @Valid @RequestBody request: CreateCategoryRequest
    ): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.createCategory(request)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(category, "Categoría creada"))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar categoría")
    fun updateCategory(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateCategoryRequest
    ): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.updateCategory(id, request)
        return ResponseEntity.ok(ApiResponse.success(category, "Categoría actualizada"))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar categoría")
    fun deleteCategory(@PathVariable id: Long): ResponseEntity<ApiResponse<Unit>> {
        categoryService.deleteCategory(id)
        return ResponseEntity.ok(ApiResponse.success(Unit, "Categoría eliminada"))
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Activar/Desactivar categoría")
    fun toggleActive(@PathVariable id: Long): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.toggleActive(id)
        val message = if (category.active) "Categoría activada" else "Categoría desactivada"
        return ResponseEntity.ok(ApiResponse.success(category, message))
    }
}