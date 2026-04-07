package com.geovannycode.product.controller

import com.geovannycode.product.dto.CategoryResponse
import com.geovannycode.product.dto.CreateCategoryRequest
import com.geovannycode.product.dto.ReorderCategoriesRequest
import com.geovannycode.product.dto.UpdateCategoryRequest
import com.geovannycode.product.service.CategoryService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping


@RestController
@RequestMapping("/api/v1/admin/categories")
@Tag(name = "Admin Categories", description = "Gestión de categorías (Admin)")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
class AdminCategoryController(
    private val categoryService: CategoryService
) {

    @GetMapping("/{id}")
    @Operation(summary = "Obtener categoría por ID")
    fun getById(
        @PathVariable id: Long
    ): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.getById(id)
        return ResponseEntity.ok(ApiResponse.success(category))
    }

    @PostMapping
    @Operation(summary = "Crear categoría")
    fun create(
        @Valid @RequestBody request: CreateCategoryRequest
    ): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.create(request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(category, "Categoría creada exitosamente"))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar categoría")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateCategoryRequest
    ): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.update(id, request)
        return ResponseEntity.ok(ApiResponse.success(category, "Categoría actualizada"))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar categoría (soft delete)")
    fun delete(
        @PathVariable id: Long
    ): ResponseEntity<ApiResponse<Nothing>> {
        categoryService.delete(id)
        return ResponseEntity.ok(ApiResponse.success("Categoría eliminada"))
    }

    @PostMapping("/reorder")
    @Operation(summary = "Reordenar categorías")
    fun reorder(
        @Valid @RequestBody request: ReorderCategoriesRequest
    ): ResponseEntity<ApiResponse<Nothing>> {
        categoryService.reorder(request)
        return ResponseEntity.ok(ApiResponse.success("Categorías reordenadas"))
    }
}