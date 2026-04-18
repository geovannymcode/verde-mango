package com.geovannycode.shared.dto

import java.time.Instant

/**
 * Interfaz base para eventos de dominio.
 * Todos los eventos deben implementar esta interfaz.
 */
interface DomainEvent {
    val eventId: String
    val occurredAt: Instant
    val eventType: String
}

/**
 * Usuario registrado
 */
data class UserRegisteredEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "USER_REGISTERED",
    val userId: Long,
    val email: String,
    val firstName: String,
    val lastName: String
) : DomainEvent

/**
 * Orden creada - dispara proceso de pago
 */
data class OrderCreatedEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "ORDER_CREATED",
    val orderId: Long,
    val orderNumber: String,
    val userId: Long,
    val totalAmount: Long,
    val items: List<OrderItemEvent>
) : DomainEvent {
    data class OrderItemEvent(
        val productId: Long,
        val quantity: Int
    )
}

data class OrderItemDto(
    val productId: Long,
    val quantity: Int,
    val unitPrice: Long
)

/**
 * Orden pagada - dispara actualización de stock
 */
data class OrderPaidEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "ORDER_PAID",
    val orderId: Long,
    val orderNumber: String,
    val userId: Long,
    val totalAmount: Long,
    val paymentId: Long,
    val paymentMethod: String,
    val amount: Long = totalAmount
) : DomainEvent

/**
 * Orden cancelada - dispara reembolso si aplica
 */
data class OrderCancelledEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "ORDER_CANCELLED",
    val orderId: Long,
    val reason: String?
) : DomainEvent

/**
 * Orden con cambio de estado
 */
data class OrderStatusChangedEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "ORDER_STATUS_CHANGED",
    val orderId: Long,
    val orderNumber: String,
    val userId: Long,
    val newStatus: String,
    val trackingNumber: String? = null
) : DomainEvent

/**
 * Pago completado
 */
data class PaymentCompletedEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "PAYMENT_COMPLETED",
    val paymentId: Long,
    val orderId: Long,
    val amount: Long,
    val paymentMethod: String = "",
    val transactionReference: String? = null,
    val providerReference: String = transactionReference ?: ""
) : DomainEvent

/**
 * Pago fallido
 */
data class PaymentFailedEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "PAYMENT_FAILED",
    val paymentId: Long,
    val orderId: Long,
    val reason: String
) : DomainEvent

/**
 * Stock bajo - notifica a admin
 */
data class ProductStockLowEvent(
    override val eventId: String,
    override val occurredAt: Instant = Instant.now(),
    override val eventType: String = "PRODUCT_STOCK_LOW",
    val productId: Long,
    val productName: String,
    val currentStock: Int,
    val threshold: Int
) : DomainEvent