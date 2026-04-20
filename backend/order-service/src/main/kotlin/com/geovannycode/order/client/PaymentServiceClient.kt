package com.geovannycode.order.client

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.reactive.function.client.bodyToMono

@Component
class PaymentServiceClient(
    private val paymentServiceWebClient: WebClient
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun createPayment(
        orderId: Long,
        orderNumber: String,
        amount: Long,
        paymentMethod: String,
        customerEmail: String
    ): String? {
        return try {
            val request = CreatePaymentRequest(
                orderId = orderId,
                orderNumber = orderNumber,
                amount = amount,
                paymentMethod = paymentMethod,
                customerEmail = customerEmail
            )

            val response = paymentServiceWebClient.post()
                .uri("/api/v1/payments")
                .bodyValue(request)
                .retrieve()
                .bodyToMono<PaymentResponse>()
                .block()

            response?.paymentUrl
        } catch (e: WebClientResponseException) {
            logger.error("Error HTTP ${e.statusCode} creando pago para orden $orderNumber: ${e.responseBodyAsString}")
            null
        } catch (e: Exception) {
            logger.error("Servicio de pagos no disponible para orden $orderNumber: ${e.message}")
            null
        }
    }

    data class CreatePaymentRequest(
        val orderId: Long,
        val orderNumber: String,
        val amount: Long,
        val paymentMethod: String,
        val customerEmail: String
    )

    data class PaymentResponse(
        val paymentId: Long,
        val paymentUrl: String?,
        val status: String
    )
}