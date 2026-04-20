package com.geovannycode.order.service

import com.geovannycode.order.dto.CancelOrderRequest
import com.geovannycode.order.dto.UpdateOrderStatusRequest
import com.geovannycode.order.entity.Address
import com.geovannycode.order.entity.Order
import com.geovannycode.order.messaging.OrderEventPublisher
import com.geovannycode.order.repository.OrderRepository
import com.geovannycode.shared.constant.OrderStatus
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceNotFoundException
import io.mockk.Runs
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.just
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Optional

@ExtendWith(MockKExtension::class)
class OrderServiceTest {

    @MockK
    private lateinit var orderRepository: OrderRepository

    @MockK
    private lateinit var orderEventPublisher: OrderEventPublisher

    private lateinit var orderService: OrderService

    private lateinit var testOrder: Order

    @BeforeEach
    fun setup() {

        // 1. Inicialización manual del servicio
        orderService = OrderService(
            orderRepository = orderRepository,
            orderEventPublisher = orderEventPublisher,
            cancellationWindowHours = 2L // Valor de prueba para el @Value
        )

        // 2. Creación de la orden usando spyk para evitar reflexión en campos 'val'
        val rawOrder = Order(
            orderNumber = "VM-20240115-0001",
            userId = 1L,
            userEmail = "test@example.com",
            subtotal = 56000,
            shippingCost = 12000,
            taxAmount = 10640,
            totalAmount = 78640,
            shippingAddress = Address(
                recipientName = "Juan Pérez",
                phone = "3001234567",
                streetAddress = "Calle 80 #50-20",
                city = "Barranquilla",
                country = "Colombia"
            )
        )
        rawOrder.createdAt = Instant.now()

        testOrder = spyk(rawOrder)
        every { testOrder.id } returns 1L
    }

    @Test
    fun `getUserOrder returns order for owner`() {
        // Given
        every { orderRepository.findByOrderNumberAndUserId("VM-20240115-0001", 1L) } returns Optional.of(testOrder)

        // When
        val result = orderService.getUserOrder(1L, "VM-20240115-0001")

        // Then
        assertThat(result.orderNumber).isEqualTo("VM-20240115-0001")
        assertThat(result.totalAmount).isEqualTo(78640)
    }

    @Test
    fun `getUserOrder throws exception when order not found`() {
        // Given
        every { orderRepository.findByOrderNumberAndUserId(any(), any()) } returns Optional.empty()

        // When/Then
        assertThatThrownBy { orderService.getUserOrder(1L, "NOT-EXISTS") }
            .isInstanceOf(ResourceNotFoundException::class.java)
    }

    @Test
    fun `cancelOrder cancels pending order within time window`() {
        // Given
        val request = CancelOrderRequest("Ya no necesito los productos")

        every { orderRepository.findByOrderNumberAndUserId("VM-20240115-0001", 1L) } returns Optional.of(testOrder)
        every { orderRepository.save(any()) } answers { firstArg() }
        every { orderEventPublisher.publishOrderCancelled(any(), any()) } just Runs

        // When
        val result = orderService.cancelOrder(1L, "VM-20240115-0001", request)

        // Then
        assertThat(result.status).isEqualTo(OrderStatus.CANCELLED)
        assertThat(result.cancellationReason).isEqualTo("Ya no necesito los productos")
        verify { orderEventPublisher.publishOrderCancelled(any(), "Ya no necesito los productos") }
    }

    @Test
    fun `cancelOrder throws exception after time window`() {
        val mockedOrder = mockk<Order>()

        every { mockedOrder.orderNumber } returns "VM-20240115-0001"
        every { mockedOrder.status } returns OrderStatus.PENDING
        every { mockedOrder.userId } returns 1L
        // Forzamos que la orden sea vieja (3 horas atrás)
        every { mockedOrder.createdAt } returns Instant.now().minus(3, ChronoUnit.HOURS)
        every { mockedOrder.canBeCancelled } returns false

        every { orderRepository.findByOrderNumberAndUserId("VM-20240115-0001", 1L) } returns Optional.of(mockedOrder)

        val request = CancelOrderRequest("Muy tarde")

        assertThatThrownBy { orderService.cancelOrder(1L, "VM-20240115-0001", request) }
            .isInstanceOf(BusinessRuleException::class.java)
            .hasMessageContaining("tiempo límite")
    }

    @Test
    fun `cancelOrder throws exception when order already shipped`() {
        val mockedOrder = mockk<Order>()

        // Configuramos TODAS las propiedades que el servicio va a leer
        every { mockedOrder.orderNumber } returns "VM-20240115-0001"
        every { mockedOrder.status } returns OrderStatus.SHIPPED
        every { mockedOrder.userId } returns 1L
        every { mockedOrder.createdAt } returns Instant.now()
        every { mockedOrder.canBeCancelled } returns false

        every { orderRepository.findByOrderNumberAndUserId("VM-20240115-0001", 1L) } returns Optional.of(mockedOrder)

        val request = CancelOrderRequest("Ya no quiero")

        assertThatThrownBy { orderService.cancelOrder(1L, "VM-20240115-0001", request) }
            .isInstanceOf(BusinessRuleException::class.java)
            .hasMessageContaining("no puede ser cancelada")
    }

    @Test
    fun `updateOrderStatus changes status correctly`() {
        // Given
        testOrder.confirmPayment(100L, "PSE", "REF-123")
        val request = UpdateOrderStatusRequest(
            status = OrderStatus.PROCESSING,
            comment = "Comenzando preparación"
        )

        every { orderRepository.findById(1L) } returns Optional.of(testOrder)
        every { orderRepository.save(any()) } answers { firstArg() }
        every { orderEventPublisher.publishOrderStatusChanged(any()) } just Runs

        // When
        val result = orderService.updateOrderStatus(1L, request, 10L)

        // Then
        assertThat(result.status).isEqualTo(OrderStatus.PROCESSING)
        verify { orderEventPublisher.publishOrderStatusChanged(any()) }
    }

    @Test
    fun `confirmPayment updates order with payment info`() {
        // Given
        every { orderRepository.findById(1L) } returns Optional.of(testOrder)
        every { orderRepository.save(any()) } answers { firstArg() }
        every { orderEventPublisher.publishOrderPaid(any()) } just Runs

        // When
        orderService.confirmPayment(1L, 100L, "PSE", "REF-123")

        // Then
        assertThat(testOrder.status).isEqualTo(OrderStatus.CONFIRMED)
        assertThat(testOrder.paymentId).isEqualTo(100L)
        assertThat(testOrder.paymentMethod).isEqualTo("PSE")
        assertThat(testOrder.paidAt).isNotNull()
        verify { orderEventPublisher.publishOrderPaid(any()) }
    }
}