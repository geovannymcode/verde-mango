package com.geovannycode.recipe.service

import com.geovannycode.recipe.dto.CreateCategoryRequest
import com.geovannycode.recipe.entity.RecipeCategory
import com.geovannycode.recipe.repository.RecipeCategoryRepository
import com.geovannycode.shared.exception.ResourceNotFoundException
import io.mockk.Runs
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.just
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.util.Optional

@ExtendWith(MockKExtension::class)
class CategoryServiceTest {

    @MockK
    private lateinit var categoryRepository: RecipeCategoryRepository

    @MockK
    private lateinit var slugGenerator: SlugGenerator

    @InjectMockKs
    private lateinit var categoryService: CategoryService

    private lateinit var testCategory: RecipeCategory

    @BeforeEach
    fun setup() {
        testCategory = RecipeCategory(
            name = "Desayunos",
            slug = "desayunos",
            description = "Recetas para el desayuno"
        ).apply {
            val field = RecipeCategory::class.java.superclass.getDeclaredField("id")
            field.isAccessible = true
            field.set(this, 1L)
        }
    }

    @Test
    fun `getAllCategories returns root categories with children`() {
        // Given
        every { categoryRepository.findRootCategoriesWithChildren() } returns listOf(testCategory)

        // When
        val result = categoryService.getAllCategories()

        // Then
        assertThat(result).hasSize(1)
        assertThat(result[0].name).isEqualTo("Desayunos")
    }

    @Test
    fun `getCategoryBySlug returns category when found`() {
        // Given
        every { categoryRepository.findBySlugAndActiveTrue("desayunos") } returns Optional.of(testCategory)

        // When
        val result = categoryService.getCategoryBySlug("desayunos")

        // Then
        assertThat(result.name).isEqualTo("Desayunos")
        assertThat(result.slug).isEqualTo("desayunos")
    }

    @Test
    fun `getCategoryBySlug throws exception when not found`() {
        // Given
        every { categoryRepository.findBySlugAndActiveTrue("not-found") } returns Optional.empty()

        // When/Then
        assertThatThrownBy { categoryService.getCategoryBySlug("not-found") }
            .isInstanceOf(ResourceNotFoundException::class.java)
    }

    @Test
    fun `createCategory creates new category`() {
        // Given
        val request = CreateCategoryRequest(
            name = "Almuerzos",
            description = "Recetas para el almuerzo"
        )

        every { slugGenerator.generateUnique("Almuerzos", any()) } returns "almuerzos"
        every { categoryRepository.save(any()) } answers {
            firstArg<RecipeCategory>().apply {
                val field = RecipeCategory::class.java.superclass.getDeclaredField("id")
                field.isAccessible = true
                field.set(this, 2L)
            }
        }

        // When
        val result = categoryService.createCategory(request)

        // Then
        assertThat(result.name).isEqualTo("Almuerzos")
        assertThat(result.slug).isEqualTo("almuerzos")
        verify { categoryRepository.save(any()) }
    }

    @Test
    fun `createCategory with parent sets parent relationship`() {
        // Given
        val request = CreateCategoryRequest(
            name = "Subcategoría",
            parentId = 1L
        )

        every { categoryRepository.findById(1L) } returns Optional.of(testCategory)
        every { slugGenerator.generateUnique("Subcategoría", any()) } returns "subcategoria"
        every { categoryRepository.save(any()) } answers { firstArg() }

        // When
        val result = categoryService.createCategory(request)

        // Then
        assertThat(result.parentId).isEqualTo(1L)
        assertThat(result.parentName).isEqualTo("Desayunos")
    }

    @Test
    fun `deleteCategory fails when has recipes`() {
        // Given
        testCategory.recipeCount = 5
        every { categoryRepository.findById(1L) } returns Optional.of(testCategory)

        // When/Then
        assertThatThrownBy { categoryService.deleteCategory(1L) }
            .isInstanceOf(IllegalStateException::class.java)
            .hasMessageContaining("con recetas")
    }

    @Test
    fun `deleteCategory succeeds when empty`() {
        // Given
        testCategory.recipeCount = 0
        every { categoryRepository.findById(1L) } returns Optional.of(testCategory)
        every { categoryRepository.delete(testCategory) } just Runs

        // When
        categoryService.deleteCategory(1L)

        // Then
        verify { categoryRepository.delete(testCategory) }
    }
}