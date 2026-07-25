package com.geovannycode.verdemango.catalog.service

import com.geovannycode.verdemango.catalog.domain.Product
import com.geovannycode.verdemango.common.domain.ProductStockLowEvent
import com.geovannycode.verdemango.common.domain.generateUUID
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component

@Component
class CatalogEventPublisher(
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun publishLowStockEvent(product: Product) {
        val event = ProductStockLowEvent(
            eventId = generateUUID(),
            productId = product.id,
            productName = product.name,
            currentStock = product.stock,
            threshold = product.lowStockThreshold
        )

        try {
            eventPublisher.publishEvent(event)
            logger.info("Evento de stock bajo publicado para producto: ${product.id}")
        } catch (e: Exception) {
            logger.error("Error publicando evento de stock bajo: ${e.message}", e)
        }
    }
}
