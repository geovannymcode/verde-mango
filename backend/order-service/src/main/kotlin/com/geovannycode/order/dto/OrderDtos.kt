package com.geovannycode.order.dto

import com.geovannycode.order.entity.Address
import com.geovannycode.order.entity.Order
import com.geovannycode.order.entity.OrderItem
import com.geovannycode.order.entity.OrderStatusHistory
import com.geovannycode.shared.constant.OrderStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

// ==================== REQUEST DTOs ====================

data class UpdateOrderStatusRequest(
    val status: OrderStatus,
    @field:Size(max = 500) val comment: String? = null,
    val trackingNumber: String? = null,
    val carrier: String? = null
)

data class CancelOrderRequest(
    @field:NotBlank(message = "El motivo es requerido")
    @field:Size(max = 500)
    val reason: String
)

data class OrderFilterParams(
    val status: OrderStatus? = null,
    val userId: Long? = null,
    val search: String? = null,
    val fromDate: Instant? = null,
    val toDate: Instant? = null,
    val page: Int = 0,
    val size: Int = 20
)

// ==================== RESPONSE DTOs ====================

data class OrderResponse(
    val id: Long,
    val orderNumber: String,
    val status: OrderStatus,
    val statusLabel: String,
    val items: List<OrderItemResponse>,
    val itemCount: Int,
    val subtotal: Long,
    val subtotalFormatted: String,
    val shippingCost: Long,
    val taxAmount: Long,
    val discountAmount: Long,
    val totalAmount: Long,
    val totalFormatted: String,
    val shippingAddress: AddressResponse,
    val billingAddress: AddressResponse?,
    val paymentMethod: String?,
    val paymentReference: String?,
    val paidAt: Instant?,
    val trackingNumber: String?,
    val carrier: String?,
    val shippedAt: Instant?,
    val deliveredAt: Instant?,
    val cancelledAt: Instant?,
    val cancellationReason: String?,
    val customerNotes: String?,
    val statusHistory: List<OrderStatusHistoryResponse>,
    val canBeCancelled: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(order: Order) = OrderResponse(
            id = order.id,
            orderNumber = order.orderNumber,
            status = order.status,
            statusLabel = order.status.toLabel(),
            items = order.items.map { OrderItemResponse.from(it) },
            itemCount = order.itemCount,
            subtotal = order.subtotal,
            subtotalFormatted = "$${String.format("%,d", order.subtotal)}",
            shippingCost = order.shippingCost,
            taxAmount = order.taxAmount,
            discountAmount = order.discountAmount,
            totalAmount = order.totalAmount,
            totalFormatted = order.totalFormatted,
            shippingAddress = AddressResponse.from(order.shippingAddress),
            billingAddress = if (!order.billingSameAsShipping) order.billingAddress?.let { AddressResponse.from(it) } else null,
            paymentMethod = order.paymentMethod,
            paymentReference = order.paymentReference,
            paidAt = order.paidAt,
            trackingNumber = order.trackingNumber,
            carrier = order.carrier,
            shippedAt = order.shippedAt,
            deliveredAt = order.deliveredAt,
            cancelledAt = order.cancelledAt,
            cancellationReason = order.cancellationReason,
            customerNotes = order.customerNotes,
            statusHistory = order.statusHistory.map { OrderStatusHistoryResponse.from(it) },
            canBeCancelled = order.canBeCancelled,
            createdAt = order.createdAt,
            updatedAt = order.updatedAt
        )
    }
}

data class OrderListResponse(
    val id: Long,
    val orderNumber: String,
    val status: OrderStatus,
    val statusLabel: String,
    val itemCount: Int,
    val totalAmount: Long,
    val totalFormatted: String,
    val createdAt: Instant,
    val paidAt: Instant?,
    val deliveredAt: Instant?
) {
    companion object {
        fun from(order: Order) = OrderListResponse(
            id = order.id,
            orderNumber = order.orderNumber,
            status = order.status,
            statusLabel = order.status.toLabel(),
            itemCount = order.itemCount,
            totalAmount = order.totalAmount,
            totalFormatted = order.totalFormatted,
            createdAt = order.createdAt,
            paidAt = order.paidAt,
            deliveredAt = order.deliveredAt
        )
    }
}

data class OrderItemResponse(
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
        fun from(item: OrderItem) = OrderItemResponse(
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

data class AddressResponse(
    val recipientName: String,
    val phone: String,
    val streetAddress: String,
    val apartment: String?,
    val city: String,
    val state: String?,
    val postalCode: String?,
    val country: String,
    val instructions: String?,
    val formatted: String
) {
    companion object {
        fun from(address: Address) = AddressResponse(
            recipientName = address.recipientName,
            phone = address.phone,
            streetAddress = address.streetAddress,
            apartment = address.apartment,
            city = address.city,
            state = address.state,
            postalCode = address.postalCode,
            country = address.country,
            instructions = address.instructions,
            formatted = address.formatted
        )
    }
}

data class OrderStatusHistoryResponse(
    val id: Long,
    val fromStatus: OrderStatus?,
    val toStatus: OrderStatus,
    val comment: String?,
    val changedByType: String,
    val createdAt: Instant
) {
    companion object {
        fun from(history: OrderStatusHistory) = OrderStatusHistoryResponse(
            id = history.id,
            fromStatus = history.fromStatus,
            toStatus = history.toStatus,
            comment = history.comment,
            changedByType = history.changedByType,
            createdAt = history.createdAt
        )
    }
}

data class OrderStatsResponse(
    val totalOrders: Long,
    val pendingOrders: Long,
    val processingOrders: Long,
    val deliveredOrders: Long,
    val cancelledOrders: Long,
    val totalRevenue: Long,
    val totalRevenueFormatted: String,
    val averageOrderValue: Double
)

// Extension function
fun OrderStatus.toLabel(): String = when (this) {
    OrderStatus.PENDING -> "Pendiente de pago"
    OrderStatus.CONFIRMED -> "Confirmada"
    OrderStatus.PROCESSING -> "En preparación"
    OrderStatus.SHIPPED -> "Enviada"
    OrderStatus.DELIVERED -> "Entregada"
    OrderStatus.CANCELLED -> "Cancelada"
    OrderStatus.REFUNDED -> "Reembolsada"
}