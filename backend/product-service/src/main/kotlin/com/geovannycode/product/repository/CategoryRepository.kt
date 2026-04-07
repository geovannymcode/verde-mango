package com.geovannycode.product.repository

import com.geovannycode.product.entity.Category
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface CategoryRepository : JpaRepository<Category, Long> {

    // ============== Búsquedas básicas ==============

    fun findBySlug(slug: String): Optional<Category>

    fun findBySlugAndActiveTrue(slug: String): Optional<Category>

    fun existsBySlug(slug: String): Boolean

    fun existsBySlugAndIdNot(slug: String, id: Long): Boolean

    // ============== Categorías activas ==============

    fun findByActiveTrueOrderBySortOrderAsc(): List<Category>

    fun findByActiveTrue(pageable: Pageable): Page<Category>

    // ============== Jerarquía ==============

    /**
     * Obtiene categorías raíz (sin padre)
     */
    @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND c.active = true ORDER BY c.sortOrder")
    fun findRootCategories(): List<Category>

    /**
     * Obtiene subcategorías de una categoría padre
     */
    fun findByParentIdAndActiveTrue(parentId: Long): List<Category>

    /**
     * Obtiene categorías con sus hijos (para evitar N+1)
     */
    @Query("""
        SELECT DISTINCT c FROM Category c 
        LEFT JOIN FETCH c.children 
        WHERE c.parent IS NULL AND c.active = true 
        ORDER BY c.sortOrder
    """)
    fun findRootCategoriesWithChildren(): List<Category>

    // ============== Conteo ==============

    /**
     * Cuenta productos activos por categoría
     */
    @Query("""
        SELECT c.id, COUNT(p) FROM Category c 
        LEFT JOIN c.products p ON p.active = true 
        WHERE c.active = true 
        GROUP BY c.id
    """)
    fun countProductsByCategory(): List<Array<Any>>

    // ============== Búsqueda ==============

    @Query("""
        SELECT c FROM Category c 
        WHERE c.active = true 
        AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY c.sortOrder
    """)
    fun searchCategories(search: String): List<Category>

    // ============== Actualización ==============

    @Modifying
    @Query("UPDATE Category c SET c.active = false WHERE c.id = :id")
    fun deactivate(id: Long): Int

    @Modifying
    @Query("UPDATE Category c SET c.sortOrder = :sortOrder WHERE c.id = :id")
    fun updateSortOrder(id: Long, sortOrder: Int): Int
}