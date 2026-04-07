package com.geovannycode.product.repository

import com.geovannycode.product.entity.Product
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

    // ============== Búsquedas básicas ==============

    fun findBySlug(slug: String): Optional<Product>

    fun findBySlugAndActiveTrue(slug: String): Optional<Product>

    fun existsBySlug(slug: String): Boolean

    fun existsBySlugAndIdNot(slug: String, id: Long): Boolean

    fun existsBySku(sku: String): Boolean

    fun existsBySkuAndIdNot(sku: String, id: Long): Boolean

    // ============== Productos activos ==============

    fun findByActiveTrue(pageable: Pageable): Page<Product>

    fun findByActiveTrueAndFeaturedTrue(pageable: Pageable): Page<Product>

    // ============== Por categoría ==============

    fun findByCategorySlugAndActiveTrue(categorySlug: String, pageable: Pageable): Page<Product>

    fun findByCategoryIdAndActiveTrue(categoryId: Long, pageable: Pageable): Page<Product>

    // ============== Destacados ==============

    @Query("""
        SELECT p FROM Product p 
        WHERE p.active = true AND p.featured = true 
        ORDER BY p.createdAt DESC
    """)
    fun findFeaturedProducts(pageable: Pageable): Page<Product>



    // ============== Con imágenes (evitar N+1) ==============

    @Query("""
        SELECT DISTINCT p FROM Product p 
        LEFT JOIN FETCH p.images 
        WHERE p.slug = :slug AND p.active = true
    """)
    fun findBySlugWithImages(slug: String): Optional<Product>

    @Query("""
        SELECT DISTINCT p FROM Product p 
        LEFT JOIN FETCH p.images 
        WHERE p.active = true AND p.featured = true 
        ORDER BY p.createdAt DESC
    """)
    fun findFeaturedWithImages(pageable: Pageable): Page<Product>

    // ============== Productos relacionados ==============

    @Query("""
        SELECT p FROM Product p 
        WHERE p.category.id = :categoryId 
        AND p.id != :productId 
        AND p.active = true 
        ORDER BY p.averageRating DESC NULLS LAST, p.createdAt DESC
    """)
    fun findRelatedProducts(categoryId: Long, productId: Long, pageable: Pageable): Page<Product>

    // ============== Stock ==============

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stock > 0 AND p.stock <= p.lowStockThreshold")
    fun findLowStockProducts(): List<Product>

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stock <= 0 AND p.trackInventory = true")
    fun findOutOfStockProducts(): List<Product>

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :productId AND p.stock >= :quantity")
    fun decreaseStock(productId: Long, quantity: Int): Int

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock + :quantity WHERE p.id = :productId")
    fun increaseStock(productId: Long, quantity: Int): Int

    // ============== Estadísticas ==============

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true")
    fun countActiveProducts(): Long

    @Query("SELECT AVG(p.price) FROM Product p WHERE p.active = true")
    fun averagePrice(): Double?

    @Query("""
        SELECT c.name, COUNT(p) 
        FROM Product p 
        JOIN p.category c 
        WHERE p.active = true 
        GROUP BY c.id, c.name 
        ORDER BY COUNT(p) DESC
    """)
    fun countByCategory(): List<Array<Any>>

    // ============== Por IDs ==============

    @Query("SELECT p FROM Product p WHERE p.id IN :ids AND p.active = true")
    fun findByIdsAndActiveTrue(ids: List<Long>): List<Product>

    // ============== Actualización masiva ==============

    @Modifying
    @Query("UPDATE Product p SET p.active = false WHERE p.id = :id")
    fun deactivate(id: Long): Int

    @Modifying
    @Query("UPDATE Product p SET p.featured = :featured WHERE p.id = :id")
    fun updateFeatured(id: Long, featured: Boolean): Int
}