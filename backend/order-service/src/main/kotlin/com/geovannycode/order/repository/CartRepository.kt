package com.geovannycode.order.repository

import com.geovannycode.order.entity.Cart
import com.geovannycode.order.entity.CartStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional

@Repository
interface CartRepository : JpaRepository<Cart, Long> {

    fun findByUserIdAndStatus(userId: Long, status: CartStatus): Optional<Cart>

    fun findBySessionIdAndStatus(sessionId: String, status: CartStatus): Optional<Cart>

    fun existsByUserIdAndStatus(userId: Long, status: CartStatus): Boolean

    @Query("""
        SELECT c FROM Cart c LEFT JOIN FETCH c.items 
        WHERE c.userId = :userId AND c.status = :status
    """)
    fun findByUserIdAndStatusWithItemsFetch(
        @Param("userId") userId: Long,
        @Param("status") status: CartStatus
    ): Optional<Cart>

    @Query("""
        SELECT c FROM Cart c LEFT JOIN FETCH c.items 
        WHERE c.sessionId = :sessionId AND c.status = :status
    """)
    fun findBySessionIdAndStatusWithItemsFetch(
        @Param("sessionId") sessionId: String,
        @Param("status") status: CartStatus
    ): Optional<Cart>

    @Query("SELECT c FROM Cart c WHERE c.status = 'ACTIVE' AND c.expiresAt < :now")
    fun findExpiredCarts(@Param("now") now: Instant): List<Cart>

    @Modifying
    @Query("""
        UPDATE Cart c SET c.status = 'EXPIRED', c.updatedAt = CURRENT_TIMESTAMP 
        WHERE c.status = 'ACTIVE' AND c.expiresAt < :now
    """)
    fun markExpiredCarts(@Param("now") now: Instant): Int
}