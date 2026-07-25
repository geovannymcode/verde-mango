package com.geovannycode.verdemango.orders.service

import com.geovannycode.verdemango.catalog.ProductApi
import com.geovannycode.verdemango.common.domain.BusinessRuleException
import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import com.geovannycode.verdemango.orders.domain.Cart
import com.geovannycode.verdemango.orders.domain.CartStatus
import com.geovannycode.verdemango.orders.repository.CartRepository
import com.geovannycode.verdemango.orders.web.AddToCartRequest
import com.geovannycode.verdemango.orders.web.CartResponse
import com.geovannycode.verdemango.orders.web.CartSummaryResponse
import com.geovannycode.verdemango.orders.web.UpdateCartItemRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class CartService(
    private val cartRepository: CartRepository,
    private val productApi: ProductApi,
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

        val productResponse = productApi.getProductForOrder(request.productId)

        if (!productResponse.isInStock) {
            throw BusinessRuleException("El producto '${productResponse.name}' no está disponible")
        }

        if (productResponse.stock < request.quantity) {
            throw BusinessRuleException("Stock insuficiente. Disponible: ${productResponse.stock}")
        }

        val cart = findActiveCart(userId, sessionId) ?: createCart(userId, sessionId)

        val existingQty = cart.getItem(request.productId)?.quantity ?: 0
        val totalQty = existingQty + request.quantity
        if (productResponse.stock < totalQty) {
            throw BusinessRuleException(
                "Stock insuficiente. Ya tienes $existingQty en el carrito, disponible: ${productResponse.stock}"
            )
        }

        cart.addItem(
            productId = productResponse.id,
            productName = productResponse.name,
            productSlug = productResponse.slug,
            productImageUrl = productResponse.primaryImageUrl,
            quantity = request.quantity,
            unitPrice = productResponse.price
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
            val productResponse = productApi.getProductForOrder(productId)

            if (productResponse.stock < request.quantity) {
                throw BusinessRuleException("Stock insuficiente. Disponible: ${productResponse.stock}")
            }

            cart.getItem(productId)?.unitPrice = productResponse.price
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
        logger.debug("Fusionando carrito de sesión {}*** con usuario {}", sessionId.take(8), userId)

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
