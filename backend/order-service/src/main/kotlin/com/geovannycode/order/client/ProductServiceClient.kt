package com.geovannycode.order.client

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatusCode
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.reactive.function.client.bodyToMono

@Component
class ProductServiceClient(
    private val productServiceWebClient: WebClient
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun getProduct(productId: Long): ProductInfo? {
        return try {
            val response = productServiceWebClient.get()
                .uri("/api/v1/products/id/$productId")
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError) { resp ->
                    if (resp.statusCode().value() == 404) {
                        reactor.core.publisher.Mono.empty()
                    } else {
                        resp.createException()
                    }
                }
                .bodyToMono<ApiResponseWrapper<ProductInfo>>()
                .block()

            response?.data
        } catch (e: WebClientResponseException.NotFound) {
            logger.debug("Producto $productId no encontrado (404)")
            null
        } catch (e: Exception) {
            logger.error("Error obteniendo producto $productId: ${e.message}")
            throw com.geovannycode.shared.exception.ServiceUnavailableException(
                "Servicio de productos no disponible: ${e.message}"
            )
        }
    }

    fun checkStock(productId: Long, quantity: Int): Boolean {
        val product = getProduct(productId) ?: return false
        return product.stock >= quantity
    }

    data class ApiResponseWrapper<T>(val success: Boolean, val data: T?)

    data class ProductInfo(
        val id: Long,
        val name: String,
        val slug: String,
        val price: Long,
        val stock: Int,
        val isInStock: Boolean,
        val sku: String?,
        val primaryImageUrl: String?
    )
}