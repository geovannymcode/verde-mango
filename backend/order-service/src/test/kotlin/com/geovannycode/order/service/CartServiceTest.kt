package com.geovannycode.order.service

import com.geovannycode.order.client.ProductServiceClient
import com.geovannycode.order.dto.AddToCartRequest
import com.geovannycode.order.dto.UpdateCartItemRequest
import com.geovannycode.order.entity.Cart
import com.geovannycode.order.entity.CartStatus
import com.geovannycode.order.repository.CartRepository
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceNotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.spyk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.util.Optional

@ExtendWith(MockKExtension::class)
class CartServiceTest {

    @MockK
    private lateinit var cartRepository: CartRepository

    @MockK
    private lateinit var productClient: ProductServiceClient

    private lateinit var cartService: CartService

    private lateinit var testProduct: ProductServiceClient.ProductInfo
    private lateinit var testCart: Cart

    @BeforeEach
    fun setup() {
        // Inicializa el servicio pasándole los mocks y un valor de prueba (ej: 24 horas)
        cartService = CartService(
            cartRepository = cartRepository,
            productClient = productClient,
            cartExpirationHours = 24L
        )

        testProduct = ProductServiceClient.ProductInfo(
            id = 1L,
            name = "Kimchi Vegano",
            slug = "kimchi-vegano",
            price = 28000,
            stock = 50,
            isInStock = true,
            sku = "FER-KIM-001",
            primaryImageUrl = "https://example.com/kimchi.jpg"
        )

        val rawCart = Cart(userId = 1L)

        testCart = spyk(rawCart)
        every { testCart.id } returns 1L
    }

    @Test
    fun `getCart returns empty cart when none exists`() {
        // Given
        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.empty()

        // When
        val result = cartService.getCart(1L, null)

        // Then
        assertThat(result.items).isEmpty()
        assertThat(result.itemCount).isEqualTo(0)
    }

    @Test
    fun `addItem creates cart and adds product`() {
        // Given
        val request = AddToCartRequest(productId = 1L, quantity = 2)

        every { productClient.getProduct(1L) } returns testProduct
        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.empty()
        every { cartRepository.save(any()) } answers {
            val savedCart = firstArg<Cart>()
            val spiedCart = spyk(savedCart)
            every { spiedCart.id } returns 1L
            spiedCart
        }

        // When
        val result = cartService.addItem(1L, null, request)

        // Then
        assertThat(result.items).hasSize(1)
        assertThat(result.items[0].productId).isEqualTo(1L)
        assertThat(result.items[0].quantity).isEqualTo(2)
        assertThat(result.subtotal).isEqualTo(56000) // 28000 * 2
        verify { cartRepository.save(any()) }
    }

    @Test
    fun `addItem throws exception when product not found`() {
        // Given
        val request = AddToCartRequest(productId = 999L, quantity = 1)

        every { productClient.getProduct(999L) } returns null

        // When/Then
        assertThatThrownBy { cartService.addItem(1L, null, request) }
            .isInstanceOf(ResourceNotFoundException::class.java)
            .hasMessageContaining("Producto")
    }

    @Test
    fun `addItem throws exception when insufficient stock`() {
        // Given
        val request = AddToCartRequest(productId = 1L, quantity = 100)

        every { productClient.getProduct(1L) } returns testProduct.copy(stock = 10)

        // When/Then
        assertThatThrownBy { cartService.addItem(1L, null, request) }
            .isInstanceOf(BusinessRuleException::class.java)
            .hasMessageContaining("Stock insuficiente")
    }

    @Test
    fun `updateItemQuantity updates existing item`() {
        // Given
        testCart.addItem(1L, "Kimchi", "kimchi", null, 2, 28000)
        val request = UpdateCartItemRequest(quantity = 5)

        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.of(testCart)
        every { productClient.getProduct(1L) } returns testProduct
        every { cartRepository.save(any()) } answers { firstArg() }

        // When
        val result = cartService.updateItemQuantity(1L, null, 1L, request)

        // Then
        assertThat(result.items[0].quantity).isEqualTo(5)
        assertThat(result.subtotal).isEqualTo(140000) // 28000 * 5
    }

    @Test
    fun `updateItemQuantity with zero removes item`() {
        // Given
        testCart.addItem(1L, "Kimchi", "kimchi", null, 2, 28000)
        val request = UpdateCartItemRequest(quantity = 0)

        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.of(testCart)
        every { cartRepository.save(any()) } answers { firstArg() }

        // When
        val result = cartService.updateItemQuantity(1L, null, 1L, request)

        // Then
        assertThat(result.items).isEmpty()
    }

    @Test
    fun `removeItem removes product from cart`() {
        // Given
        testCart.addItem(1L, "Kimchi", "kimchi", null, 2, 28000)

        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.of(testCart)
        every { cartRepository.save(any()) } answers { firstArg() }

        // When
        val result = cartService.removeItem(1L, null, 1L)

        // Then
        assertThat(result.items).isEmpty()
    }

    @Test
    fun `clearCart empties the cart`() {
        // Given
        testCart.addItem(1L, "Kimchi", "kimchi", null, 2, 28000)
        testCart.addItem(2L, "Rotkohl", "rotkohl", null, 1, 28000)

        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.of(testCart)
        every { cartRepository.save(any()) } answers { firstArg() }

        // When
        val result = cartService.clearCart(1L, null)

        // Then
        assertThat(result.items).isEmpty()
        assertThat(result.subtotal).isEqualTo(0)
    }

    @Test
    fun `mergeGuestCart combines items from both carts`() {
        // Given
        val userCart = spyk(Cart(userId = 1L))
        every { userCart.id } returns 1L
        userCart.addItem(1L, "Kimchi", "kimchi", null, 1, 28000)

        val guestCart = spyk(Cart(sessionId = "guest-session"))
        every { guestCart.id } returns 2L
        guestCart.addItem(1L, "Kimchi", "kimchi", null, 2, 28000)
        guestCart.addItem(2L, "Rotkohl", "rotkohl", null, 1, 28000)

        every { cartRepository.findBySessionIdAndStatusWithItemsFetch("guest-session", CartStatus.ACTIVE) } returns Optional.of(guestCart)
        every { cartRepository.findByUserIdAndStatusWithItemsFetch(1L, CartStatus.ACTIVE) } returns Optional.of(userCart)
        every { cartRepository.save(any()) } answers { firstArg() }

        // When
        val result = cartService.mergeGuestCart(1L, "guest-session")

        // Then
        assertThat(result.items).hasSize(2)
        assertThat(result.items.find { it.productId == 1L }?.quantity).isEqualTo(3) // 1 + 2
        assertThat(result.items.find { it.productId == 2L }?.quantity).isEqualTo(1)
        assertThat(guestCart.status).isEqualTo(CartStatus.MERGED)
    }
}