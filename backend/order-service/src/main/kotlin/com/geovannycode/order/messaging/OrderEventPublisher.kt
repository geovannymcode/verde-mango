package com.geovannycode.order.messaging

import com.geovannycode.order.entity.Order
import com.geovannycode.shared.constant.MessagingConstants
import com.geovannycode.shared.dto.OrderCreatedEvent
import com.geovannycode.shared.dto.OrderPaidEvent
import com.geovannycode.shared.dto.OrderStatusChangedEvent
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class OrderEventPublisher(
    private val rabbitTemplate: RabbitTemplate
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
        publish(MessagingConstants.ORDER_CREATED, event)
        logger.info("Evento ORDER_CREATED publicado: ${order.orderNumber}")
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
        publish(MessagingConstants.ORDER_PAID, event)
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
        publish("order.status.changed", event)
        logger.info("Evento STATUS_CHANGED publicado: ${order.orderNumber} -> ${order.status}")
    }

    fun publishOrderCancelled(order: Order, reason: String) {
        val event = mapOf(
            "eventId" to UUID.randomUUID().toString(),
            "orderId" to order.id,
            "orderNumber" to order.orderNumber,
            "userId" to order.userId,
            "reason" to reason,
            "items" to order.items.map { mapOf("productId" to it.productId, "quantity" to it.quantity) }
        )
        publish("order.cancelled", event)
        logger.info("Evento ORDER_CANCELLED publicado: ${order.orderNumber}")
    }

    private fun publish(routingKey: String, event: Any) {
        try {
            rabbitTemplate.convertAndSend(MessagingConstants.ORDER_EXCHANGE, routingKey, event)
        } catch (e: Exception) {
            logger.error("Error publicando evento $routingKey: ${e.message}", e)
        }
    }
}