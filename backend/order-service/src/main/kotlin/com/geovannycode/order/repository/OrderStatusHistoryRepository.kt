package com.geovannycode.order.repository

import com.geovannycode.order.entity.OrderStatusHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderStatusHistoryRepository : JpaRepository<OrderStatusHistory, Long> {

    fun findByOrderIdOrderByCreatedAtDesc(orderId: Long): List<OrderStatusHistory>

    fun findFirstByOrderIdOrderByCreatedAtDesc(orderId: Long): OrderStatusHistory?
}