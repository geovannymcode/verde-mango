package com.geovannycode.verdemango.payment

import com.geovannycode.verdemango.common.domain.PaymentCompletedEvent
import com.geovannycode.verdemango.common.domain.PaymentFailedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Facade del módulo de pagos.
 * En el futuro contendrá la lógica de procesamiento de pagos.
 * Por ahora simula el inicio de un pago y publica eventos cuando se completa.
 */
@Service
class PaymentApi(
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Inicia el proceso de pago para una orden.
     * @return paymentUrl o null si el método no requiere redirect
     */
    fun createPayment(
        orderId: Long,
        orderNumber: String,
        amount: Long,
        paymentMethod: String,
        customerEmail: String
    ): PaymentResult {
        logger.info("Creando pago para orden $orderNumber - método: $paymentMethod, monto: $amount")

        // TODO: Integrar con proveedor de pagos real (Stripe, MercadoPago, etc.)
        // Por ahora, simulamos un pago exitoso inmediato para métodos simples
        val paymentId = System.currentTimeMillis()
        val transactionRef = "PAY-${UUID.randomUUID().toString().take(8).uppercase()}"

        // Publicar evento de pago completado
        eventPublisher.publishEvent(
            PaymentCompletedEvent(
                eventId = UUID.randomUUID().toString(),
                paymentId = paymentId,
                orderId = orderId,
                amount = amount,
                paymentMethod = paymentMethod,
                transactionReference = transactionRef
            )
        )

        logger.info("Pago simulado completado para orden $orderNumber - ref: $transactionRef")

        return PaymentResult(
            paymentId = paymentId,
            paymentUrl = null,
            status = "COMPLETED"
        )
    }
}

data class PaymentResult(
    val paymentId: Long,
    val paymentUrl: String?,
    val status: String
)
