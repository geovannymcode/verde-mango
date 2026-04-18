package com.geovannycode.order.controller

import com.geovannycode.order.dto.CheckoutRequest
import com.geovannycode.order.dto.CheckoutResponse
import com.geovannycode.order.dto.CheckoutValidationResponse
import com.geovannycode.order.security.UserPrincipal
import com.geovannycode.order.service.CheckoutService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/checkout")
@Tag(name = "Checkout", description = "Proceso de checkout")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
class CheckoutController(
    private val checkoutService: CheckoutService
) {

    @PostMapping("/validate")
    @Operation(summary = "Validar carrito antes de checkout")
    fun validateCart(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<CheckoutValidationResponse>> {
        val validation = checkoutService.validateCart(principal.id)
        return ResponseEntity.ok(ApiResponse.success(validation))
    }

    @PostMapping
    @Operation(summary = "Procesar checkout y crear orden")
    fun processCheckout(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: CheckoutRequest
    ): ResponseEntity<ApiResponse<CheckoutResponse>> {
        val response = checkoutService.processCheckout(principal.id, principal.email, request)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response, "Orden creada exitosamente"))
    }
}