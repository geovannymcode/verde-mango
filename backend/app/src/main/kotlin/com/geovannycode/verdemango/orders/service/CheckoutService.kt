package com.geovannycode.verdemango.orders.service

import com.geovannycode.verdemango.catalog.ProductApi
import com.geovannycode.verdemango.common.domain.BusinessRuleException
import com.geovannycode.verdemango.common.domain.InsufficientStockException
import com.geovannycode.verdemango.common.domain.OrderCreatedEvent
import com.geovannycode.verdemango.orders.domain.Address
import com.geovannycode.verdemango.orders.domain.Order
import com.geovannycode.verdemango.orders.domain.OrderItem
import com.geovannycode.verdemango.orders.repository.OrderRepository
import com.geovannycode.verdemango.orders.web.AddressRequest
import com.geovannycode.verdemango.orders.web.CheckoutItemValidation
import com.geovannycode.verdemango.orders.web.CheckoutRequest
import com.geovannycode.verdemango.orders.web.CheckoutResponse
import com.geovannycode.verdemango.orders.web.CheckoutValidationResponse
import com.geovannycode.verdemango.payment.PaymentApi
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import java.util.UUID

@Service
class CheckoutService(
    private val cartService: CartService,
    private val orderNumberGenerator: OrderNumberGenerator,
    private val productApi: ProductApi,
    private val paymentApi: PaymentApi,
    private val orderEventPublisher: OrderEventPublisher,
    private val orderRepository: OrderRepository,
    @Value("\${order.tax-rate:0.19}")
    private val taxRate: Double,
    @Value("\${order.default-shipping-cost:12000}")
    private val defaultShippingCost: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun validateCart(userId: Long): CheckoutValidationResponse {
        val cart = cartService.getCartForCheckout(userId)
        return validateCartInternal(cart)
    }

    @Transactional
    fun processCheckout(userId: Long, userEmail: String, request: CheckoutRequest): CheckoutResponse {
        logger.info("Procesando checkout para usuario $userId")

        val cart = cartService.getCartForCheckout(userId)
        val validation = validateCartInternal(cart)
        if (!validation.valid) {
            throw BusinessRuleException("No se puede procesar: ${validation.errors.joinToString(", ")}")
        }

        if (!request.billingSameAsShipping && request.billingAddress == null) {
            throw BusinessRuleException("La dirección de facturación es requerida cuando difiere de la de envío")
        }

        val orderNumber = orderNumberGenerator.generate()

        val shippingAddress = request.shippingAddress.toAddress()
        val billingAddress = if (request.billingSameAsShipping) null else request.billingAddress?.toAddress()

        var subtotal = 0L
        val orderItems = mutableListOf<OrderItem>()

        for (cartItem in cart.items) {
            val product = productApi.getProductForOrder(cartItem.productId)

            if (product.stock < cartItem.quantity) {
                throw InsufficientStockException(
                    "Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, solicitado: ${cartItem.quantity}"
                )
            }

            val orderItem = OrderItem(
                productId = product.id,
                productName = product.name,
                productSlug = product.slug,
                productSku = product.sku,
                productImageUrl = product.primaryImageUrl,
                quantity = cartItem.quantity,
                unitPrice = product.price
            )
            orderItems.add(orderItem)
            subtotal += orderItem.subtotal
        }

        val taxAmount = (subtotal * taxRate).toLong()
        val totalAmount = subtotal + defaultShippingCost + taxAmount

        val order = Order(
            orderNumber = orderNumber,
            userId = userId,
            userEmail = userEmail,
            subtotal = subtotal,
            shippingCost = defaultShippingCost,
            taxAmount = taxAmount,
            totalAmount = totalAmount,
            shippingAddress = shippingAddress,
            billingSameAsShipping = request.billingSameAsShipping,
            billingAddress = billingAddress,
            billingTaxId = request.billingTaxId,
            customerNotes = request.customerNotes,
            cartId = cart.id
        )

        orderItems.forEach { order.addItem(it) }
        val savedOrder = orderRepository.save(order)
        logger.info("Orden creada: ${savedOrder.orderNumber}")

        cartService.markAsConverted(cart.id)

        val orderId = savedOrder.id
        val savedOrderNumber = savedOrder.orderNumber
        val savedTotalAmount = savedOrder.totalAmount
        val savedUserId = savedOrder.userId
        val paymentMethod = request.paymentMethod
        val orderCreatedEvent = OrderCreatedEvent(
            eventId = UUID.randomUUID().toString(),
            orderId = orderId,
            orderNumber = savedOrderNumber,
            userId = savedUserId,
            totalAmount = savedTotalAmount,
            items = savedOrder.items.map {
                OrderCreatedEvent.OrderItemEvent(it.productId, it.quantity)
            }
        )

        TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
            override fun afterCommit() {
                try {
                    paymentApi.createPayment(
                        orderId = orderId,
                        orderNumber = savedOrderNumber,
                        amount = savedTotalAmount,
                        paymentMethod = paymentMethod,
                        customerEmail = userEmail
                    )
                } catch (e: Exception) {
                    logger.error("Error creando pago para orden $savedOrderNumber", e)
                }

                try {
                    orderEventPublisher.publishOrderCreatedEvent(orderCreatedEvent)
                } catch (e: Exception) {
                    logger.error("Error publicando evento ORDER_CREATED para orden $savedOrderNumber", e)
                }
            }
        })

        return CheckoutResponse(
            orderNumber = savedOrder.orderNumber,
            status = savedOrder.status.name,
            paymentUrl = null,
            message = "Orden creada exitosamente. El pago se procesará en breve."
        )
    }

    private fun validateCartInternal(cart: com.geovannycode.verdemango.orders.domain.Cart): CheckoutValidationResponse {
        val errors = mutableListOf<String>()
        val itemValidations = mutableListOf<CheckoutItemValidation>()

        if (cart.isEmpty) {
            return CheckoutValidationResponse(
                valid = false, items = emptyList(), subtotal = 0,
                shippingCost = 0, taxAmount = 0, total = 0,
                errors = listOf("El carrito está vacío")
            )
        }

        var subtotal = 0L

        for (cartItem in cart.items) {
            val product = try {
                productApi.getProductForOrder(cartItem.productId)
            } catch (e: Exception) {
                errors.add("El producto '${cartItem.productName}' ya no está disponible")
                itemValidations.add(CheckoutItemValidation(
                    productId = cartItem.productId, productName = cartItem.productName,
                    requestedQuantity = cartItem.quantity, availableStock = 0,
                    currentPrice = 0, cartPrice = cartItem.unitPrice,
                    priceChanged = false, inStock = false
                ))
                continue
            }

            val inStock = product.stock >= cartItem.quantity
            val priceChanged = product.price != cartItem.unitPrice

            if (!inStock) errors.add("Stock insuficiente para '${product.name}'. Disponible: ${product.stock}")
            if (priceChanged) errors.add("El precio de '${product.name}' ha cambiado")

            itemValidations.add(CheckoutItemValidation(
                productId = product.id, productName = product.name,
                requestedQuantity = cartItem.quantity, availableStock = product.stock,
                currentPrice = product.price, cartPrice = cartItem.unitPrice,
                priceChanged = priceChanged, inStock = inStock
            ))

            subtotal += product.price * cartItem.quantity
        }

        val taxAmount = (subtotal * taxRate).toLong()
        val total = subtotal + defaultShippingCost + taxAmount

        return CheckoutValidationResponse(
            valid = errors.isEmpty(), items = itemValidations,
            subtotal = subtotal, shippingCost = defaultShippingCost,
            taxAmount = taxAmount, total = total, errors = errors
        )
    }

    private fun AddressRequest.toAddress() = Address(
        recipientName = recipientName, phone = phone, streetAddress = streetAddress,
        apartment = apartment, city = city, state = state, postalCode = postalCode,
        country = country, instructions = instructions
    )
}
