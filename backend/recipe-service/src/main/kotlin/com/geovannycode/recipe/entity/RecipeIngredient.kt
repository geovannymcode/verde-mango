package com.geovannycode.recipe.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(name = "recipe_ingredients")
class RecipeIngredient(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    var recipe: Recipe? = null,

    @Column(name = "name", nullable = false, length = 200)
    var name: String,

    @Column(name = "quantity", precision = 10, scale = 2)
    var quantity: BigDecimal? = null,

    @Column(name = "unit", length = 50)
    var unit: String? = null,

    @Column(name = "preparation_notes", length = 200)
    var preparationNotes: String? = null,

    @Column(name = "ingredient_group", length = 100)
    var ingredientGroup: String? = null,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,

    @Column(name = "optional", nullable = false)
    var optional: Boolean = false,

    // Vinculación con producto de la tienda
    @Column(name = "product_id")
    var productId: Long? = null,

    @Column(name = "product_name", length = 255)
    var productName: String? = null,

    @Column(name = "product_slug", length = 300)
    var productSlug: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()

) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    /** ¿Está vinculado a un producto? */
    val isLinkedToProduct: Boolean get() = productId != null

    /** Formato legible: "2 tazas de arroz" */
    val formatted: String
        get() = buildString {
            quantity?.let { append("$it ") }
            unit?.let { append("$it de ") }
            append(name)
            preparationNotes?.let { append(", $it") }
            if (optional) append(" (opcional)")
        }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RecipeIngredient) return false
        if (id == 0L) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}