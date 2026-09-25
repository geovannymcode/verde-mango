package com.geovannycode.verdemango.orders.service

import com.geovannycode.verdemango.common.domain.BusinessRuleException
import com.geovannycode.verdemango.common.domain.OrderStatus
import com.geovannycode.verdemango.common.domain.PageResponse
import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import com.geovannycode.verdemango.orders.repository.OrderRepository
import com.geovannycode.verdemango.orders.web.CancelOrderRequest
import com.geovannycode.verdemango.orders.web.OrderFilterParams
import com.geovannycode.verdemango.orders.web.OrderListResponse
import com.geovannycode.verdemango.orders.web.OrderResponse
import com.geovannycode.verdemango.orders.web.OrderStatsResponse
import com.geovannycode.verdemango.orders.web.UpdateOrderStatusRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Locale

@Service
class OrderService(
    private val orderRepository: OrderRepository,
    private val adminRead: com.geovannycode.verdemango.orders.repository.AdminOrderReadRepository,
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
        val (ids, count) = adminRead.page(params)
        val records = orderRepository.findAllById(ids).associateBy { it.id }
        val metadata = adminRead.metadata(ids)
        return PageResponse.of(content = ids.map { id ->
            val info = metadata.getValue(id)
            OrderListResponse.from(records.getValue(id)).copy(customerName = info.name,
                customerEmail = info.email, paymentStatus = info.payment?.status)
        }, page = params.page, size = params.size, totalElements = count)
    }

    @Transactional(readOnly = true)
    fun getOrderById(id: Long): OrderResponse {
        val order = orderRepository.findByIdWithItems(id)
            .orElseThrow { ResourceNotFoundException("Orden", "id", id) }
        orderRepository.findByIdWithStatusHistory(id)
        return adminResponse(order)
    }

    private fun adminResponse(order: com.geovannycode.verdemango.orders.domain.Order): OrderResponse {
        val info = adminRead.metadata(listOf(order.id)).getValue(order.id)
        return OrderResponse.from(order).copy(customerName = info.name, customerEmail = info.email,
            customerPhone = info.phone, customerDocument = info.document, payment = info.payment)
    }

    @Transactional
    fun updateOrderStatus(id: Long, request: UpdateOrderStatusRequest, adminId: Long): OrderResponse {
        val order = orderRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Orden", "id", id) }

        if (!order.status.canTransitionTo(request.status)) throw com.geovannycode.verdemango.common.domain.OrderTransitionConflict(
            "Transición de estado inválida: ${order.status} -> ${request.status}")
        when (request.status) {
            OrderStatus.SHIPPED -> {
                order.markAsShipped(request.trackingNumber, request.carrier, adminId, request.comment)
            }
            OrderStatus.DELIVERED -> {
                order.markAsDelivered(adminId, request.comment)
            }
            else -> {
                order.updateStatus(request.status, request.comment, adminId, "ADMIN")
            }
        }

        val savedOrder = orderRepository.saveAndFlush(order)
        orderEventPublisher.publishOrderStatusChanged(savedOrder)

        logger.info("Orden ${order.orderNumber} actualizada a ${request.status} por admin $adminId")
        return adminResponse(savedOrder)
    }

    @Transactional(readOnly = true)
    fun getOrderStats(fromDate: Instant, toDate: Instant): OrderStatsResponse {
        val revenue = orderRepository.getTotalRevenue(fromDate, toDate)
        return OrderStatsResponse(
            totalOrders = orderRepository.count(),
            pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING),
            processingOrders = orderRepository.countByStatus(OrderStatus.PROCESSING),
            deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED),
            cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED),
            totalRevenue = revenue,
            totalRevenueFormatted = "$${String.format(Locale.US, "%,d", revenue)}",
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
