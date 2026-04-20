package com.geovannycode.order.entity

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.time.Instant

@Entity
@Table(name = "carts")
class Cart(

    @Column(name = "user_id")
    var userId: Long? = null,

    @Column(name = "session_id", length = 100)
    var sessionId: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: CartStatus = CartStatus.ACTIVE,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    @Column(name = "item_count", nullable = false)
    var itemCount: Int = 0,

    @Column(name = "subtotal", nullable = false)
    var subtotal: Long = 0,

    @OneToMany(mappedBy = "cart", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("createdAt ASC")
    val items: MutableList<CartItem> = mutableListOf(),

    @Version
    @Column(name = "version")
    var version: Long = 0

) : BaseEntity() {

    // ==================== Propiedades computadas ====================

    val isUserCart: Boolean get() = userId != null

    val isGuestCart: Boolean get() = sessionId != null && userId == null

    val isEmpty: Boolean get() = items.isEmpty()

    val isActive: Boolean get() = status == CartStatus.ACTIVE

    val isExpired: Boolean get() = expiresAt?.let { Instant.now().isAfter(it) } ?: false

    val totalQuantity: Int get() = items.sumOf { it.quantity }

    // ==================== Métodos de negocio ====================

    fun addItem(
        productId: Long,
        productName: String,
        productSlug: String,
        productImageUrl: String?,
        quantity: Int,
        unitPrice: Long
    ): CartItem {
        require(quantity > 0) { "La cantidad debe ser mayor a 0" }
        require(unitPrice >= 0) { "El precio no puede ser negativo" }
        check(isActive) { "No se puede modificar un carrito inactivo" }

        val existingItem = items.find { it.productId == productId }

        return if (existingItem != null) {
            existingItem.quantity += quantity
            existingItem.unitPrice = unitPrice
            recalculateTotals()
            existingItem
        } else {
            val newItem = CartItem(
                cart = this,
                productId = productId,
                productName = productName,
                productSlug = productSlug,
                productImageUrl = productImageUrl,
                quantity = quantity,
                unitPrice = unitPrice
            )
            items.add(newItem)
            recalculateTotals()
            newItem
        }
    }

    fun updateItemQuantity(productId: Long, quantity: Int) {
        require(quantity >= 0) { "La cantidad no puede ser negativa" }
        check(isActive) { "No se puede modificar un carrito inactivo" }

        if (quantity == 0) {
            removeItem(productId)
            return
        }

        val item = items.find { it.productId == productId }
            ?: throw IllegalArgumentException("Producto no encontrado en el carrito")

        item.quantity = quantity
        recalculateTotals()
    }

    fun removeItem(productId: Long) {
        check(isActive) { "No se puede modificar un carrito inactivo" }
        val removed = items.removeIf { it.productId == productId }
        if (removed) recalculateTotals()
    }

    fun clear() {
        check(isActive) { "No se puede modificar un carrito inactivo" }
        items.clear()
        recalculateTotals()
    }

    fun mergeFrom(guestCart: Cart) {
        require(this.isUserCart) { "Solo se puede fusionar hacia un carrito de usuario" }
        require(guestCart.isGuestCart) { "Solo se puede fusionar desde un carrito de visitante" }
        check(isActive) { "No se puede fusionar con un carrito inactivo" }
        check(guestCart.isActive) { "El carrito de visitante no está activo" }

        guestCart.items.forEach { guestItem ->
            addItem(
                productId = guestItem.productId,
                productName = guestItem.productName,
                productSlug = guestItem.productSlug,
                productImageUrl = guestItem.productImageUrl,
                quantity = guestItem.quantity,
                unitPrice = guestItem.unitPrice
            )
        }
        guestCart.status = CartStatus.MERGED
    }

    fun markAsConverted() {
        check(isActive) { "Solo se puede convertir un carrito activo" }
        check(!isEmpty) { "No se puede convertir un carrito vacío" }
        status = CartStatus.CONVERTED
    }

    fun getItem(productId: Long): CartItem? = items.find { it.productId == productId }

    private fun recalculateTotals() {
        itemCount = items.size
        subtotal = items.sumOf { it.subtotal }
    }
}