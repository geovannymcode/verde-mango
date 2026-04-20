package com.geovannycode.order.controller

import com.geovannycode.order.dto.CancelOrderRequest
import com.geovannycode.order.dto.OrderListResponse
import com.geovannycode.order.dto.OrderResponse
import com.geovannycode.order.security.UserPrincipal
import com.geovannycode.order.service.OrderService
import com.geovannycode.shared.constant.AppConstants
import com.geovannycode.shared.constant.OrderStatus
import com.geovannycode.shared.dto.ApiResponse
import com.geovannycode.shared.dto.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Órdenes del usuario")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
class OrderController(
    private val orderService: OrderService
) {

    @GetMapping
    @Operation(summary = "Listar mis órdenes")
    fun getMyOrders(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestParam(required = false) status: OrderStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<OrderListResponse>>> {
        require(page >= 0) { "El número de página no puede ser negativo" }
        val clampedSize = size.coerceIn(1, AppConstants.MAX_PAGE_SIZE)
        val orders = orderService.getUserOrders(principal.id, status, page, clampedSize)
        return ResponseEntity.ok(ApiResponse.success(orders))
    }

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Obtener detalle de orden")
    fun getOrder(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable orderNumber: String
    ): ResponseEntity<ApiResponse<OrderResponse>> {
        val order = orderService.getUserOrder(principal.id, orderNumber)
        return ResponseEntity.ok(ApiResponse.success(order))
    }

    @PostMapping("/{orderNumber}/cancel")
    @Operation(summary = "Cancelar orden")
    fun cancelOrder(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable orderNumber: String,
        @Valid @RequestBody request: CancelOrderRequest
    ): ResponseEntity<ApiResponse<OrderResponse>> {
        val order = orderService.cancelOrder(principal.id, orderNumber, request)
        return ResponseEntity.ok(ApiResponse.success(order, "Orden cancelada"))
    }
}