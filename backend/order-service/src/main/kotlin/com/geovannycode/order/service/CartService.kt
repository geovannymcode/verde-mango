package com.geovannycode.order.service

import com.geovannycode.order.client.ProductServiceClient
import com.geovannycode.order.dto.AddToCartRequest
import com.geovannycode.order.dto.CartResponse
import com.geovannycode.order.dto.CartSummaryResponse
import com.geovannycode.order.dto.UpdateCartItemRequest
import com.geovannycode.order.entity.Cart
import com.geovannycode.order.entity.CartStatus
import com.geovannycode.order.repository.CartRepository
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class CartService(
    private val cartRepository: CartRepository,
    private val productClient: ProductServiceClient,
    @Value("\${order.cart-expiration-hours:24}")
    private val cartExpirationHours: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun getCart(userId: Long?, sessionId: String?): CartResponse {
        val cart = findActiveCart(userId, sessionId)
        return cart?.let { CartResponse.from(it) } ?: CartResponse.empty()
    }

    @Transactional(readOnly = true)
    fun getCartSummary(userId: Long?, sessionId: String?): CartSummaryResponse {
        val cart = findActiveCart(userId, sessionId)
        return cart?.let { CartSummaryResponse.from(it) } ?: CartSummaryResponse.empty()
    }

    @Transactional
    fun addItem(userId: Long?, sessionId: String?, request: AddToCartRequest): CartResponse {
        logger.debug("Agregando producto ${request.productId} al carrito")

        val product = productClient.getProduct(request.productId)
            ?: throw ResourceNotFoundException("Producto", "id", request.productId)

        if (!product.isInStock) {
            throw BusinessRuleException("El producto '${product.name}' no está disponible")
        }

        if (product.stock < request.quantity) {
            throw BusinessRuleException("Stock insuficiente. Disponible: ${product.stock}")
        }

        val cart = findActiveCart(userId, sessionId) ?: createCart(userId, sessionId)

        val existingQty = cart.getItem(request.productId)?.quantity ?: 0
        val totalQty = existingQty + request.quantity
        if (product.stock < totalQty) {
            throw BusinessRuleException(
                "Stock insuficiente. Ya tienes $existingQty en el carrito, disponible: ${product.stock}"
            )
        }

        cart.addItem(
            productId = product.id,
            productName = product.name,
            productSlug = product.slug,
            productImageUrl = product.primaryImageUrl,
            quantity = request.quantity,
            unitPrice = product.price
        )

        val savedCart = cartRepository.save(cart)
        logger.info("Producto agregado al carrito ${savedCart.id}")

        return CartResponse.from(savedCart)
    }

    @Transactional
    fun updateItemQuantity(
        userId: Long?,
        sessionId: String?,
        productId: Long,
        request: UpdateCartItemRequest
    ): CartResponse {
        val cart = findActiveCart(userId, sessionId)
            ?: throw ResourceNotFoundException("Carrito", "usuario", userId ?: sessionId ?: "unknown")

        if (request.quantity > 0) {
            val product = productClient.getProduct(productId)
                ?: throw ResourceNotFoundException("Producto", "id", productId)

            if (product.stock < request.quantity) {
                throw BusinessRuleException("Stock insuficiente. Disponible: ${product.stock}")
            }

            cart.getItem(productId)?.unitPrice = product.price
        }

        cart.updateItemQuantity(productId, request.quantity)
        return CartResponse.from(cartRepository.save(cart))
    }

    @Transactional
    fun removeItem(userId: Long?, sessionId: String?, productId: Long): CartResponse {
        val cart = findActiveCart(userId, sessionId)
            ?: throw ResourceNotFoundException("Carrito", "usuario", userId ?: sessionId ?: "unknown")

        cart.removeItem(productId)
        return CartResponse.from(cartRepository.save(cart))
    }

    @Transactional
    fun clearCart(userId: Long?, sessionId: String?): CartResponse {
        val cart = findActiveCart(userId, sessionId) ?: return CartResponse.empty()
        cart.clear()
        return CartResponse.from(cartRepository.save(cart))
    }

    @Transactional
    fun mergeGuestCart(userId: Long, sessionId: String): CartResponse {
        logger.info("Fusionando carrito de sesión $sessionId con usuario $userId")

        val guestCart = cartRepository.findBySessionIdAndStatusWithItemsFetch(sessionId, CartStatus.ACTIVE)
            .orElse(null)

        if (guestCart == null || guestCart.isEmpty) {
            return getCart(userId, null)
        }

        val userCart = cartRepository.findByUserIdAndStatusWithItemsFetch(userId, CartStatus.ACTIVE)
            .orElseGet { createCart(userId, null) }

        userCart.mergeFrom(guestCart)
        cartRepository.save(userCart)
        cartRepository.save(guestCart)

        return CartResponse.from(userCart)
    }

    @Transactional(readOnly = true)
    fun getCartForCheckout(userId: Long): Cart {
        return cartRepository.findByUserIdAndStatusWithItemsFetch(userId, CartStatus.ACTIVE)
            .orElseThrow { BusinessRuleException("No tienes un carrito activo") }
    }

    @Transactional
    fun markAsConverted(cartId: Long) {
        val cart = cartRepository.findById(cartId)
            .orElseThrow { ResourceNotFoundException("Carrito", "id", cartId) }
        cart.markAsConverted()
        cartRepository.save(cart)
    }

    private fun findActiveCart(userId: Long?, sessionId: String?): Cart? = when {
        userId != null -> cartRepository.findByUserIdAndStatusWithItemsFetch(userId, CartStatus.ACTIVE).orElse(null)
        sessionId != null -> cartRepository.findBySessionIdAndStatusWithItemsFetch(sessionId, CartStatus.ACTIVE).orElse(null)
        else -> null
    }

    private fun createCart(userId: Long?, sessionId: String?): Cart {
        require(userId != null || sessionId != null) { "Se requiere userId o sessionId" }

        return cartRepository.save(Cart(
            userId = userId,
            sessionId = if (userId == null) sessionId else null,
            expiresAt = if (userId == null) Instant.now().plus(cartExpirationHours, ChronoUnit.HOURS) else null
        ))
    }
}