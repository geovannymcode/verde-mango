package com.geovannycode.recipe.entity

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(name = "recipes")
class Recipe(

    // ==================== Información básica ====================

    @Column(name = "title", nullable = false, length = 200)
    var title: String,

    @Column(name = "slug", nullable = false, unique = true, length = 250)
    var slug: String,

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    var description: String,

    @Column(name = "introduction", columnDefinition = "TEXT")
    var introduction: String? = null,

    @Column(name = "tips", columnDefinition = "TEXT")
    var tips: String? = null,

    // ==================== Tiempos ====================

    @Column(name = "prep_time", nullable = false)
    var prepTime: Int = 0,

    @Column(name = "cook_time", nullable = false)
    var cookTime: Int = 0,

    // ==================== Porciones ====================

    @Column(name = "servings", nullable = false)
    var servings: Int = 4,

    @Column(name = "servings_unit", length = 50)
    var servingsUnit: String = "porciones",

    // ==================== Clasificación ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 20)
    var difficulty: RecipeDifficulty = RecipeDifficulty.MEDIUM,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    var category: RecipeCategory? = null,

    // ==================== Estado ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: RecipeStatus = RecipeStatus.DRAFT,

    @Column(name = "featured", nullable = false)
    var featured: Boolean = false,

    // ==================== Imagen ====================

    @Column(name = "primary_image_url", columnDefinition = "TEXT")
    var primaryImageUrl: String? = null,

    // ==================== SEO ====================

    @Column(name = "meta_title", length = 70)
    var metaTitle: String? = null,

    @Column(name = "meta_description", length = 160)
    var metaDescription: String? = null,

    // ==================== Nutrición ====================

    @Column(name = "calories")
    var calories: Int? = null,

    @Column(name = "protein_grams", precision = 5, scale = 1)
    var proteinGrams: BigDecimal? = null,

    @Column(name = "carbs_grams", precision = 5, scale = 1)
    var carbsGrams: BigDecimal? = null,

    @Column(name = "fat_grams", precision = 5, scale = 1)
    var fatGrams: BigDecimal? = null,

    @Column(name = "fiber_grams", precision = 5, scale = 1)
    var fiberGrams: BigDecimal? = null,

    // ==================== Estadísticas ====================

    @Column(name = "views", nullable = false)
    var views: Long = 0,

    @Column(name = "rating_count", nullable = false)
    var ratingCount: Int = 0,

    @Column(name = "rating_average", nullable = false, precision = 2, scale = 1)
    var ratingAverage: BigDecimal = BigDecimal.ZERO,

    // ==================== Autor ====================

    @Column(name = "author_id")
    var authorId: Long? = null,

    @Column(name = "author_name", length = 100)
    var authorName: String? = null,

    // ==================== Fechas ====================

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    // ==================== Relaciones ====================

    @OneToMany(mappedBy = "recipe", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("stepNumber ASC")
    val steps: MutableList<RecipeStep> = mutableListOf(),

    @OneToMany(mappedBy = "recipe", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    val ingredients: MutableList<RecipeIngredient> = mutableListOf(),

    @OneToMany(mappedBy = "recipe", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    val images: MutableList<RecipeImage> = mutableListOf(),

    @OneToMany(mappedBy = "recipe", cascade = [CascadeType.ALL], orphanRemoval = true)
    val ratings: MutableList<RecipeRating> = mutableListOf(),

    @ManyToMany
    @JoinTable(
        name = "recipe_tag_assignments",
        joinColumns = [JoinColumn(name = "recipe_id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id")]
    )
    val tags: MutableSet<RecipeTag> = mutableSetOf()

) : BaseEntity() {

    // ==================== Propiedades computadas ====================

    /** Tiempo total (prep + cook) */
    val totalTime: Int get() = prepTime + cookTime

    /** ¿Está publicada? */
    val isPublished: Boolean get() = status == RecipeStatus.PUBLISHED

    /** ¿Es borrador? */
    val isDraft: Boolean get() = status == RecipeStatus.DRAFT

    /** Tiempo total formateado */
    val totalTimeFormatted: String
        get() = when {
            totalTime >= 60 -> "${totalTime / 60}h ${totalTime % 60}min"
            else -> "${totalTime}min"
        }

    /** Dificultad en español */
    val difficultyLabel: String
        get() = when (difficulty) {
            RecipeDifficulty.EASY -> "Fácil"
            RecipeDifficulty.MEDIUM -> "Media"
            RecipeDifficulty.HARD -> "Difícil"
        }

    /** Rating formateado */
    val ratingFormatted: String
        get() = if (ratingCount > 0) "$ratingAverage ($ratingCount)" else "Sin calificaciones"

    /** ¿Tiene información nutricional? */
    val hasNutritionInfo: Boolean
        get() = calories != null || proteinGrams != null

    // ==================== Métodos de negocio ====================

    /** Publica la receta */
    fun publish() {
        check(steps.isNotEmpty()) { "La receta debe tener al menos un paso" }
        check(ingredients.isNotEmpty()) { "La receta debe tener al menos un ingrediente" }

        status = RecipeStatus.PUBLISHED
        publishedAt = Instant.now()
    }

    /** Despublica (vuelve a borrador) */
    fun unpublish() {
        status = RecipeStatus.DRAFT
    }

    /** Archiva la receta */
    fun archive() {
        status = RecipeStatus.ARCHIVED
    }

    /** Marca como destacada */
    fun feature() {
        check(isPublished) { "Solo se pueden destacar recetas publicadas" }
        featured = true
    }

    /** Quita de destacadas */
    fun unfeature() {
        featured = false
    }

    /** Incrementa las vistas */
    fun incrementViews() {
        views++
    }

    /** Agrega un paso */
    fun addStep(instruction: String, tip: String? = null, imageUrl: String? = null): RecipeStep {
        val stepNumber = steps.size + 1
        val step = RecipeStep(
            recipe = this,
            stepNumber = stepNumber,
            instruction = instruction,
            tip = tip,
            imageUrl = imageUrl
        )
        steps.add(step)
        return step
    }

    /** Agrega un ingrediente */
    fun addIngredient(
        name: String,
        quantity: BigDecimal? = null,
        unit: String? = null,
        group: String? = null,
        optional: Boolean = false,
        productId: Long? = null,
        productName: String? = null,
        productSlug: String? = null
    ): RecipeIngredient {
        val order = ingredients.size
        val ingredient = RecipeIngredient(
            recipe = this,
            name = name,
            quantity = quantity,
            unit = unit,
            ingredientGroup = group,
            displayOrder = order,
            optional = optional,
            productId = productId,
            productName = productName,
            productSlug = productSlug
        )
        ingredients.add(ingredient)
        return ingredient
    }

    /** Agrega una imagen */
    fun addImage(url: String, altText: String? = null, isPrimary: Boolean = false): RecipeImage {
        if (isPrimary) {
            images.forEach { it.isPrimary = false }
            primaryImageUrl = url
        }
        val order = images.size
        val image = RecipeImage(
            recipe = this,
            imageUrl = url,
            altText = altText,
            isPrimary = isPrimary,
            displayOrder = order
        )
        images.add(image)
        return image
    }

    /** Agrega un tag */
    fun addTag(tag: RecipeTag) {
        tags.add(tag)
    }

    /** Elimina un tag */
    fun removeTag(tag: RecipeTag) {
        tags.remove(tag)
    }

    /** Limpia y reordena los pasos */
    fun reorderSteps() {
        steps.sortedBy { it.stepNumber }.forEachIndexed { index, step ->
            step.stepNumber = index + 1
        }
    }
}