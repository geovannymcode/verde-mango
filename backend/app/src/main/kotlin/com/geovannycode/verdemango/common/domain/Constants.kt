package com.geovannycode.verdemango.common.domain

/**
 * Constantes de paginacion
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
 * Estados de orden con transiciones validas
 */
enum class OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUNDED;

    /**
     * Valida si una transicion de estado es permitida
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
