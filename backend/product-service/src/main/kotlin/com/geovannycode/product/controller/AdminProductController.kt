package com.geovannycode.product.controller

import com.geovannycode.product.dto.AddProductImageRequest
import com.geovannycode.product.dto.CreateProductRequest
import com.geovannycode.product.dto.ProductImageResponse
import com.geovannycode.product.dto.ProductResponse
import com.geovannycode.product.dto.UpdateProductRequest
import com.geovannycode.product.dto.UpdateStockRequest
import com.geovannycode.product.service.ProductService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
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
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/admin/products")
@Tag(name = "Admin Products", description = "Gestión de productos (Admin)")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
class AdminProductController(
    private val productService: ProductService
) {

    @PostMapping
    @Operation(summary = "Crear producto")
    fun create(
        @Valid @RequestBody request: CreateProductRequest
    ): ResponseEntity<ApiResponse<ProductResponse>> {
        val product = productService.create(request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(product, "Producto creado exitosamente"))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar producto")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateProductRequest
    ): ResponseEntity<ApiResponse<ProductResponse>> {
        val product = productService.update(id, request)
        return ResponseEntity.ok(ApiResponse.success(product, "Producto actualizado"))
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Actualizar stock")
    fun updateStock(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateStockRequest
    ): ResponseEntity<ApiResponse<ProductResponse>> {
        val product = productService.updateStock(id, request)
        return ResponseEntity.ok(ApiResponse.success(product, "Stock actualizado"))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar producto (soft delete)")
    fun delete(
        @PathVariable id: Long
    ): ResponseEntity<ApiResponse<Nothing>> {
        productService.delete(id)
        return ResponseEntity.ok(ApiResponse.success("Producto eliminado"))
    }

    @PatchMapping("/{id}/featured")
    @Operation(summary = "Marcar/desmarcar como destacado")
    fun setFeatured(
        @PathVariable id: Long,
        @RequestParam featured: Boolean
    ): ResponseEntity<ApiResponse<Nothing>> {
        productService.setFeatured(id, featured)
        return ResponseEntity.ok(ApiResponse.success("Estado de destacado actualizado"))
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Agregar imagen")
    fun addImage(
        @PathVariable id: Long,
        @Valid @RequestBody request: AddProductImageRequest
    ): ResponseEntity<ApiResponse<ProductImageResponse>> {
        val image = productService.addImage(id, request)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(image, "Imagen agregada"))
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @Operation(summary = "Eliminar imagen")
    fun removeImage(
        @PathVariable id: Long,
        @PathVariable imageId: Long
    ): ResponseEntity<ApiResponse<Nothing>> {
        productService.removeImage(id, imageId)
        return ResponseEntity.ok(ApiResponse.success("Imagen eliminada"))
    }

    @PatchMapping("/{id}/images/{imageId}/primary")
    @Operation(summary = "Establecer imagen primaria")
    fun setPrimaryImage(
        @PathVariable id: Long,
        @PathVariable imageId: Long
    ): ResponseEntity<ApiResponse<Nothing>> {
        productService.setPrimaryImage(id, imageId)
        return ResponseEntity.ok(ApiResponse.success("Imagen primaria actualizada"))
    }
}