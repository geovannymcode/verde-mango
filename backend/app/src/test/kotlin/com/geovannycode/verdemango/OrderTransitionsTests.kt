package com.geovannycode.verdemango

import com.geovannycode.verdemango.common.domain.OrderStatus
import com.geovannycode.verdemango.orders.domain.Address
import com.geovannycode.verdemango.orders.domain.Order
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class OrderTransitionsTests {
    @Test fun allTransitionsAreExact() {
        val expected = mapOf(
            OrderStatus.PENDING to listOf(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED to listOf(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING to listOf(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED to listOf(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.DELIVERED to listOf(OrderStatus.REFUNDED),
            OrderStatus.CANCELLED to emptyList(), OrderStatus.REFUNDED to emptyList())
        for (from in OrderStatus.entries) for (to in OrderStatus.entries)
            assertEquals(to in expected.getValue(from), from.canTransitionTo(to), "$from -> $to")
    }
    @Test fun notesAndActorSurviveShippingAndDelivery() {
        val order = Order(orderNumber="TEST", userId=1, userEmail="test@example.test", subtotal=1000,
            totalAmount=1000, shippingAddress=Address.empty(), status=OrderStatus.PROCESSING)
        order.markAsShipped("QA-123", "Transportadora", 7, "Nota de envío")
        order.markAsDelivered(9, "Nota de entrega")
        assertEquals(listOf("Nota de envío", "Nota de entrega"), order.statusHistory.map { it.comment })
        assertEquals(listOf(7L,9L), order.statusHistory.map { it.changedByUserId })
        assertNotNull(order.deliveredAt)
        assertThrows(IllegalStateException::class.java) { order.updateStatus(OrderStatus.SHIPPED) }
    }
}
