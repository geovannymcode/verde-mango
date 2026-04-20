package com.geovannycode.order.controller

import com.geovannycode.order.dto.OrderFilterParams
import com.geovannycode.order.dto.OrderListResponse
import com.geovannycode.order.dto.OrderResponse
import com.geovannycode.order.dto.OrderStatsResponse
import com.geovannycode.order.dto.UpdateOrderStatusRequest
import com.geovannycode.order.security.UserPrincipal
import com.geovannycode.order.service.OrderService
import com.geovannycode.shared.constant.OrderStatus
import com.geovannycode.shared.dto.ApiResponse
import com.geovannycode.shared.dto.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.temporal.ChronoUnit

@RestController
@RequestMapping("/api/v1/admin/orders")
@Tag(name = "Admin - Orders", description = "Gestión de órdenes (Admin)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
class AdminOrderController(
    private val orderService: OrderService
) {

    @GetMapping
    @Operation(summary = "Listar todas las órdenes")
    fun getAllOrders(
        @RequestParam(required = false) status: OrderStatus?,
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) fromDate: Instant?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) toDate: Instant?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<ApiResponse<PageResponse<OrderListResponse>>> {
        val params = OrderFilterParams(status, userId, search, fromDate, toDate, page, size)
        val orders = orderService.getAllOrders(params)
        return ResponseEntity.ok(ApiResponse.success(orders))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de orden")
    fun getOrder(@PathVariable id: Long): ResponseEntity<ApiResponse<OrderResponse>> {
        val order = orderService.getOrderById(id)
        return ResponseEntity.ok(ApiResponse.success(order))
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Actualizar estado de orden")
    fun updateStatus(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateOrderStatusRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<OrderResponse>> {
        val order = orderService.updateOrderStatus(id, request, principal.id)
        return ResponseEntity.ok(ApiResponse.success(order, "Estado actualizado"))
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtener estadísticas")
    fun getStats(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) fromDate: Instant?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) toDate: Instant?
    ): ResponseEntity<ApiResponse<OrderStatsResponse>> {
        val resolvedTo = toDate ?: Instant.now()
        val resolvedFrom = fromDate ?: resolvedTo.minus(30, ChronoUnit.DAYS)
        val stats = orderService.getOrderStats(resolvedFrom, resolvedTo)
        return ResponseEntity.ok(ApiResponse.success(stats))
    }
}