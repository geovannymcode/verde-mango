package com.geovannycode.order.dto

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class CheckoutRequest(
    @field:Valid
    @field:NotNull(message = "La dirección de envío es requerida")
    val shippingAddress: AddressRequest,

    val billingSameAsShipping: Boolean = true,

    @field:Valid
    val billingAddress: AddressRequest? = null,

    val billingTaxId: String? = null,

    @field:Size(max = 1000)
    val customerNotes: String? = null,

    @field:NotBlank(message = "El método de pago es requerido")
    val paymentMethod: String
)

data class AddressRequest(
    @field:NotBlank(message = "El nombre es requerido")
    @field:Size(max = 200)
    val recipientName: String,

    @field:NotBlank(message = "El teléfono es requerido")
    @field:Size(max = 20)
    val phone: String,

    @field:NotBlank(message = "La dirección es requerida")
    @field:Size(max = 500)
    val streetAddress: String,

    @field:Size(max = 100)
    val apartment: String? = null,

    @field:NotBlank(message = "La ciudad es requerida")
    @field:Size(max = 100)
    val city: String,

    @field:Size(max = 100)
    val state: String? = null,

    @field:Size(max = 20)
    val postalCode: String? = null,

    val country: String = "Colombia",

    @field:Size(max = 500)
    val instructions: String? = null
)

data class CheckoutValidationResponse(
    val valid: Boolean,
    val items: List<CheckoutItemValidation>,
    val subtotal: Long,
    val shippingCost: Long,
    val taxAmount: Long,
    val total: Long,
    val errors: List<String>
)

data class CheckoutItemValidation(
    val productId: Long,
    val productName: String,
    val requestedQuantity: Int,
    val availableStock: Int,
    val currentPrice: Long,
    val cartPrice: Long,
    val priceChanged: Boolean,
    val inStock: Boolean
)

data class CheckoutResponse(
    val orderNumber: String,
    val status: String,
    val paymentUrl: String?,
    val message: String
)