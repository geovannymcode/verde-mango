package com.geovannycode.recipe.service

import com.geovannycode.recipe.dto.CreateRatingRequest
import com.geovannycode.recipe.entity.Recipe
import com.geovannycode.recipe.entity.RecipeRating
import com.geovannycode.recipe.repository.RecipeRatingRepository
import com.geovannycode.recipe.repository.RecipeRepository
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.util.Optional

@ExtendWith(MockKExtension::class)
class RatingServiceTest {

    @MockK
    private lateinit var ratingRepository: RecipeRatingRepository

    @MockK
    private lateinit var recipeRepository: RecipeRepository

    @InjectMockKs
    private lateinit var ratingService: RatingService

    private lateinit var testRecipe: Recipe

    @BeforeEach
    fun setup() {
        testRecipe = Recipe(
            title = "Test Recipe",
            slug = "test-recipe",
            description = "Description"
        ).apply {
            val field = Recipe::class.java.superclass.getDeclaredField("id")
            field.isAccessible = true
            field.set(this, 1L)
        }
    }

    @Test
    fun `createRating creates new rating`() {
        // Given
        val request = CreateRatingRequest(
            rating = 5,
            comment = "Excelente receta!",
            madeRecipe = true
        )

        every { recipeRepository.findBySlug("test-recipe") } returns Optional.of(testRecipe)
        every { ratingRepository.existsByRecipeIdAndUserId(1L, 100L) } returns false
        every { ratingRepository.save(any()) } answers {
            firstArg<RecipeRating>().apply {
                val field = RecipeRating::class.java.getDeclaredField("id")
                field.isAccessible = true
                field.set(this, 1L)
            }
        }

        // When
        val result = ratingService.createRating("test-recipe", 100L, "Usuario", request)

        // Then
        assertThat(result.rating).isEqualTo(5)
        assertThat(result.comment).isEqualTo("Excelente receta!")
        assertThat(result.madeRecipe).isTrue()
        verify { ratingRepository.save(any()) }
    }

    @Test
    fun `createRating throws exception for duplicate rating`() {
        // Given
        val request = CreateRatingRequest(rating = 4)

        every { recipeRepository.findBySlug("test-recipe") } returns Optional.of(testRecipe)
        every { ratingRepository.existsByRecipeIdAndUserId(1L, 100L) } returns true

        // When/Then
        assertThatThrownBy { ratingService.createRating("test-recipe", 100L, null, request) }
            .isInstanceOf(ResourceAlreadyExistsException::class.java)
    }

    @Test
    fun `getRatingStats returns correct statistics`() {
        // Given
        every { recipeRepository.findBySlug("test-recipe") } returns Optional.of(testRecipe)
        every { ratingRepository.getAverageRating(1L) } returns 4.5
        every { ratingRepository.countApprovedRatings(1L) } returns 10
        every { ratingRepository.getRatingDistribution(1L) } returns listOf(
            arrayOf(5, 6L),
            arrayOf(4, 3L),
            arrayOf(3, 1L)
        )

        // When
        val result = ratingService.getRatingStats("test-recipe")

        // Then
        assertThat(result.averageRating).isEqualTo(4.5)
        assertThat(result.totalRatings).isEqualTo(10)
        assertThat(result.distribution[5]).isEqualTo(6)
        assertThat(result.distribution[4]).isEqualTo(3)
        assertThat(result.distribution[3]).isEqualTo(1)
    }
}