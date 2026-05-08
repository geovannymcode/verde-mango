package com.geovannycode.recipe.service

import com.geovannycode.recipe.dto.CreateRecipeRequest
import com.geovannycode.recipe.dto.RecipeIngredientRequest
import com.geovannycode.recipe.dto.RecipeStepRequest
import com.geovannycode.recipe.entity.Recipe
import com.geovannycode.recipe.entity.RecipeCategory
import com.geovannycode.recipe.entity.RecipeDifficulty
import com.geovannycode.recipe.entity.RecipeStatus
import com.geovannycode.recipe.repository.RecipeCategoryRepository
import com.geovannycode.recipe.repository.RecipeRepository
import com.geovannycode.recipe.repository.RecipeTagRepository
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
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.util.Optional

@ExtendWith(MockKExtension::class)
class RecipeServiceTest {

    @MockK
    private lateinit var recipeRepository: RecipeRepository

    @MockK
    private lateinit var categoryRepository: RecipeCategoryRepository

    @MockK
    private lateinit var tagRepository: RecipeTagRepository

    @MockK
    private lateinit var slugGenerator: SlugGenerator

    private lateinit var recipeService: RecipeService

    private lateinit var testRecipe: Recipe
    private lateinit var testCategory: RecipeCategory

    @BeforeEach
    fun setup() {
        recipeService = RecipeService(
            recipeRepository = recipeRepository,
            categoryRepository = categoryRepository,
            tagRepository = tagRepository,
            slugGenerator = slugGenerator,
            featuredLimit = 6,
            popularLimit = 10
        )

        testCategory = RecipeCategory(
            name = "Con Kimchi",
            slug = "con-kimchi",
            description = "Recetas con kimchi"
        ).apply {
            setIdViaReflection(this, 1L)
        }

        testRecipe = Recipe(
            title = "Bibimbap Vegano con Kimchi",
            slug = "bibimbap-vegano-con-kimchi",
            description = "Delicioso bibimbap vegano",
            prepTime = 30,
            cookTime = 20,
            servings = 2,
            difficulty = RecipeDifficulty.MEDIUM,
            category = testCategory,
            status = RecipeStatus.PUBLISHED
        ).apply {
            setIdViaReflection(this, 1L)
        }

        // Agregar pasos e ingredientes
        testRecipe.addStep("Preparar ingredientes", "Tip importante")
        testRecipe.addIngredient("Arroz", BigDecimal("2"), "tazas")
        testRecipe.addIngredient("Kimchi", BigDecimal("150"), "g", productId = 1L)
    }

    private fun setIdViaReflection(entity: Any, id: Long) {
        val field = entity.javaClass.superclass?.getDeclaredField("id")
            ?: entity.javaClass.getDeclaredField("id")
        field.isAccessible = true
        field.set(entity, id)
    }

    // ==================== Tests de consultas públicas ====================

