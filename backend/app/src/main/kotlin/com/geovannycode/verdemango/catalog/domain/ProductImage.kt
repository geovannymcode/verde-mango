package com.geovannycode.verdemango.catalog.domain

import com.geovannycode.verdemango.common.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

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

    val aspectRatio: Double?
        get() = if (width != null && height != null && height!! > 0) {
            width!!.toDouble() / height!!
        } else null

    val isLandscape: Boolean
        get() = (aspectRatio ?: 1.0) > 1.0

    val isPortrait: Boolean
        get() = (aspectRatio ?: 1.0) < 1.0

    override fun toString(): String =
        "ProductImage(id=$id, productId=${product.id}, isPrimary=$isPrimary, url='$url')"
}
