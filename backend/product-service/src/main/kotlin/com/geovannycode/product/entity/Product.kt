package com.geovannycode.product.entity

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

/**
 * Entidad principal de producto.
 * Incluye información de precio, inventario, ratings y relaciones.
 */
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

    @OneToMany(
        mappedBy = "product",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @OrderBy("sortOrder ASC")
    val images: MutableList<ProductImage> = mutableListOf()

    @OneToMany(
        mappedBy = "product",
        cascade = [CascadeType.ALL],
        fetch = FetchType.LAZY
    )
    @OrderBy("createdAt DESC")
    val ratings: MutableList<ProductRating> = mutableListOf()

    // ============== Propiedades computadas de inventario ==============

    /**
     * Indica si hay stock disponible
     */
    val isInStock: Boolean
        get() = !trackInventory || stock > 0 || allowBackorder

    /**
     * Indica si el stock está por debajo del umbral
     */
    val isLowStock: Boolean
        get() = trackInventory && stock in 1..lowStockThreshold

    /**
     * Indica si está agotado
     */
    val isOutOfStock: Boolean
        get() = trackInventory && stock <= 0 && !allowBackorder

    // ============== Propiedades computadas de precio ==============

    /**
     * Indica si tiene descuento activo
     */
    val hasDiscount: Boolean
        get() = compareAtPrice != null && compareAtPrice!! > price

    /**
     * Porcentaje de descuento (0-100)
     */
    val discountPercentage: Int
        get() = if (hasDiscount) {
            ((compareAtPrice!! - price) * 100 / compareAtPrice!!).toInt()
        } else 0

    /**
     * Monto del descuento
     */
    val discountAmount: Long
        get() = if (hasDiscount) compareAtPrice!! - price else 0

    /**
     * Margen de ganancia
     */
    val profitMargin: Double?
        get() = costPrice?.let { cost ->
            if (cost > 0) ((price - cost).toDouble() / price) * 100 else null
        }

    // ============== Propiedades computadas de imágenes ==============

    /**
     * Imagen principal del producto
     */
    val primaryImage: ProductImage?
        get() = images.find { it.isPrimary } ?: images.firstOrNull()

    /**
     * URL de la imagen principal
     */
    val primaryImageUrl: String?
        get() = primaryImage?.url

    // ============== Propiedades computadas de ratings ==============

    /**
     * Indica si tiene ratings
     */
    val hasRatings: Boolean
        get() = ratingCount > 0

    /**
     * Rating redondeado a medios (0, 0.5, 1, 1.5, ... 5)
     */
    val roundedRating: Double?
        get() = averageRating?.let { (Math.round(it.toDouble() * 2) / 2.0) }

    // ============== Métodos de negocio: Inventario ==============

    /**
     * Disminuye el stock. Lanza excepción si no hay suficiente.
     *
     * @throws IllegalArgumentException si quantity <= 0
     * @throws IllegalStateException si no hay stock suficiente
     */
    fun decreaseStock(quantity: Int) {
        require(quantity > 0) { "La cantidad debe ser positiva" }

        if (trackInventory && !allowBackorder) {
            check(stock >= quantity) {
                "Stock insuficiente. Disponible: $stock, Solicitado: $quantity"
            }
        }

        if (trackInventory) {
            this.stock -= quantity
        }
    }

    /**
     * Aumenta el stock.
     *
     * @throws IllegalArgumentException si quantity <= 0
     */
    fun increaseStock(quantity: Int) {
        require(quantity > 0) { "La cantidad debe ser positiva" }
        this.stock += quantity
    }

    /**
     * Establece el stock a un valor específico.
     *
     * @throws IllegalArgumentException si quantity < 0
     */
    fun adjustStockTo(quantity: Int) {
        require(quantity >= 0) { "El stock no puede ser negativo" }
        this.stock = quantity
    }

    /**
     * Reserva stock para una orden (puede quedar en negativo si permite backorder)
     */
    fun reserveStock(quantity: Int): Boolean {
        if (!trackInventory) return true

        return if (stock >= quantity || allowBackorder) {
            stock -= quantity
            true
        } else {
            false
        }
    }

    /**
     * Libera stock reservado (cuando se cancela una orden)
     */
    fun releaseStock(quantity: Int) {
        require(quantity > 0) { "La cantidad debe ser positiva" }
        stock += quantity
    }

    // ============== Métodos de negocio: Imágenes ==============

    /**
     * Agrega una imagen al producto
     */
    fun addImage(url: String, altText: String? = null, isPrimary: Boolean = false): ProductImage {
        // Si es primaria, quitar el flag de la actual primaria
        if (isPrimary) {
            images.find { it.isPrimary }?.isPrimary = false
        }

        // Si es la primera imagen, hacerla primaria
        val shouldBePrimary = isPrimary || images.isEmpty()

        val image = ProductImage(
            product = this,
            url = url,
            altText = altText ?: name,
            isPrimary = shouldBePrimary,
            sortOrder = images.size
        )

        images.add(image)
        return image
    }

    /**
     * Remueve una imagen por ID
     */
    fun removeImage(imageId: Long): Boolean {
        val image = images.find { it.id == imageId } ?: return false
        val wasPrimary = image.isPrimary

        images.remove(image)

        // Si era primaria, hacer primaria la primera disponible
        if (wasPrimary && images.isNotEmpty()) {
            images.first().isPrimary = true
        }

        return true
    }

    /**
     * Establece una imagen como primaria
     */
    fun setPrimaryImage(imageId: Long): Boolean {
        val newPrimary = images.find { it.id == imageId } ?: return false

        images.find { it.isPrimary }?.isPrimary = false
        newPrimary.isPrimary = true

        return true
    }

    // ============== Métodos de negocio: Ratings ==============

    /**
     * Actualiza el rating promedio (normalmente hecho por trigger en DB)
     * Este método es para sincronización manual si es necesario.
     */
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

    // ============== Métodos de negocio: Estado ==============

    /**
     * Publica el producto (lo hace visible)
     */
    fun publish() {
        this.active = true
        this.publishedAt = this.publishedAt ?: Instant.now()
    }

    /**
     * Despublica el producto (lo oculta)
     */
    fun unpublish() {
        this.active = false
    }

    /**
     * Marca como destacado
     */
    fun markAsFeatured() {
        this.featured = true
    }

    /**
     * Quita de destacados
     */
    fun unmarkAsFeatured() {
        this.featured = false
    }

    override fun toString(): String =
        "Product(id=$id, name='$name', slug='$slug', price=$price, stock=$stock, active=$active)"
}