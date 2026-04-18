package com.geovannycode.order.service

import com.geovannycode.order.client.PaymentServiceClient
import com.geovannycode.order.client.ProductServiceClient
import com.geovannycode.order.dto.AddressRequest
import com.geovannycode.order.dto.CheckoutRequest
import com.geovannycode.order.entity.Cart
import com.geovannycode.order.entity.Order
import com.geovannycode.order.messaging.OrderEventPublisher
import com.geovannycode.order.repository.OrderRepository
import com.geovannycode.shared.exception.BusinessRuleException
import io.mockk.Runs
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.just
import io.mockk.spyk
import io.mockk.verify
import org.junit.jupiter.api.extension.ExtendWith

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@ExtendWith(MockKExtension::class)
class CheckoutServiceTest {

    @MockK
    private lateinit var cartService: CartService

    @MockK
    private lateinit var orderNumberGenerator: OrderNumberGenerator

    @MockK
    private lateinit var productClient: ProductServiceClient

    @MockK
    private lateinit var paymentClient: PaymentServiceClient

    @MockK
    private lateinit var orderEventPublisher: OrderEventPublisher

    @MockK
    private lateinit var orderRepository: OrderRepository

    private lateinit var checkoutService: CheckoutService

    private lateinit var testCart: Cart
    private lateinit var testProduct: ProductServiceClient.ProductInfo

    @BeforeEach
    fun setup() {
        // Inicializa el servicio manualmente
        checkoutService = CheckoutService(
            cartService = cartService,
            orderNumberGenerator = orderNumberGenerator,
            productClient = productClient,
            paymentClient = paymentClient,
            orderEventPublisher = orderEventPublisher,
            orderRepository = orderRepository,
            taxRate = 0.19,                // <--- Pasa un Double
            defaultShippingCost = 12000L   // <--- Pasa un Long
        )

        testProduct = ProductServiceClient.ProductInfo(
            id = 1L, name = "Kimchi Vegano", slug = "kimchi-vegano",
            price = 28000, stock = 50, isInStock = true,
            sku = "FER-KIM-001", primaryImageUrl = null
        )

        val rawCart = Cart(userId = 1L)
        testCart = spyk(rawCart)
        every { testCart.id } returns 1L
        testCart.addItem(
            productId = 1L,
            productName = "Kimchi Vegano",
            productSlug = "kimchi-vegano",
            productImageUrl = null,
            quantity = 2,
            unitPrice = 28000
        )
    }

    @Test
    fun `validateCart returns valid when all items in stock`() {
        // Given
        every { cartService.getCartForCheckout(1L) } returns testCart
        every { productClient.getProduct(1L) } returns testProduct

        // When
        val result = checkoutService.validateCart(1L)

        // Then
        assertThat(result.valid).isTrue()
        assertThat(result.errors).isEmpty()
        assertThat(result.subtotal).isEqualTo(56000)
    }

    @Test
    fun `validateCart returns invalid when product out of stock`() {
        // Given
        every { cartService.getCartForCheckout(1L) } returns testCart
        every { productClient.getProduct(1L) } returns testProduct.copy(stock = 1)

        // When
        val result = checkoutService.validateCart(1L)

        // Then
        assertThat(result.valid).isFalse()
        assertThat(result.errors).anyMatch { it.contains("Stock insuficiente") }
    }

    @Test
    fun `validateCart detects price changes`() {
        // Given
        every { cartService.getCartForCheckout(1L) } returns testCart
        every { productClient.getProduct(1L) } returns testProduct.copy(price = 30000)

        // When
        val result = checkoutService.validateCart(1L)

        // Then
        assertThat(result.valid).isFalse()
        assertThat(result.errors).anyMatch { it.contains("precio") }
        assertThat(result.items[0].priceChanged).isTrue()
    }

    @Test
    fun `processCheckout creates order successfully`() {
        // Given
        val request = CheckoutRequest(
            shippingAddress = AddressRequest(
                recipientName = "Juan Pérez",
                phone = "3001234567",
                streetAddress = "Calle 80 #50-20",
                city = "Barranquilla"
            ),
            paymentMethod = "PSE"
        )

        every { cartService.getCartForCheckout(1L) } returns testCart
        every { productClient.getProduct(1L) } returns testProduct
        every { orderNumberGenerator.generate() } returns "VM-20240115-0001"
        every { orderRepository.save(any()) } answers {
            val savedOrder = firstArg<Order>()
            val spiedOrder = spyk(savedOrder)
            every { spiedOrder.id } returns 1L
            spiedOrder
        }
        every { cartService.markAsConverted(any()) } just Runs
        every { paymentClient.createPayment(any(), any(), any(), any(), any()) } returns "https://payment.url"
        every { orderEventPublisher.publishOrderCreated(any()) } just Runs

        // When
        val result = checkoutService.processCheckout(1L, "test@example.com", request)

        // Then
        assertThat(result.orderNumber).isEqualTo("VM-20240115-0001")
        assertThat(result.paymentUrl).isEqualTo("https://payment.url")
        verify { cartService.markAsConverted(1L) }
        verify { orderEventPublisher.publishOrderCreated(any()) }
    }

    @Test
    fun `processCheckout throws when cart validation fails`() {
        // Given
        every { cartService.getCartForCheckout(1L) } returns testCart
        every { productClient.getProduct(1L) } returns testProduct.copy(stock = 0)

        val request = CheckoutRequest(
            shippingAddress = AddressRequest(
                recipientName = "Juan", phone = "300", streetAddress = "Calle", city = "Barranquilla"
            ),
            paymentMethod = "PSE"
        )

        // When/Then
        assertThatThrownBy { checkoutService.processCheckout(1L, "test@example.com", request) }
            .isInstanceOf(BusinessRuleException::class.java)
    }
}