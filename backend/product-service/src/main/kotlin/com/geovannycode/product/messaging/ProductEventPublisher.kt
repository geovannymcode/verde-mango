package com.geovannycode.product.messaging

import com.geovannycode.product.entity.Product
import com.geovannycode.shared.constant.MessagingConstants
import com.geovannycode.shared.dto.ProductStockLowEvent
import com.geovannycode.shared.util.generateUUID
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Component

@Component
class ProductEventPublisher(
    private val rabbitTemplate: RabbitTemplate
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Publica evento cuando el stock de un producto está bajo
     */
    fun publishLowStockEvent(product: Product) {
        val event = ProductStockLowEvent(
            eventId = generateUUID(),
            productId = product.id,
            productName = product.name,
            currentStock = product.stock,
            threshold = product.lowStockThreshold
        )

        try {
            rabbitTemplate.convertAndSend(
                MessagingConstants.PRODUCT_EXCHANGE,
                MessagingConstants.PRODUCT_STOCK_LOW,
                event
            )
            logger.info("Evento de stock bajo publicado para producto: ${product.id}")
        } catch (e: Exception) {
            logger.error("Error publicando evento de stock bajo: ${e.message}", e)
        }
    }
}