package com.geovannycode.verdemango.catalog

import com.geovannycode.verdemango.catalog.service.ProductService
import org.springframework.stereotype.Component

/**
 * Facade publica del modulo catalog.
 * Otros modulos (p. ej. orders) deben consultar productos a traves de esta API
 * en lugar de depender directamente de los tipos internos de catalog.
 */
@Component
class ProductApi(
    private val productService: ProductService
) {
    fun getProductForOrder(id: Long): ProductForOrder {
        val product = productService.getById(id)
        return ProductForOrder(
            id = product.id,
            name = product.name,
            slug = product.slug,
            sku = product.sku,
            primaryImageUrl = product.primaryImageUrl,
            price = product.price,
            stock = product.stock,
            isInStock = product.isInStock
        )
    }
}

data class ProductForOrder(
    val id: Long,
    val name: String,
    val slug: String,
    val sku: String?,
    val primaryImageUrl: String?,
    val price: Long,
    val stock: Int,
    val isInStock: Boolean
)
