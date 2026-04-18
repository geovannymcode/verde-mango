package com.geovannycode.order.service

import com.geovannycode.order.client.PaymentServiceClient
import com.geovannycode.order.client.ProductServiceClient
import com.geovannycode.order.dto.AddressRequest
import com.geovannycode.order.dto.CheckoutItemValidation
import com.geovannycode.order.dto.CheckoutRequest
import com.geovannycode.order.dto.CheckoutResponse
import com.geovannycode.order.dto.CheckoutValidationResponse
import com.geovannycode.order.entity.Address
import com.geovannycode.order.entity.Order
import com.geovannycode.order.entity.OrderItem
import com.geovannycode.order.messaging.OrderEventPublisher
import com.geovannycode.order.repository.OrderRepository
import com.geovannycode.shared.exception.BusinessRuleException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CheckoutService(
    private val cartService: CartService,
    private val orderNumberGenerator: OrderNumberGenerator,
    private val productClient: ProductServiceClient,
    private val paymentClient: PaymentServiceClient,
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
            val product = productClient.getProduct(cartItem.productId)

            if (product == null) {
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

    @Transactional
    fun processCheckout(userId: Long, userEmail: String, request: CheckoutRequest): CheckoutResponse {
        logger.info("Procesando checkout para usuario $userId")

        // 1. Validar carrito
        val validation = validateCart(userId)
        if (!validation.valid) {
            throw BusinessRuleException("No se puede procesar: ${validation.errors.joinToString(", ")}")
        }

        val cart = cartService.getCartForCheckout(userId)

        // 2. Generar número de orden
        val orderNumber = orderNumberGenerator.generate()

        // 3. Crear direcciones
        val shippingAddress = request.shippingAddress.toAddress()
        val billingAddress = if (request.billingSameAsShipping) null else request.billingAddress?.toAddress()

        // 4. Calcular totales y crear items
        var subtotal = 0L
        val orderItems = mutableListOf<OrderItem>()

        for (cartItem in cart.items) {
            val product = productClient.getProduct(cartItem.productId)
                ?: throw BusinessRuleException("Producto ${cartItem.productId} no disponible")

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

        // 5. Crear orden
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

        // 6. Marcar carrito como convertido
        cartService.markAsConverted(cart.id)

        // 7. Iniciar pago
        val paymentUrl = try {
            paymentClient.createPayment(
                orderId = savedOrder.id,
                orderNumber = savedOrder.orderNumber,
                amount = savedOrder.totalAmount,
                paymentMethod = request.paymentMethod,
                customerEmail = userEmail
            )
        } catch (e: Exception) {
            logger.error("Error creando pago para orden ${savedOrder.orderNumber}", e)
            null
        }

        // 8. Publicar evento
        orderEventPublisher.publishOrderCreated(savedOrder)

        return CheckoutResponse(
            orderNumber = savedOrder.orderNumber,
            status = savedOrder.status.name,
            paymentUrl = paymentUrl,
            message = "Orden creada exitosamente. Procede al pago."
        )
    }

    private fun AddressRequest.toAddress() = Address(
        recipientName = recipientName, phone = phone, streetAddress = streetAddress,
        apartment = apartment, city = city, state = state, postalCode = postalCode,
        country = country, instructions = instructions
    )
}