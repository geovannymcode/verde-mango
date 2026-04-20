package com.geovannycode.order.controller

import com.geovannycode.order.dto.AddToCartRequest
import com.geovannycode.order.dto.CartResponse
import com.geovannycode.order.dto.CartSummaryResponse
import com.geovannycode.order.dto.UpdateCartItemRequest
import com.geovannycode.order.security.UserPrincipal
import com.geovannycode.order.service.CartService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

import java.util.UUID

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Cart", description = "Carrito de compras")
class CartController(
    private val cartService: CartService
) {

    @GetMapping
    @Operation(summary = "Obtener carrito actual")
    fun getCart(
        @AuthenticationPrincipal principal: UserPrincipal?,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartResponse>> {
        val userId = principal?.id
        val sessionId = getOrCreateSessionId(request, userId)
        val cart = cartService.getCart(userId, sessionId)
        return buildResponseWithSessionId(ApiResponse.success(cart), sessionId)
    }

    @GetMapping("/summary")
    @Operation(summary = "Obtener resumen del carrito")
    fun getCartSummary(
        @AuthenticationPrincipal principal: UserPrincipal?,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartSummaryResponse>> {
        val userId = principal?.id
        val sessionId = getOrCreateSessionId(request, userId)
        val summary = cartService.getCartSummary(userId, sessionId)
        return ResponseEntity.ok(ApiResponse.success(summary))
    }

    @PostMapping("/items")
    @Operation(summary = "Agregar producto al carrito")
    fun addItem(
        @AuthenticationPrincipal principal: UserPrincipal?,
        @Valid @RequestBody request: AddToCartRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartResponse>> {
        val userId = principal?.id
        val sessionId = getOrCreateSessionId(httpRequest, userId)
        val cart = cartService.addItem(userId, sessionId, request)
        return ResponseEntity.ok(ApiResponse.success(cart, "Producto agregado al carrito"))
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Actualizar cantidad de un item")
    fun updateItemQuantity(
        @AuthenticationPrincipal principal: UserPrincipal?,
        @PathVariable productId: Long,
        @Valid @RequestBody request: UpdateCartItemRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartResponse>> {
        val userId = principal?.id
        val sessionId = getOrCreateSessionId(httpRequest, userId)
        val cart = cartService.updateItemQuantity(userId, sessionId, productId, request)
        return ResponseEntity.ok(ApiResponse.success(cart, "Cantidad actualizada"))
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Eliminar item del carrito")
    fun removeItem(
        @AuthenticationPrincipal principal: UserPrincipal?,
        @PathVariable productId: Long,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartResponse>> {
        val userId = principal?.id
        val sessionId = getOrCreateSessionId(httpRequest, userId)
        val cart = cartService.removeItem(userId, sessionId, productId)
        return ResponseEntity.ok(ApiResponse.success(cart, "Producto eliminado"))
    }

    @DeleteMapping
    @Operation(summary = "Vaciar carrito")
    fun clearCart(
        @AuthenticationPrincipal principal: UserPrincipal?,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartResponse>> {
        val userId = principal?.id
        val sessionId = getOrCreateSessionId(request, userId)
        val cart = cartService.clearCart(userId, sessionId)
        return ResponseEntity.ok(ApiResponse.success(cart, "Carrito vaciado"))
    }

    @PostMapping("/merge")
    @Operation(summary = "Fusionar carrito de sesión con usuario")
    fun mergeCart(
        @AuthenticationPrincipal principal: UserPrincipal,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<CartResponse>> {
        val userId = principal.id
        val sessionId = request.getHeader("X-Session-Id") ?: return ResponseEntity.ok(
            ApiResponse.success(cartService.getCart(userId, null))
        )
        val cart = cartService.mergeGuestCart(userId, sessionId)
        return ResponseEntity.ok(ApiResponse.success(cart, "Carrito fusionado"))
    }

    private fun getOrCreateSessionId(request: HttpServletRequest, userId: Long?): String? {
        if (userId != null) return null
        return request.getHeader("X-Session-Id") ?: UUID.randomUUID().toString()
    }

    private fun <T> buildResponseWithSessionId(
        body: ApiResponse<T>,
        sessionId: String?
    ): ResponseEntity<ApiResponse<T>> {
        val builder = ResponseEntity.ok()
        if (sessionId != null) {
            builder.header("X-Session-Id", sessionId)
        }
        return builder.body(body)
    }
}