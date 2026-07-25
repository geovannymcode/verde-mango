package com.geovannycode.verdemango.catalog.domain

import com.geovannycode.verdemango.common.domain.BaseEntity
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant

@Entity
@Table(
    name = "products",
    indexes = [
        Index(name = "idx_products_slug", columnList = "slug", unique = true),
        Index(name = "idx_products_category_id", columnList = "category_id"),
        Index(name = "idx_products_active", columnList = "active"),
        Index(name = "idx_products_featured", columnList = "featured"),
        Index(name = "idx_products_price", columnList = "price")
    ]
)
class Product(

    @Column(name = "name", nullable = false, length = 255)
    var name: String,

    @Column(name = "slug", nullable = false, unique = true, length = 300)
    var slug: String,

    @Column(name = "short_description", length = 500)
    var shortDescription: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "price", nullable = false)
    var price: Long,

    @Column(name = "compare_at_price")
    var compareAtPrice: Long? = null,

    @Column(name = "cost_price")
    var costPrice: Long? = null,

    @Column(name = "sku", length = 100)
    var sku: String? = null,

    @Column(name = "barcode", length = 50)
    var barcode: String? = null,

    @Column(name = "stock", nullable = false)
    var stock: Int = 0,

    @Column(name = "low_stock_threshold", nullable = false)
    var lowStockThreshold: Int = 5,

    @Column(name = "track_inventory", nullable = false)
    var trackInventory: Boolean = true,

    @Column(name = "allow_backorder", nullable = false)
    var allowBackorder: Boolean = false,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    var category: Category? = null,

    @Column(name = "weight_grams")
    var weightGrams: Int? = null,

    @Column(name = "featured", nullable = false)
    var featured: Boolean = false,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "average_rating", precision = 3, scale = 2)
    var averageRating: BigDecimal? = null,

    @Column(name = "rating_count", nullable = false)
    var ratingCount: Int = 0,

    @Column(name = "meta_title", length = 70)
    var metaTitle: String? = null,

    @Column(name = "meta_description", length = 160)
    var metaDescription: String? = null,

    @Column(name = "published_at")
    var publishedAt: Instant? = null

) : BaseEntity() {

    @OneToMany(mappedBy = "product", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    val images: MutableList<ProductImage> = mutableListOf()

    @OneToMany(mappedBy = "product", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    val ratings: MutableList<ProductRating> = mutableListOf()

    // ============== Inventory ==============

    val isInStock: Boolean
        get() = !trackInventory || stock > 0 || allowBackorder

    val isLowStock: Boolean
        get() = trackInventory && stock in 1..lowStockThreshold

    val isOutOfStock: Boolean
        get() = trackInventory && stock <= 0 && !allowBackorder

    // ============== Price ==============

    val hasDiscount: Boolean
        get() = compareAtPrice != null && compareAtPrice!! > price

    val discountPercentage: Int
        get() = if (hasDiscount) ((compareAtPrice!! - price) * 100 / compareAtPrice!!).toInt() else 0

    val discountAmount: Long
        get() = if (hasDiscount) compareAtPrice!! - price else 0

    val profitMargin: Double?
        get() = costPrice?.let { cost -> if (cost > 0) ((price - cost).toDouble() / price) * 100 else null }

    // ============== Images ==============

    val primaryImage: ProductImage?
        get() = images.find { it.isPrimary } ?: images.firstOrNull()

    val primaryImageUrl: String?
        get() = primaryImage?.url

    // ============== Ratings ==============

    val hasRatings: Boolean
        get() = ratingCount > 0

    val roundedRating: Double?
        get() = averageRating?.let { (Math.round(it.toDouble() * 2) / 2.0) }

    // ============== Business methods: Inventory ==============

    fun decreaseStock(quantity: Int) {
        require(quantity > 0) { "La cantidad debe ser positiva" }
        if (trackInventory && !allowBackorder) {
            check(stock >= quantity) { "Stock insuficiente. Disponible: $stock, Solicitado: $quantity" }
        }
        if (trackInventory) this.stock -= quantity
    }

    fun increaseStock(quantity: Int) {
        require(quantity > 0) { "La cantidad debe ser positiva" }
        this.stock += quantity
    }

    fun adjustStockTo(quantity: Int) {
        require(quantity >= 0) { "El stock no puede ser negativo" }
        this.stock = quantity
    }

    fun reserveStock(quantity: Int): Boolean {
        if (!trackInventory) return true
        return if (stock >= quantity || allowBackorder) {
            stock -= quantity
            true
        } else false
    }

    fun releaseStock(quantity: Int) {
        require(quantity > 0) { "La cantidad debe ser positiva" }
        stock += quantity
    }

    // ============== Business methods: Images ==============

    fun addImage(url: String, altText: String? = null, isPrimary: Boolean = false): ProductImage {
        if (isPrimary) images.find { it.isPrimary }?.isPrimary = false
        val shouldBePrimary = isPrimary || images.isEmpty()
        val image = ProductImage(
            product = this, url = url, altText = altText ?: name,
            isPrimary = shouldBePrimary, sortOrder = images.size
        )
        images.add(image)
        return image
    }

    fun removeImage(imageId: Long): Boolean {
        val image = images.find { it.id == imageId } ?: return false
        val wasPrimary = image.isPrimary
        images.remove(image)
        if (wasPrimary && images.isNotEmpty()) images.first().isPrimary = true
        return true
    }

    fun setPrimaryImage(imageId: Long): Boolean {
        val newPrimary = images.find { it.id == imageId } ?: return false
        images.find { it.isPrimary }?.isPrimary = false
        newPrimary.isPrimary = true
        return true
    }

    // ============== Business methods: Ratings ==============

    fun recalculateRating() {
        val approvedRatings = ratings.filter { it.approved }
        if (approvedRatings.isEmpty()) {
            averageRating = null
            ratingCount = 0
        } else {
            averageRating = approvedRatings.map { it.rating.toInt() }.average()
                .toBigDecimal().setScale(2, RoundingMode.HALF_UP)
            ratingCount = approvedRatings.size
        }
    }

    // ============== Business methods: State ==============

    fun publish() {
        this.active = true
        this.publishedAt = this.publishedAt ?: Instant.now()
    }

    fun unpublish() {
        this.active = false
    }

    fun markAsFeatured() {
        this.featured = true
    }

    fun unmarkAsFeatured() {
        this.featured = false
    }

    override fun toString(): String =
        "Product(id=$id, name='$name', slug='$slug', price=$price, stock=$stock, active=$active)"
}
