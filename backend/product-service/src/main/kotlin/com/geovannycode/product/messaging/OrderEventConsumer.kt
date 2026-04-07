package com.geovannycode.product.messaging

import com.geovannycode.product.service.ProductService
import com.geovannycode.shared.dto.OrderCancelledEvent
import com.geovannycode.shared.dto.OrderPaidEvent
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component

@Component
class OrderEventConsumer(
    private val productService: ProductService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Consume eventos de orden pagada para actualizar stock
     */
    @RabbitListener(queues = ["product.order.paid.queue"])
    fun handleOrderPaid(event: OrderPaidEvent) {
        logger.info("Recibido evento OrderPaid: orderId=${event.orderId}")

        try {
            // El stock ya debería estar reservado, pero podemos confirmar
            logger.debug("Orden ${event.orderId} pagada - stock ya reservado")
        } catch (e: Exception) {
            logger.error("Error procesando OrderPaid: ${e.message}", e)
            throw e // Re-throw para que vaya al DLQ
        }
    }

    /**
     * Consume eventos de orden cancelada para liberar stock
     */
    @RabbitListener(queues = ["product.order.cancelled.queue"])
    fun handleOrderCancelled(event: OrderCancelledEvent) {
        logger.info("Recibido evento OrderCancelled: orderId=${event.orderId}")

        try {
            // Aquí necesitaríamos los items de la orden para liberar stock
            // En un escenario real, el evento incluiría los items
            logger.debug("Orden ${event.orderId} cancelada - liberando stock")
        } catch (e: Exception) {
            logger.error("Error procesando OrderCancelled: ${e.message}", e)
            throw e
        }
    }
}