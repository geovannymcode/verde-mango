package com.geovannycode.verdemango.catalog.repository

import com.geovannycode.verdemango.catalog.domain.Product
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ProductRepository : JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    fun findBySlug(slug: String): Optional<Product>

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.slug = :slug AND p.active = true")
    fun findBySlugWithImages(slug: String): Optional<Product>

    fun existsBySlug(slug: String): Boolean

    fun existsBySlugAndIdNot(slug: String, id: Long): Boolean

    fun existsBySku(sku: String): Boolean

    fun existsBySkuAndIdNot(sku: String, id: Long): Boolean

    @Query("""
        SELECT p FROM Product p LEFT JOIN FETCH p.images 
        WHERE p.featured = true AND p.active = true 
        ORDER BY p.createdAt DESC
    """)
    fun findFeaturedWithImages(pageable: Pageable): Page<Product>

    @Query("""
        SELECT p FROM Product p LEFT JOIN FETCH p.images 
        WHERE p.category.id = :categoryId AND p.id != :excludeId AND p.active = true 
        ORDER BY p.averageRating DESC NULLS LAST
    """)
    fun findRelatedProducts(categoryId: Long, excludeId: Long, pageable: Pageable): Page<Product>

    @Modifying
    @Query("UPDATE Product p SET p.featured = :featured WHERE p.id = :id")
    fun updateFeatured(id: Long, featured: Boolean): Int
}
