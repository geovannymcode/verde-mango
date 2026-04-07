package com.geovannycode.product.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

/**
 * Entidad para imágenes de productos.
 * Cada producto puede tener múltiples imágenes, con una marcada como primaria.
 */
@Entity
@Table(
    name = "product_images",
    indexes = [
        Index(name = "idx_product_images_product_id", columnList = "product_id"),
        Index(name = "idx_product_images_primary", columnList = "product_id, is_primary")
    ]
)
class ProductImage(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    val product: Product,

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    var url: String,

    @Column(name = "alt_text", length = 255)
    var altText: String? = null,

    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "width")
    var width: Int? = null,

    @Column(name = "height")
    var height: Int? = null

) : BaseEntity() {

    /**
     * Ratio de aspecto de la imagen (si están disponibles las dimensiones)
     */
    val aspectRatio: Double?
        get() = if (width != null && height != null && height!! > 0) {
            width!!.toDouble() / height!!
        } else null

    /**
     * Indica si la imagen es horizontal (landscape)
     */
    val isLandscape: Boolean
        get() = (aspectRatio ?: 1.0) > 1.0

    /**
     * Indica si la imagen es vertical (portrait)
     */
    val isPortrait: Boolean
        get() = (aspectRatio ?: 1.0) < 1.0

    override fun toString(): String =
        "ProductImage(id=$id, productId=${product.id}, isPrimary=$isPrimary, url='$url')"
}