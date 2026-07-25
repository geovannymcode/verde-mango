package com.geovannycode.verdemango.orders.service

import com.geovannycode.verdemango.common.domain.OrderCancelledEvent
import com.geovannycode.verdemango.common.domain.OrderCreatedEvent
import com.geovannycode.verdemango.common.domain.OrderPaidEvent
import com.geovannycode.verdemango.common.domain.OrderStatusChangedEvent
import com.geovannycode.verdemango.orders.domain.Order
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class OrderEventPublisher(
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun publishOrderCreated(order: Order) {
        val event = OrderCreatedEvent(
            eventId = UUID.randomUUID().toString(),
            orderId = order.id,
            orderNumber = order.orderNumber,
            userId = order.userId,
            totalAmount = order.totalAmount,
            items = order.items.map {
                OrderCreatedEvent.OrderItemEvent(it.productId, it.quantity)
            }
        )
        eventPublisher.publishEvent(event)
        logger.info("Evento ORDER_CREATED publicado: ${order.orderNumber}")
    }

    fun publishOrderCreatedEvent(event: OrderCreatedEvent) {
        eventPublisher.publishEvent(event)
        logger.info("Evento ORDER_CREATED publicado: ${event.orderNumber}")
    }

    fun publishOrderPaid(order: Order) {
        val event = OrderPaidEvent(
            eventId = UUID.randomUUID().toString(),
            orderId = order.id,
            orderNumber = order.orderNumber,
            userId = order.userId,
            totalAmount = order.totalAmount,
            paymentId = order.paymentId!!,
            paymentMethod = order.paymentMethod!!
        )
        eventPublisher.publishEvent(event)
        logger.info("Evento ORDER_PAID publicado: ${order.orderNumber}")
    }

    fun publishOrderStatusChanged(order: Order) {
        val event = OrderStatusChangedEvent(
            eventId = UUID.randomUUID().toString(),
            orderId = order.id,
            orderNumber = order.orderNumber,
            userId = order.userId,
            newStatus = order.status.name,
            trackingNumber = order.trackingNumber
        )
        eventPublisher.publishEvent(event)
        logger.info("Evento STATUS_CHANGED publicado: ${order.orderNumber} -> ${order.status}")
    }

    fun publishOrderCancelled(order: Order, reason: String) {
        val event = OrderCancelledEvent(
            eventId = UUID.randomUUID().toString(),
            orderId = order.id,
            reason = reason
        )
        eventPublisher.publishEvent(event)
        logger.info("Evento ORDER_CANCELLED publicado: ${order.orderNumber}")
    }
}
