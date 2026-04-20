package com.geovannycode.order.messaging

import com.geovannycode.order.service.OrderService
import com.geovannycode.shared.dto.PaymentCompletedEvent
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component

@Component
class PaymentEventConsumer(
    private val orderService: OrderService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @RabbitListener(queues = ["payment.completed.order.queue"])
    fun handlePaymentCompleted(event: PaymentCompletedEvent) {
        logger.info("Evento PAYMENT_COMPLETED recibido para orden: ${event.orderId}")

        try {
            orderService.confirmPayment(
                orderId = event.orderId,
                paymentId = event.paymentId,
                paymentMethod = event.paymentMethod,
                paymentReference = event.transactionReference
            )
            logger.info("Pago confirmado para orden ${event.orderId}")
        } catch (e: Exception) {
            logger.error("Error procesando pago para orden ${event.orderId}: ${e.message}", e)
            throw e // Re-throw para que RabbitMQ reintente
        }
    }
}