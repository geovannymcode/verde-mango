package com.geovannycode.order.service

import com.geovannycode.order.dto.CancelOrderRequest
import com.geovannycode.order.dto.OrderFilterParams
import com.geovannycode.order.dto.OrderListResponse
import com.geovannycode.order.dto.OrderResponse
import com.geovannycode.order.dto.OrderStatsResponse
import com.geovannycode.order.dto.UpdateOrderStatusRequest
import com.geovannycode.order.messaging.OrderEventPublisher
import com.geovannycode.order.repository.OrderRepository
import com.geovannycode.shared.constant.OrderStatus
import com.geovannycode.shared.dto.PageResponse
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class OrderService(
    private val orderRepository: OrderRepository,
    private val orderEventPublisher: OrderEventPublisher,
    @Value("\${order.cancellation-window-hours:2}")
    private val cancellationWindowHours: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ==================== Consultas de usuario ====================

    @Transactional(readOnly = true)
    fun getUserOrders(userId: Long, status: OrderStatus? = null, page: Int = 0, size: Int = 10): PageResponse<OrderListResponse> {
        val pageable = PageRequest.of(page, size)

        val orderPage = if (status != null) {
            orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable)
        } else {
            orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
        }

        return PageResponse.of(
            content = orderPage.content.map { OrderListResponse.from(it) },
            page = page, size = size, totalElements = orderPage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getUserOrder(userId: Long, orderNumber: String): OrderResponse {
        val order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
            .orElseThrow { ResourceNotFoundException("Orden", "número", orderNumber) }
        return OrderResponse.from(order)
    }

    @Transactional
    fun cancelOrder(userId: Long, orderNumber: String, request: CancelOrderRequest): OrderResponse {
        val order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
            .orElseThrow { ResourceNotFoundException("Orden", "número", orderNumber) }

        val cancellationDeadline = order.createdAt.plus(cancellationWindowHours, ChronoUnit.HOURS)
        if (Instant.now().isAfter(cancellationDeadline)) {
            throw BusinessRuleException("El tiempo límite de cancelación ha pasado")
        }

        if (!order.canBeCancelled) {
            throw BusinessRuleException("La orden no puede ser cancelada en su estado actual")
        }

        order.cancel(request.reason, userId)
        val savedOrder = orderRepository.save(order)

        orderEventPublisher.publishOrderCancelled(savedOrder, request.reason)
        logger.info("Orden ${order.orderNumber} cancelada por usuario $userId")

        return OrderResponse.from(savedOrder)
    }

    // ==================== Consultas de admin ====================

    @Transactional(readOnly = true)
    fun getAllOrders(params: OrderFilterParams): PageResponse<OrderListResponse> {
        val pageable = PageRequest.of(params.page, params.size)

        val orderPage = orderRepository.findWithFilters(
            status = params.status, userId = params.userId, search = params.search,
            fromDate = params.fromDate, toDate = params.toDate, pageable = pageable
        )

        return PageResponse.of(
            content = orderPage.content.map { OrderListResponse.from(it) },
            page = params.page, size = params.size, totalElements = orderPage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getOrderById(id: Long): OrderResponse {
        val order = orderRepository.findByIdWithDetails(id)
            .orElseThrow { ResourceNotFoundException("Orden", "id", id) }
        return OrderResponse.from(order)
    }

    @Transactional
    fun updateOrderStatus(id: Long, request: UpdateOrderStatusRequest, adminId: Long): OrderResponse {
        val order = orderRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Orden", "id", id) }

        when (request.status) {
            OrderStatus.SHIPPED -> {
                order.markAsShipped(request.trackingNumber, request.carrier, adminId)
            }
            OrderStatus.DELIVERED -> {
                order.markAsDelivered(adminId)
            }
            else -> {
                order.updateStatus(request.status, request.comment, adminId, "ADMIN")
            }
        }

        val savedOrder = orderRepository.save(order)
        orderEventPublisher.publishOrderStatusChanged(savedOrder)

        logger.info("Orden ${order.orderNumber} actualizada a ${request.status} por admin $adminId")
        return OrderResponse.from(savedOrder)
    }

    @Transactional(readOnly = true)
    fun getOrderStats(fromDate: Instant, toDate: Instant): OrderStatsResponse {
        return OrderStatsResponse(
            totalOrders = orderRepository.count(),
            pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING),
            processingOrders = orderRepository.countByStatus(OrderStatus.PROCESSING),
            deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED),
            cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED),
            totalRevenue = orderRepository.getTotalRevenue(fromDate, toDate),
            totalRevenueFormatted = "$${String.format("%,d", orderRepository.getTotalRevenue(fromDate, toDate))}",
            averageOrderValue = orderRepository.getAverageOrderValue()
        )
    }

    // ==================== Callbacks de pago ====================

    @Transactional
    fun confirmPayment(orderId: Long, paymentId: Long, paymentMethod: String, paymentReference: String?) {
        val order = orderRepository.findById(orderId)
            .orElseThrow { ResourceNotFoundException("Orden", "id", orderId) }

        order.confirmPayment(paymentId, paymentMethod, paymentReference)
        val savedOrder = orderRepository.save(order)

        orderEventPublisher.publishOrderPaid(savedOrder)
        logger.info("Pago confirmado para orden ${order.orderNumber}")
    }
}