package com.geovannycode.verdemango.orders.service

import com.geovannycode.verdemango.common.domain.PaymentCompletedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

/**
 * Escucha eventos de pago completado (reemplaza el PaymentEventConsumer de RabbitMQ).
 * En el monolito, el módulo de pagos publica un PaymentCompletedEvent vía Spring Events.
 */
@Component
class PaymentEventListener(
    private val orderService: OrderService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @EventListener
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
            throw e
        }
    }
}
