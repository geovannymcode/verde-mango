package com.geovannycode.order.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "cart_items")
class CartItem(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    var cart: Cart? = null,

    @Column(name = "product_id", nullable = false)
    val productId: Long,

    @Column(name = "product_name", nullable = false, length = 255)
    var productName: String,

    @Column(name = "product_slug", nullable = false, length = 300)
    var productSlug: String,

    @Column(name = "product_image_url", columnDefinition = "TEXT")
    var productImageUrl: String? = null,

    @Column(name = "quantity", nullable = false)
    var quantity: Int,

    @Column(name = "unit_price", nullable = false)
    var unitPrice: Long

) : BaseEntity() {

    val subtotal: Long get() = quantity * unitPrice

    val unitPriceFormatted: String get() = "$${String.format("%,d", unitPrice)}"

    val subtotalFormatted: String get() = "$${String.format("%,d", subtotal)}"
}