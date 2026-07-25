package com.geovannycode.verdemango.catalog.web

import com.geovannycode.verdemango.catalog.domain.Product
import com.geovannycode.verdemango.catalog.domain.ProductImage
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import jakarta.validation.constraints.Size
import java.time.Instant

// ==================== REQUEST DTOs ====================

data class CreateProductRequest(
    @field:NotBlank(message = "El nombre es requerido")
    @field:Size(min = 2, max = 255)
    val name: String,
    @field:Size(max = 300) val slug: String? = null,
    @field:Size(max = 500) val shortDescription: String? = null,
    val description: String? = null,
    @field:Positive val price: Long,
    @field:PositiveOrZero val compareAtPrice: Long? = null,
    @field:PositiveOrZero val costPrice: Long? = null,
    @field:Size(max = 100) val sku: String? = null,
    @field:Size(max = 50) val barcode: String? = null,
    @field:PositiveOrZero val stock: Int = 0,
    val lowStockThreshold: Int = 5,
    val trackInventory: Boolean = true,
    val allowBackorder: Boolean = false,
    val categoryId: Long? = null,
    val weightGrams: Int? = null,
    val featured: Boolean = false,
    val active: Boolean = true,
    val metaTitle: String? = null,
    val metaDescription: String? = null,
    val imageUrls: List<String> = emptyList()
)

data class UpdateProductRequest(
    @field:Size(min = 2, max = 255) val name: String? = null,
    @field:Size(max = 300) val slug: String? = null,
    @field:Size(max = 500) val shortDescription: String? = null,
    val description: String? = null,
    @field:Positive val price: Long? = null,
    @field:PositiveOrZero val compareAtPrice: Long? = null,
    @field:PositiveOrZero val costPrice: Long? = null,
    @field:Size(max = 100) val sku: String? = null,
    @field:Size(max = 50) val barcode: String? = null,
    @field:PositiveOrZero val stock: Int? = null,
    val lowStockThreshold: Int? = null,
    val trackInventory: Boolean? = null,
    val allowBackorder: Boolean? = null,
    val categoryId: Long? = null,
    val weightGrams: Int? = null,
    val featured: Boolean? = null,
    val active: Boolean? = null,
    val metaTitle: String? = null,
    val metaDescription: String? = null
)

data class UpdateStockRequest(
    val quantity: Int,
    val operation: StockOperation
)

enum class StockOperation { ADD, SUBTRACT, SET }

data class AddProductImageRequest(
    @field:NotBlank val url: String,
    val altText: String? = null,
    val isPrimary: Boolean = false
)

// ==================== RESPONSE DTOs ====================

data class ProductResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val shortDescription: String?,
    val description: String?,
    val price: Long,
    val priceFormatted: String,
    val compareAtPrice: Long?,
    val compareAtPriceFormatted: String?,
    val discountPercentage: Int,
    val discountAmount: Long,
    val sku: String?,
    val barcode: String?,
    val stock: Int,
    val isInStock: Boolean,
    val isLowStock: Boolean,
    val trackInventory: Boolean,
    val allowBackorder: Boolean,
    val category: CategorySummary?,
    val weightGrams: Int?,
    val featured: Boolean,
    val active: Boolean,
    val averageRating: Double?,
    val roundedRating: Double?,
    val ratingCount: Int,
    val images: List<ProductImageResponse>,
    val primaryImageUrl: String?,
    val metaTitle: String?,
    val metaDescription: String?,
    val publishedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(product: Product) = ProductResponse(
            id = product.id,
            name = product.name,
            slug = product.slug,
            shortDescription = product.shortDescription,
            description = product.description,
            price = product.price,
            priceFormatted = formatPrice(product.price),
            compareAtPrice = product.compareAtPrice,
            compareAtPriceFormatted = product.compareAtPrice?.let { formatPrice(it) },
            discountPercentage = product.discountPercentage,
            discountAmount = product.discountAmount,
            sku = product.sku,
            barcode = product.barcode,
            stock = product.stock,
            isInStock = product.isInStock,
            isLowStock = product.isLowStock,
            trackInventory = product.trackInventory,
            allowBackorder = product.allowBackorder,
            category = product.category?.let { CategorySummary.from(it) },
            weightGrams = product.weightGrams,
            featured = product.featured,
            active = product.active,
            averageRating = product.averageRating?.toDouble(),
            roundedRating = product.roundedRating,
            ratingCount = product.ratingCount,
            images = product.images.map { ProductImageResponse.from(it) },
            primaryImageUrl = product.primaryImageUrl,
            metaTitle = product.metaTitle,
            metaDescription = product.metaDescription,
            publishedAt = product.publishedAt,
            createdAt = product.createdAt,
            updatedAt = product.updatedAt
        )

        private fun formatPrice(price: Long): String = "$${String.format("%,d", price)}"
    }
}

data class ProductListResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val shortDescription: String?,
    val price: Long,
    val priceFormatted: String,
    val compareAtPrice: Long?,
    val compareAtPriceFormatted: String?,
    val discountPercentage: Int,
    val stock: Int,
    val isInStock: Boolean,
    val isLowStock: Boolean,
    val categoryId: Long?,
    val categoryName: String?,
    val categorySlug: String?,
    val featured: Boolean,
    val averageRating: Double?,
    val ratingCount: Int,
    val primaryImageUrl: String?
) {
    companion object {
        fun from(product: Product) = ProductListResponse(
            id = product.id,
            name = product.name,
            slug = product.slug,
            shortDescription = product.shortDescription,
            price = product.price,
            priceFormatted = "$${String.format("%,d", product.price)}",
            compareAtPrice = product.compareAtPrice,
            compareAtPriceFormatted = product.compareAtPrice?.let { "$${String.format("%,d", it)}" },
            discountPercentage = product.discountPercentage,
            stock = product.stock,
            isInStock = product.isInStock,
            isLowStock = product.isLowStock,
            categoryId = product.category?.id,
            categoryName = product.category?.name,
            categorySlug = product.category?.slug,
            featured = product.featured,
            averageRating = product.averageRating?.toDouble(),
            ratingCount = product.ratingCount,
            primaryImageUrl = product.primaryImageUrl
        )
    }
}

data class ProductImageResponse(
    val id: Long,
    val url: String,
    val altText: String?,
    val isPrimary: Boolean,
    val sortOrder: Int,
    val width: Int?,
    val height: Int?
) {
    companion object {
        fun from(image: ProductImage) = ProductImageResponse(
            id = image.id,
            url = image.url,
            altText = image.altText,
            isPrimary = image.isPrimary,
            sortOrder = image.sortOrder,
            width = image.width,
            height = image.height
        )
    }
}
