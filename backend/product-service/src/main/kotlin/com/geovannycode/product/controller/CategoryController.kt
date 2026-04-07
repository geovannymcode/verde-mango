package com.geovannycode.product.controller

import com.geovannycode.product.dto.CategoryResponse
import com.geovannycode.product.dto.CategorySummary
import com.geovannycode.product.dto.CategoryWithChildren
import com.geovannycode.product.service.CategoryService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories", description = "Categorías de productos")
class CategoryController(
    private val categoryService: CategoryService
) {

    @GetMapping
    @Operation(summary = "Listar todas las categorías activas")
    fun getAll(): ResponseEntity<ApiResponse<List<CategorySummary>>> {
        val categories = categoryService.getAllActive()
        return ResponseEntity.ok(ApiResponse.success(categories))
    }

    @GetMapping("/menu")
    @Operation(summary = "Obtener menú de categorías con subcategorías")
    fun getMenu(): ResponseEntity<ApiResponse<List<CategoryWithChildren>>> {
        val menu = categoryService.getCategoryMenu()
        return ResponseEntity.ok(ApiResponse.success(menu))
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Obtener categoría por slug")
    fun getBySlug(
        @PathVariable slug: String
    ): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.getBySlug(slug)
        return ResponseEntity.ok(ApiResponse.success(category))
    }
}