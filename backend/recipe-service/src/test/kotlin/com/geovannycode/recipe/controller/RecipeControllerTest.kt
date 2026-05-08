package com.geovannycode.recipe.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.geovannycode.recipe.dto.RecipeListResponse
import com.geovannycode.recipe.dto.RecipeResponse
import com.geovannycode.recipe.entity.RecipeDifficulty
import com.geovannycode.recipe.entity.RecipeStatus
import com.geovannycode.recipe.config.SecurityConfig
import com.geovannycode.recipe.security.JwtAuthenticationFilter
import com.geovannycode.recipe.service.RecipeService
import com.geovannycode.shared.dto.PageResponse
import com.geovannycode.shared.exception.ResourceNotFoundException
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.FilterType
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.math.BigDecimal
import java.time.Instant

@WebMvcTest(
    controllers = [RecipeController::class],
    excludeFilters = [
        ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = [JwtAuthenticationFilter::class, SecurityConfig::class])
    ]
)
@AutoConfigureMockMvc(addFilters = false)
class RecipeControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var recipeService: RecipeService

    private val testRecipeList = RecipeListResponse(
        id = 1L,
        title = "Bibimbap Vegano",
        slug = "bibimbap-vegano",
        description = "Delicioso bibimbap",
        primaryImageUrl = "https://example.com/image.jpg",
        totalTime = 50,
        totalTimeFormatted = "50min",
        difficulty = RecipeDifficulty.MEDIUM,
        difficultyLabel = "Media",
        category = null,
        ratingAverage = BigDecimal("4.5"),
        ratingCount = 10,
        featured = true,
        publishedAt = Instant.now()
    )

    @Test
    fun `GET recipes returns paginated list`() {
        // Given
        val pageResponse = PageResponse.of(listOf(testRecipeList), 0, 12, 1)
        every { recipeService.getPublishedRecipes(0, 12) } returns pageResponse

        // When/Then
        mockMvc.get("/api/v1/recipes") {
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.content[0].title") { value("Bibimbap Vegano") }
            jsonPath("$.data.totalElements") { value(1) }
        }
    }

    @Test
    fun `GET recipes featured returns featured recipes`() {
        // Given
        every { recipeService.getFeaturedRecipes() } returns listOf(testRecipeList)

        // When/Then
        mockMvc.get("/api/v1/recipes/featured") {
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data[0].featured") { value(true) }
        }
    }

    @Test
    fun `GET recipe by slug returns recipe details`() {
        // Given
        val recipeResponse = RecipeResponse(
            id = 1L,
            title = "Bibimbap Vegano",
            slug = "bibimbap-vegano",
            description = "Descripción completa",
            introduction = null,
            tips = null,
            prepTime = 30,
            cookTime = 20,
            totalTime = 50,
            totalTimeFormatted = "50min",
            servings = 2,
            servingsUnit = "porciones",
            difficulty = RecipeDifficulty.MEDIUM,
            difficultyLabel = "Media",
            category = null,
            status = RecipeStatus.PUBLISHED,
            featured = true,
            primaryImageUrl = null,
            nutrition = null,
            views = 100,
            ratingCount = 10,
            ratingAverage = BigDecimal("4.5"),
            ratingFormatted = "4.5 (10)",
            authorName = "Chef",
            steps = emptyList(),
            ingredients = emptyList(),
            images = emptyList(),
            tags = emptyList(),
            publishedAt = Instant.now(),
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        every { recipeService.getRecipeBySlug("bibimbap-vegano") } returns recipeResponse

        // When/Then
        mockMvc.get("/api/v1/recipes/bibimbap-vegano") {
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.title") { value("Bibimbap Vegano") }
            jsonPath("$.data.totalTime") { value(50) }
        }
    }

    @Test
    fun `GET recipe by slug returns 404 when not found`() {
        // Given
        every { recipeService.getRecipeBySlug("not-found") } throws
                ResourceNotFoundException("Receta", "slug", "not-found")

        // When/Then
        mockMvc.get("/api/v1/recipes/not-found") {
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.success") { value(false) }
        }
    }

    @Test
    fun `GET recipes search with filters`() {
        // Given
        val pageResponse = PageResponse.of(listOf(testRecipeList), 0, 12, 1)
        every { recipeService.searchRecipes(any()) } returns pageResponse

        // When/Then
        mockMvc.get("/api/v1/recipes/search") {
            param("search", "kimchi")
            param("difficulty", "MEDIUM")
            param("maxTime", "60")
            contentType = MediaType.APPLICATION_JSON
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
        }
    }
}