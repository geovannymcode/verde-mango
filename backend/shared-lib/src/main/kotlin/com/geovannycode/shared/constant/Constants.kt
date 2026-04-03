package com.geovannycode.shared.dto

/**
 * Constantes de paginación
 */
object AppConstants {
    const val DEFAULT_PAGE_SIZE = 20
    const val MAX_PAGE_SIZE = 100
    const val DEFAULT_PAGE_NUMBER = 0
}

/**
 * Constantes de seguridad
 */
object SecurityConstants {
    const val TOKEN_PREFIX = "Bearer "
    const val HEADER_AUTHORIZATION = "Authorization"
    const val HEADER_USER_ID = "X-User-Id"
    const val HEADER_USER_EMAIL = "X-User-Email"
    const val HEADER_USER_ROLES = "X-User-Roles"
    const val HEADER_TRACE_ID = "X-Trace-Id"
}

/**
 * Roles del sistema
 */
enum class Role {
    CUSTOMER,
    ADMIN,
    SUPER_ADMIN;

    companion object {
        fun fromString(value: String): Role =
            entries.find { it.name.equals(value, ignoreCase = true) }
                ?: throw IllegalArgumentException("Rol desconocido: $value")
    }
}

/**
 * Estados de orden con transiciones válidas
 */
enum class OrderStatus {
    PENDING,      // Creada, esperando pago
    CONFIRMED,    // Pago confirmado
    PROCESSING,   // En preparación
    SHIPPED,      // Enviada
    DELIVERED,    // Entregada
    CANCELLED,    // Cancelada
    REFUNDED;     // Reembolsada

    /**
     * Valida si una transición de estado es permitida
     */
    fun canTransitionTo(newStatus: OrderStatus): Boolean = when (this) {
        PENDING -> newStatus in listOf(CONFIRMED, CANCELLED)
        CONFIRMED -> newStatus in listOf(PROCESSING, CANCELLED)
        PROCESSING -> newStatus in listOf(SHIPPED, CANCELLED)
        SHIPPED -> newStatus in listOf(DELIVERED, CANCELLED)
        DELIVERED -> newStatus == REFUNDED
        CANCELLED -> false
        REFUNDED -> false
    }
}

/**
 * Estados de pago
 */
enum class PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    REFUNDED,
    PARTIALLY_REFUNDED
}

/**
 * Constantes de mensajería RabbitMQ
 */
object MessagingConstants {
    // Exchanges
    const val USER_EXCHANGE = "user.exchange"
    const val ORDER_EXCHANGE = "order.exchange"
    const val PAYMENT_EXCHANGE = "payment.exchange"
    const val PRODUCT_EXCHANGE = "product.exchange"

    // Routing keys
    const val USER_REGISTERED = "user.registered"
    const val USER_UPDATED = "user.updated"
    const val ORDER_CREATED = "order.created"
    const val ORDER_PAID = "order.paid"
    const val ORDER_CANCELLED = "order.cancelled"
    const val PAYMENT_COMPLETED = "payment.completed"
    const val PAYMENT_FAILED = "payment.failed"
    const val PRODUCT_STOCK_LOW = "product.stock.low"
}