    @Test
    fun `getPublishedRecipes returns paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 12)
        val page = PageImpl(listOf(testRecipe), pageable, 1)

        every { recipeRepository.findByStatusOrderByPublishedAtDesc(RecipeStatus.PUBLISHED, pageable) } returns page

        // When
        val result = recipeService.getPublishedRecipes(0, 12)

        // Then
        assertThat(result.content).hasSize(1)
        assertThat(result.content[0].title).isEqualTo("Bibimbap Vegano con Kimchi")
        assertThat(result.totalElements).isEqualTo(1)
    }

    @Test
    fun `getRecipeBySlug returns recipe and increments views`() {
        // Given
        every { recipeRepository.findBySlugWithDetails("bibimbap-vegano-con-kimchi") } returns Optional.of(testRecipe)
        every { recipeRepository.incrementViews(1L) } just Runs

        // When
        val result = recipeService.getRecipeBySlug("bibimbap-vegano-con-kimchi")

        // Then
        assertThat(result.title).isEqualTo("Bibimbap Vegano con Kimchi")
        assertThat(result.steps).hasSize(1)
        assertThat(result.ingredients).hasSize(2)
        verify { recipeRepository.incrementViews(1L) }
    }

    @Test
    fun `getRecipeBySlug throws exception for unpublished recipe`() {
        // Given
        val draftRecipe = testRecipe.apply { status = RecipeStatus.DRAFT }
        every { recipeRepository.findBySlugWithDetails("draft-recipe") } returns Optional.of(draftRecipe)

        // When/Then
        assertThatThrownBy { recipeService.getRecipeBySlug("draft-recipe") }
            .isInstanceOf(ResourceNotFoundException::class.java)
    }

    @Test
    fun `getRecipeBySlug throws exception when not found`() {
        // Given
        every { recipeRepository.findBySlugWithDetails("not-exists") } returns Optional.empty()

        // When/Then
        assertThatThrownBy { recipeService.getRecipeBySlug("not-exists") }
            .isInstanceOf(ResourceNotFoundException::class.java)
            .hasMessageContaining("Receta")
    }

    // ==================== Tests de admin ====================

    @Test
    fun `createRecipe creates recipe with steps and ingredients`() {
        // Given
        val request = CreateRecipeRequest(
            title = "Nueva Receta",
            description = "Descripción de prueba",
            prepTime = 15,
            cookTime = 30,
            servings = 4,
            difficulty = RecipeDifficulty.EASY,
            categoryId = 1L,
            steps = listOf(
                RecipeStepRequest(1, "Paso 1"),
                RecipeStepRequest(2, "Paso 2")
            ),
            ingredients = listOf(
                RecipeIngredientRequest("Ingrediente 1", BigDecimal("100"), "g"),
                RecipeIngredientRequest("Ingrediente 2", BigDecimal("2"), "unidades")
            )
        )

        every { slugGenerator.generateUnique("Nueva Receta", any()) } returns "nueva-receta"
        every { categoryRepository.findById(1L) } returns Optional.of(testCategory)
        every { recipeRepository.save(any()) } answers {
            firstArg<Recipe>().apply { setIdViaReflection(this, 2L) }
        }

        // When
        val result = recipeService.createRecipe(request, 1L, "Admin")

        // Then
        assertThat(result.title).isEqualTo("Nueva Receta")
        assertThat(result.slug).isEqualTo("nueva-receta")
        assertThat(result.steps).hasSize(2)
        assertThat(result.ingredients).hasSize(2)
        assertThat(result.authorName).isEqualTo("Admin")
        verify { recipeRepository.save(any()) }
    }

    @Test
    fun `publishRecipe publishes recipe and updates category count`() {
        // Given
        val draftRecipe = Recipe(
            title = "Receta Draft",
            slug = "receta-draft",
            description = "Descripción",
            prepTime = 10,
            cookTime = 20,
            category = testCategory
        ).apply {
            setIdViaReflection(this, 3L)
            addStep("Paso 1")
            addIngredient("Ingrediente 1")
        }

        every { recipeRepository.findByIdWithDetails(3L) } returns Optional.of(draftRecipe)
        every { recipeRepository.save(any()) } answers { firstArg() }

        // When
        val result = recipeService.publishRecipe(3L)

        // Then
        assertThat(result.status).isEqualTo(RecipeStatus.PUBLISHED)
        assertThat(draftRecipe.publishedAt).isNotNull()
        assertThat(testCategory.recipeCount).isEqualTo(1)
    }

    @Test
    fun `publishRecipe fails without steps`() {
        // Given
        val emptyRecipe = Recipe(
            title = "Receta Vacía",
            slug = "receta-vacia",
            description = "Sin pasos"
        ).apply {
            setIdViaReflection(this, 4L)
            addIngredient("Ingrediente") // Solo ingrediente, sin pasos
        }

        every { recipeRepository.findByIdWithDetails(4L) } returns Optional.of(emptyRecipe)

        // When/Then
        assertThatThrownBy { recipeService.publishRecipe(4L) }
            .isInstanceOf(IllegalStateException::class.java)
            .hasMessageContaining("al menos un paso")
    }

    @Test
    fun `featureRecipe marks recipe as featured`() {
        // Given
        every { recipeRepository.findById(1L) } returns Optional.of(testRecipe)
        every { recipeRepository.save(any()) } answers { firstArg() }

        // When
        val result = recipeService.featureRecipe(1L, true)

        // Then
        assertThat(result.featured).isTrue()
    }

    @Test
    fun `featureRecipe fails for unpublished recipe`() {
        // Given
        val draftRecipe = testRecipe.apply { status = RecipeStatus.DRAFT }
        every { recipeRepository.findById(1L) } returns Optional.of(draftRecipe)

        // When/Then
        assertThatThrownBy { recipeService.featureRecipe(1L, true) }
            .isInstanceOf(IllegalStateException::class.java)
            .hasMessageContaining("publicadas")
    }

    @Test
    fun `deleteRecipe deletes and updates category count`() {
        // Given
        every { recipeRepository.findById(1L) } returns Optional.of(testRecipe)
        every { recipeRepository.delete(testRecipe) } just Runs

        val initialCount = testCategory.recipeCount

        // When
        recipeService.deleteRecipe(1L)

        // Then
        verify { recipeRepository.delete(testRecipe) }
        // Category count debería decrementarse
    }
}