package com.geovannycode.order.repository

import com.geovannycode.order.entity.Order
import com.geovannycode.shared.constant.OrderStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional

@Repository
interface OrderRepository : JpaRepository<Order, Long> {

    fun findByOrderNumber(orderNumber: String): Optional<Order>

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber")
    fun findByOrderNumberWithItems(@Param("orderNumber") orderNumber: String): Optional<Order>

    fun findByOrderNumberAndUserId(orderNumber: String, userId: Long): Optional<Order>

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id")
    fun findByIdWithItems(@Param("id") id: Long): Optional<Order>

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.statusHistory WHERE o.id = :id")
    fun findByIdWithStatusHistory(@Param("id") id: Long): Optional<Order>

    fun findByUserIdOrderByCreatedAtDesc(userId: Long, pageable: Pageable): Page<Order>

    fun findByUserIdAndStatusOrderByCreatedAtDesc(userId: Long, status: OrderStatus, pageable: Pageable): Page<Order>

    fun countByUserId(userId: Long): Long

    fun countByUserIdAndStatus(userId: Long, status: OrderStatus): Long

    @Query("""
        SELECT o FROM Order o 
        WHERE (:status IS NULL OR o.status = :status)
        AND (:userId IS NULL OR o.userId = :userId)
        AND (:search IS NULL OR o.orderNumber LIKE CONCAT('%', :search, '%') 
             OR o.userEmail LIKE CONCAT('%', :search, '%'))
        AND (:fromDate IS NULL OR o.createdAt >= :fromDate)
        AND (:toDate IS NULL OR o.createdAt <= :toDate)
        ORDER BY o.createdAt DESC
    """)
    fun findWithFilters(
        @Param("status") status: OrderStatus?,
        @Param("userId") userId: Long?,
        @Param("search") search: String?,
        @Param("fromDate") fromDate: Instant?,
        @Param("toDate") toDate: Instant?,
        pageable: Pageable
    ): Page<Order>

    fun countByStatus(status: OrderStatus): Long

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o 
        WHERE o.status IN :statuses
        AND o.createdAt BETWEEN :from AND :to
    """)
    fun getTotalRevenue(
        @Param("from") from: Instant,
        @Param("to") to: Instant,
        @Param("statuses") statuses: List<OrderStatus> = listOf(
            OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED
        )
    ): Long

    @Query("SELECT COALESCE(AVG(o.totalAmount), 0) FROM Order o WHERE o.status IN :statuses")
    fun getAverageOrderValue(
        @Param("statuses") statuses: List<OrderStatus> = listOf(
            OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED
        )
    ): Double

    fun existsByOrderNumber(orderNumber: String): Boolean

    @Query("""
        SELECT COUNT(oi) > 0 FROM OrderItem oi JOIN oi.order o 
        WHERE o.userId = :userId AND oi.productId = :productId 
        AND o.status IN :statuses
    """)
    fun hasUserPurchasedProduct(
        @Param("userId") userId: Long,
        @Param("productId") productId: Long,
        @Param("statuses") statuses: List<OrderStatus> = listOf(
            OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED
        )
    ): Boolean
}