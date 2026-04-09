package com.geovannycode.product.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.geovannycode.product.dto.ProductListResponse
import com.geovannycode.product.dto.ProductResponse
import com.geovannycode.product.security.JwtProperties
import com.geovannycode.product.service.ProductService
import com.geovannycode.shared.dto.PageResponse
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@WebMvcTest(ProductController::class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var productService: ProductService

    @MockkBean
    private lateinit var jwtProperties: JwtProperties

    @Test
    fun `GET products should return paginated list`() {
        // Given
        val products = listOf(
            createProductListResponse(1L, "Kimchi Vegano", 28000)
        )
        val pageResponse = PageResponse.of(products, 0, 20, 1)

        every { productService.getProducts(any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns pageResponse

        // When/Then
        mockMvc.get("/api/v1/products") {
            accept(MediaType.APPLICATION_JSON)
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.content[0].name") { value("Kimchi Vegano") }
            jsonPath("$.data.totalElements") { value(1) }
        }
    }

    @Test
    fun `GET product by slug should return product details`() {
        // Given
        val product = createProductResponse(1L, "Kimchi Vegano", 28000)

        every { productService.getBySlug("kimchi-vegano") } returns product

        // When/Then
        mockMvc.get("/api/v1/products/kimchi-vegano") {
            accept(MediaType.APPLICATION_JSON)
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.name") { value("Kimchi Vegano") }
            jsonPath("$.data.slug") { value("kimchi-vegano") }
        }
    }

    @Test
    fun `GET featured products should return list`() {
        // Given
        val products = listOf(
            createProductListResponse(1L, "Kimchi Vegano", 28000),
            createProductListResponse(2L, "Cashewbert", 31000)
        )

        every { productService.getFeatured() } returns products

        // When/Then
        mockMvc.get("/api/v1/products/featured") {
            accept(MediaType.APPLICATION_JSON)
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.length()") { value(2) }
        }
    }

    // Helpers
    private fun createProductListResponse(id: Long, name: String, price: Long) = ProductListResponse(
        id = id,
        name = name,
        slug = name.lowercase().replace(" ", "-"),
        shortDescription = "Descripción corta",
        price = price,
        priceFormatted = "$${String.format("%,d", price)}",
        compareAtPrice = null,
        compareAtPriceFormatted = null,
        discountPercentage = 0,
        stock = 50,
        isInStock = true,
        isLowStock = false,
        categoryId = 1L,
        categoryName = "Fermentos",
        categorySlug = "fermentos",
        featured = false,
        averageRating = 4.5,
        ratingCount = 10,
        primaryImageUrl = "https://example.com/image.jpg"
    )

    private fun createProductResponse(id: Long, name: String, price: Long) = ProductResponse(
        id = id,
        name = name,
        slug = name.lowercase().replace(" ", "-"),
        shortDescription = "Descripción corta",
        description = "Descripción completa",
        price = price,
        priceFormatted = "$${String.format("%,d", price)}",
        compareAtPrice = null,
        compareAtPriceFormatted = null,
        discountPercentage = 0,
        discountAmount = 0,
        sku = "KIM-001",
        barcode = null,
        stock = 50,
        isInStock = true,
        isLowStock = false,
        trackInventory = true,
        allowBackorder = false,
        category = null,
        weightGrams = null,
        featured = false,
        active = true,
        averageRating = 4.5,
        roundedRating = 4.5,
        ratingCount = 10,
        images = emptyList(),
        primaryImageUrl = "https://example.com/image.jpg",
        metaTitle = null,
        metaDescription = null,
        publishedAt = null,
        createdAt = java.time.Instant.now(),
        updatedAt = java.time.Instant.now()
    )
}