package com.geovannycode.product.service

import com.geovannycode.product.dto.CreateProductRequest
import com.geovannycode.product.dto.StockOperation
import com.geovannycode.product.dto.UpdateStockRequest
import com.geovannycode.product.entity.Category
import com.geovannycode.product.entity.Product
import com.geovannycode.product.messaging.ProductEventPublisher
import com.geovannycode.product.repository.CategoryRepository
import com.geovannycode.product.repository.ProductRepository
import com.geovannycode.shared.exception.InsufficientStockException
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import com.geovannycode.shared.exception.ResourceNotFoundException
import io.mockk.Runs
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.just
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.jpa.domain.Specification
import java.util.Optional

@ExtendWith(MockKExtension::class)
class ProductServiceTest {

    @MockK
    private lateinit var productRepository: ProductRepository

    @MockK
    private lateinit var categoryRepository: CategoryRepository

    @MockK
    private lateinit var eventPublisher: ProductEventPublisher

    private lateinit var productService: ProductService

    private lateinit var testProduct: Product
    private lateinit var testCategory: Category

    @BeforeEach
    fun setup() {
        productService = ProductService(
            productRepository = productRepository,
            categoryRepository = categoryRepository,
            eventPublisher = eventPublisher,
            featuredProductsLimit = 8,
            relatedProductsLimit = 4
        )

        testCategory = Category(
            name = "Fermentos",
            slug = "fermentos"
        ).apply {
            setId(1L)
        }

        testProduct = Product(
            name = "Kimchi Vegano",
            slug = "kimchi-vegano",
            price = 28000,
            stock = 50,
            category = testCategory
        ).apply {
            setId(1L)
        }

        every { eventPublisher.publishLowStockEvent(any()) } just Runs
    }

    @Nested
    inner class CreateProductTests {

        @Test
        fun `create should save product successfully`() {
            // Given
            val request = CreateProductRequest(
                name = "Sauerkraut",
                price = 28000,
                stock = 30,
                categoryId = 1L
            )

            every { productRepository.existsBySlug("sauerkraut") } returns false
            every { categoryRepository.findById(1L) } returns Optional.of(testCategory)
            every { productRepository.save(any()) } answers {
                firstArg<Product>().apply { setId(2L) }
            }

            // When
            val result = productService.create(request)

            // Then
            assertThat(result.name).isEqualTo("Sauerkraut")
            assertThat(result.slug).isEqualTo("sauerkraut")
            assertThat(result.price).isEqualTo(28000)
            verify { productRepository.save(any()) }
        }

        @Test
        fun `create should throw exception when slug exists`() {
            // Given
            val request = CreateProductRequest(
                name = "Kimchi Vegano",
                price = 28000
            )

            every { productRepository.existsBySlug("kimchi-vegano") } returns true

            // When/Then
            assertThatThrownBy { productService.create(request) }
                .isInstanceOf(ResourceAlreadyExistsException::class.java)
                .hasMessageContaining("slug")
        }

        @Test
        fun `create should throw exception when category not found`() {
            // Given
            val request = CreateProductRequest(
                name = "Nuevo Producto",
                price = 25000,
                categoryId = 999L
            )

            every { productRepository.existsBySlug(any()) } returns false
            every { categoryRepository.findById(999L) } returns Optional.empty()

            // When/Then
            assertThatThrownBy { productService.create(request) }
                .isInstanceOf(ResourceNotFoundException::class.java)
                .hasMessageContaining("Categoría")
        }
    }

    @Nested
    inner class UpdateStockTests {

        @Test
        fun `updateStock ADD should increase stock`() {
            // Given
            val request = UpdateStockRequest(quantity = 10, operation = StockOperation.ADD)

            every { productRepository.findById(1L) } returns Optional.of(testProduct)
            every { productRepository.save(any()) } answers { firstArg() }

            // When
            val result = productService.updateStock(1L, request)

            // Then
            assertThat(result.stock).isEqualTo(60)
        }

        @Test
        fun `updateStock SUBTRACT should decrease stock`() {
            // Given
            val request = UpdateStockRequest(quantity = 20, operation = StockOperation.SUBTRACT)

            every { productRepository.findById(1L) } returns Optional.of(testProduct)
            every { productRepository.save(any()) } answers { firstArg() }

            // When
            val result = productService.updateStock(1L, request)

            // Then
            assertThat(result.stock).isEqualTo(30)
        }

        @Test
        fun `updateStock SUBTRACT should throw when insufficient stock`() {
            // Given
            val request = UpdateStockRequest(quantity = 100, operation = StockOperation.SUBTRACT)

            every { productRepository.findById(1L) } returns Optional.of(testProduct)

            // When/Then
            assertThatThrownBy { productService.updateStock(1L, request) }
                .isInstanceOf(InsufficientStockException::class.java)
        }

        @Test
        fun `updateStock should publish event when stock becomes low`() {
            // Given
            testProduct.stock = 10
            testProduct.lowStockThreshold = 5
            val request = UpdateStockRequest(quantity = 7, operation = StockOperation.SUBTRACT)

            every { productRepository.findById(1L) } returns Optional.of(testProduct)
            every { productRepository.save(any()) } answers { firstArg() }

            // When
            productService.updateStock(1L, request)

            // Then
            verify { eventPublisher.publishLowStockEvent(testProduct) }
        }
    }

    @Nested
    inner class GetProductsTests {

        @Test
        fun `getProducts should return paginated results`() {
            // Given
            val products = listOf(testProduct)
            // Ojo: ProductService devuelve un PageResponse<ProductListResponse>,
            // pero el repositorio devuelve un Page<Product>
            val page = PageImpl(products, PageRequest.of(0, 20), 1)

            // IMPORTANTE: Usar any() para la Specification
            every {
                productRepository.findAll(any<Specification<Product>>(), any<PageRequest>())
            } returns page

            // When
            val result = productService.getProducts()

            // Then
            assertThat(result.content).hasSize(1)
            assertThat(result.totalElements).isEqualTo(1)
            // El resultado del service es ProductListResponse, verifica los campos mapeados
            assertThat(result.content[0].name).isEqualTo("Kimchi Vegano")

            verify { productRepository.findAll(any<Specification<Product>>(), any<PageRequest>()) }
        }

        @Test
        fun `getProducts should filter by category`() {
            // Given
            val products = listOf(testProduct)
            val page = PageImpl(products, PageRequest.of(0, 20), 1)

            every {
                productRepository.findAll(any<Specification<Product>>(), any<PageRequest>())
            } returns page

            // When
            val result = productService.getProducts(categorySlug = "fermentos")

            // Then
            assertThat(result.content).hasSize(1)
            // Verificamos que se llamó al repo
            verify { productRepository.findAll(any<Specification<Product>>(), any<PageRequest>()) }
        }
    }

    // Helper para setear ID via reflection
    private fun Any.setId(id: Long) {
        val field = this.javaClass.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }
}