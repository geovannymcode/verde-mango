package com.geovannycode.order.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "order_items")
class OrderItem(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    var order: Order? = null,

    @Column(name = "product_id", nullable = false)
    val productId: Long,

    @Column(name = "product_name", nullable = false, length = 255)
    val productName: String,

    @Column(name = "product_slug", nullable = false, length = 300)
    val productSlug: String,

    @Column(name = "product_sku", length = 100)
    val productSku: String? = null,

    @Column(name = "product_image_url", columnDefinition = "TEXT")
    val productImageUrl: String? = null,

    @Column(name = "quantity", nullable = false)
    val quantity: Int,

    @Column(name = "unit_price", nullable = false)
    val unitPrice: Long,

    @Column(name = "discount_amount", nullable = false)
    val discountAmount: Long = 0

) : BaseEntity() {

    val subtotal: Long get() = (quantity * unitPrice) - discountAmount

    val unitPriceFormatted: String get() = "$${String.format("%,d", unitPrice)}"

    val subtotalFormatted: String get() = "$${String.format("%,d", subtotal)}"

    companion object {
        fun fromCartItem(cartItem: CartItem, productSku: String? = null) = OrderItem(
            productId = cartItem.productId,
            productName = cartItem.productName,
            productSlug = cartItem.productSlug,
            productImageUrl = cartItem.productImageUrl,
            productSku = productSku,
            quantity = cartItem.quantity,
            unitPrice = cartItem.unitPrice
        )
    }
}