package com.geovannycode.product.repository

import com.geovannycode.product.entity.Category
import com.geovannycode.product.entity.Product
import jakarta.persistence.criteria.JoinType
import org.springframework.data.jpa.domain.Specification

/**
 * Specifications reutilizables para consultas dinámicas de [Product].
 *
 * Cada función devuelve `null` cuando el filtro no debe aplicarse, lo que permite
 * componerlas con `Specification.where(...).and(...)` sin agregar cláusulas innecesarias
 * al SQL generado. Esto evita el bug de Hibernate 6 + PostgreSQL con parámetros
 * nullables en `LOWER(?)` (function lower(bytea) does not exist).
 */
object ProductSpecifications {

    /**
     * Filtra únicamente productos activos. Siempre aplica.
     */
    fun isActive(): Specification<Product> =
        Specification { root, _, cb ->
            cb.isTrue(root.get("active"))
        }

    /**
     * Filtra por slug de categoría. Retorna null si [categorySlug] es null o blank.
     */
    fun hasCategorySlug(categorySlug: String?): Specification<Product>? {
        val slug = categorySlug?.takeIf { it.isNotBlank() } ?: return null
        return Specification { root, _, cb ->
            val category = root.join<Product, Category>("category", JoinType.LEFT)
            cb.equal(category.get<String>("slug"), slug)
        }
    }

    /**
     * Filtra por precio mínimo (inclusive). Retorna null si [minPrice] es null.
     */
    fun priceGreaterOrEqual(minPrice: Long?): Specification<Product>? {
        val min = minPrice ?: return null
        return Specification { root, _, cb ->
            cb.greaterThanOrEqualTo(root.get("price"), min)
        }
    }

    /**
     * Filtra por precio máximo (inclusive). Retorna null si [maxPrice] es null.
     */
    fun priceLessOrEqual(maxPrice: Long?): Specification<Product>? {
        val max = maxPrice ?: return null
        return Specification { root, _, cb ->
            cb.lessThanOrEqualTo(root.get("price"), max)
        }
    }

    /**
     * Filtra por disponibilidad de stock.
     * - `true`: stock > 0
     * - `false`: stock <= 0
     * - `null`: no aplica
     */
    fun stockAvailability(inStock: Boolean?): Specification<Product>? {
        val available = inStock ?: return null
        return Specification { root, _, cb ->
            if (available) {
                cb.greaterThan(root.get("stock"), 0)
            } else {
                cb.lessThanOrEqualTo(root.get("stock"), 0)
            }
        }
    }

    /**
     * Búsqueda case-insensitive por nombre o descripción usando LIKE.
     * Retorna null si [search] es null o blank.
     *
     * Nota: esta implementación no aprovecha el índice GIN `idx_products_name_search`.
     * Para búsquedas a escala, ver [fullTextSearch] más abajo.
     */
    fun nameOrDescriptionContains(search: String?): Specification<Product>? {
        val term = search?.takeIf { it.isNotBlank() }?.lowercase() ?: return null
        val pattern = "%$term%"
        return Specification { root, _, cb ->
            cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
            )
        }
    }

    /**
     * Búsqueda full-text usando el índice GIN `idx_products_name_search`
     * (to_tsvector('spanish', name)).
     *
     * Esta versión es mucho más rápida que LIKE para catálogos grandes, pero
     * solo busca en `name` (no en `description`). Úsala cuando el catálogo crezca.
     *
     * Ver la sección "Full-Text Search opcional" al final de esta guía
     * antes de activarla: requiere una función nativa de PostgreSQL.
     */
    fun fullTextSearch(search: String?): Specification<Product>? {
        val term = search?.takeIf { it.isNotBlank() } ?: return null
        return Specification { root, _, cb ->
            cb.isTrue(
                cb.function(
                    "fts_match_spanish",
                    Boolean::class.java,
                    root.get<String>("name"),
                    cb.literal(term)
                )
            )
        }
    }
}