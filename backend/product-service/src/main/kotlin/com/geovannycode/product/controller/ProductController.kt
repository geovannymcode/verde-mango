package com.geovannycode.product.controller

import com.geovannycode.product.dto.ProductListResponse
import com.geovannycode.product.dto.ProductResponse
import com.geovannycode.product.service.ProductService
import com.geovannycode.shared.dto.ApiResponse
import com.geovannycode.shared.dto.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Catálogo de productos")
class ProductController(
    private val productService: ProductService
) {

    @GetMapping
    @Operation(summary = "Listar productos con filtros y paginación")
    fun getProducts(
        @Parameter(description = "Filtrar por slug de categoría")
        @RequestParam(required = false) category: String?,

        @Parameter(description = "Precio mínimo")
        @RequestParam(required = false) minPrice: Long?,

        @Parameter(description = "Precio máximo")
        @RequestParam(required = false) maxPrice: Long?,

        @Parameter(description = "Solo productos en stock")
        @RequestParam(required = false) inStock: Boolean?,

        @Parameter(description = "Búsqueda por texto")
        @RequestParam(required = false) search: String?,

        @Parameter(description = "Número de página (desde 0)")
        @RequestParam(defaultValue = "0") page: Int,

        @Parameter(description = "Tamaño de página")
        @RequestParam(defaultValue = "20") size: Int,

        @Parameter(description = "Campo para ordenar: name, price, rating, newest")
        @RequestParam(defaultValue = "newest") sortBy: String,

        @Parameter(description = "Dirección: asc, desc")
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<ApiResponse<PageResponse<ProductListResponse>>> {
        val products = productService.getProducts(
            categorySlug = category,
            minPrice = minPrice,
            maxPrice = maxPrice,
            inStock = inStock,
            search = search,
            page = page,
            size = size,
            sortBy = sortBy,
            sortDir = sortDir
        )
        return ResponseEntity.ok(ApiResponse.success(products))
    }

    @GetMapping("/featured")
    @Operation(summary = "Obtener productos destacados")
    fun getFeatured(): ResponseEntity<ApiResponse<List<ProductListResponse>>> {
        val products = productService.getFeatured()
        return ResponseEntity.ok(ApiResponse.success(products))
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Obtener producto por slug")
    fun getBySlug(
        @PathVariable slug: String
    ): ResponseEntity<ApiResponse<ProductResponse>> {
        val product = productService.getBySlug(slug)
        return ResponseEntity.ok(ApiResponse.success(product))
    }

    @GetMapping("/{id}/related")
    @Operation(summary = "Obtener productos relacionados")
    fun getRelated(
        @PathVariable id: Long
    ): ResponseEntity<ApiResponse<List<ProductListResponse>>> {
        val products = productService.getRelated(id)
        return ResponseEntity.ok(ApiResponse.success(products))
    }
}