package com.geovannycode.verdemango

import com.geovannycode.verdemango.recipes.domain.Recipe
import com.geovannycode.verdemango.recipes.repository.RecipeRepository
import com.geovannycode.verdemango.recipes.repository.RecipeCategoryRepository
import com.geovannycode.verdemango.recipes.repository.RecipeTagRepository
import com.geovannycode.verdemango.recipes.service.RecipeService
import com.geovannycode.verdemango.recipes.service.SlugGenerator
import com.geovannycode.verdemango.recipes.web.UpdateRecipeRequest
import com.geovannycode.verdemango.recipes.web.RecipeStepRequest
import com.geovannycode.verdemango.recipes.web.RecipeIngredientRequest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.mockito.Mockito.*
import java.util.Optional
import java.math.BigDecimal

class RecipeEditingTests {
    private val repository = mock(RecipeRepository::class.java)
    private val service = RecipeService(repository, mock(RecipeCategoryRepository::class.java), mock(RecipeTagRepository::class.java), mock(SlugGenerator::class.java), 6, 10)
    private fun recipe(): Recipe {
        val recipe = Recipe(title = "Anterior", slug = "slug-manual", description = "Extracto")
        `when`(repository.findByIdWithDetails(7)).thenReturn(Optional.of(recipe))
        `when`(repository.saveAndFlush(recipe)).thenReturn(recipe)
        return recipe
    }
    @Test fun changingTitlePreservesCustomSlugAndNutritionCanBeRemoved() {
        val recipe = recipe()
        recipe.carbsGrams = BigDecimal("20")
        assertTrue(recipe.hasNutritionInfo)
        service.updateRecipe(7, UpdateRecipeRequest(title = "Nuevo título", replaceNutrition = true))
        assertEquals("slug-manual", recipe.slug)
        assertFalse(recipe.hasNutritionInfo)
    }
    @Test fun replacementRespectsOrdinalsAndPreservesLinkedProductMetadata() {
        val recipe = recipe()
        recipe.addStep("Anterior")
        recipe.addIngredient("Quinua", productId = 42).also { it.productName = "Quinua orgánica"; it.productSlug = "quinua" }
        service.updateRecipe(7, UpdateRecipeRequest(
            steps = listOf(RecipeStepRequest(stepNumber = 8, instruction = "Segundo"), RecipeStepRequest(stepNumber = 2, instruction = "Primero")),
            ingredients = listOf(RecipeIngredientRequest(name = "Sal", displayOrder = 8), RecipeIngredientRequest(name = "Quinua", displayOrder = 2, productId = 42, preparationNotes = "lavada"))
        ))
        assertEquals(listOf(1,2), recipe.steps.map { it.stepNumber })
        assertEquals(listOf("Primero","Segundo"), recipe.steps.map { it.instruction })
        assertEquals(listOf("Quinua","Sal"), recipe.ingredients.map { it.name })
        assertEquals(listOf(0,1), recipe.ingredients.map { it.displayOrder })
        assertEquals("lavada", recipe.ingredients[0].preparationNotes)
        assertEquals("quinua", recipe.ingredients[0].productSlug)
        verify(repository, times(2)).flush()
    }
}
