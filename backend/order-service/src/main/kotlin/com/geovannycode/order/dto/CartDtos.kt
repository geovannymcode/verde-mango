package com.geovannycode.order.dto

import com.geovannycode.order.entity.Cart
import com.geovannycode.order.entity.CartItem
import com.geovannycode.order.entity.CartStatus
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.time.Instant
import java.util.Locale

// ==================== REQUEST DTOs ====================

data class AddToCartRequest(
    @field:NotNull(message = "El ID del producto es requerido")
    @field:Positive(message = "El ID del producto debe ser positivo")
    val productId: Long,

    @field:Min(value = 1, message = "La cantidad mínima es 1")
    val quantity: Int = 1
)

data class UpdateCartItemRequest(
    @field:NotNull(message = "La cantidad es requerida")
    @field:Min(value = 0, message = "La cantidad no puede ser negativa")
    val quantity: Int
)

// ==================== RESPONSE DTOs ====================

data class CartResponse(
    val id: Long,
    val status: CartStatus,
    val items: List<CartItemResponse>,
    val itemCount: Int,
    val totalQuantity: Int,
    val subtotal: Long,
    val subtotalFormatted: String,
    val expiresAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(cart: Cart) = CartResponse(
            id = cart.id,
            status = cart.status,
            items = cart.items.map { CartItemResponse.from(it) },
            itemCount = cart.itemCount,
            totalQuantity = cart.totalQuantity,
            subtotal = cart.subtotal,
            subtotalFormatted = "$${String.format(Locale.US, "%,d", cart.subtotal)}",
            expiresAt = cart.expiresAt,
            createdAt = cart.createdAt,
            updatedAt = cart.updatedAt
        )

        fun empty(): CartResponse {
            val now = Instant.now()
            return CartResponse(
                id = 0, status = CartStatus.ACTIVE, items = emptyList(),
                itemCount = 0, totalQuantity = 0, subtotal = 0,
                subtotalFormatted = "$0", expiresAt = null,
                createdAt = now, updatedAt = now
            )
        }
    }
}

data class CartItemResponse(
    val id: Long,
    val productId: Long,
    val productName: String,
    val productSlug: String,
    val productImageUrl: String?,
    val quantity: Int,
    val unitPrice: Long,
    val unitPriceFormatted: String,
    val subtotal: Long,
    val subtotalFormatted: String
) {
    companion object {
        fun from(item: CartItem) = CartItemResponse(
            id = item.id,
            productId = item.productId,
            productName = item.productName,
            productSlug = item.productSlug,
            productImageUrl = item.productImageUrl,
            quantity = item.quantity,
            unitPrice = item.unitPrice,
            unitPriceFormatted = item.unitPriceFormatted,
            subtotal = item.subtotal,
            subtotalFormatted = item.subtotalFormatted
        )
    }
}

data class CartSummaryResponse(
    val itemCount: Int,
    val totalQuantity: Int,
    val subtotal: Long,
    val subtotalFormatted: String
) {
    companion object {
        fun from(cart: Cart) = CartSummaryResponse(
            itemCount = cart.itemCount,
            totalQuantity = cart.totalQuantity,
            subtotal = cart.subtotal,
            subtotalFormatted = "$${String.format(Locale.US, "%,d", cart.subtotal)}"
        )

        fun empty() = CartSummaryResponse(0, 0, 0, "$0")
    }
}