package com.geovannycode.recipe.controller

import com.geovannycode.recipe.dto.CategoryResponse
import com.geovannycode.recipe.dto.CategoryTreeResponse
import com.geovannycode.recipe.service.CategoryService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/recipes/categories")
@Tag(name = "Recipe Categories", description = "Categorías de recetas")
class CategoryController(
    private val categoryService: CategoryService
) {

    @GetMapping
    @Operation(summary = "Listar todas las categorías")
    fun getCategories(): ResponseEntity<ApiResponse<List<CategoryResponse>>> {
        val categories = categoryService.getAllCategories()
        return ResponseEntity.ok(ApiResponse.success(categories))
    }

    @GetMapping("/tree")
    @Operation(summary = "Árbol de categorías")
    fun getCategoryTree(): ResponseEntity<ApiResponse<List<CategoryTreeResponse>>> {
        val tree = categoryService.getCategoryTree()
        return ResponseEntity.ok(ApiResponse.success(tree))
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Detalle de categoría")
    fun getCategoryBySlug(@PathVariable slug: String): ResponseEntity<ApiResponse<CategoryResponse>> {
        val category = categoryService.getCategoryBySlug(slug)
        return ResponseEntity.ok(ApiResponse.success(category))
    }
}