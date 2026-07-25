package com.geovannycode.verdemango.catalog.repository

import com.geovannycode.verdemango.catalog.domain.Product
import org.springframework.data.jpa.domain.Specification

object ProductSpecifications {

    fun isActive(): Specification<Product> =
        Specification { root, _, cb -> cb.isTrue(root.get("active")) }

    fun hasCategorySlug(categorySlug: String?): Specification<Product>? {
        val slug = categorySlug?.takeIf { it.isNotBlank() } ?: return null
        return Specification { root, _, cb ->
            cb.equal(root.get<Any>("category").get<String>("slug"), slug)
        }
    }

    fun priceGreaterOrEqual(minPrice: Long?): Specification<Product>? {
        minPrice ?: return null
        return Specification { root, _, cb ->
            cb.greaterThanOrEqualTo(root.get("price"), minPrice)
        }
    }

    fun priceLessOrEqual(maxPrice: Long?): Specification<Product>? {
        maxPrice ?: return null
        return Specification { root, _, cb ->
            cb.lessThanOrEqualTo(root.get("price"), maxPrice)
        }
    }

    fun stockAvailability(inStock: Boolean?): Specification<Product>? {
        inStock ?: return null
        return if (inStock) {
            Specification { root, _, cb -> cb.greaterThan(root.get("stock"), 0) }
        } else null
    }

    fun nameOrDescriptionContains(search: String?): Specification<Product>? {
        val term = search?.takeIf { it.isNotBlank() } ?: return null
        val pattern = "%${term.lowercase()}%"
        return Specification { root, _, cb ->
            cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
            )
        }
    }
}
