package com.geovannycode.recipe.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table

@Entity
@Table(name = "recipe_categories")
class RecipeCategory(

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "slug", nullable = false, unique = true, length = 120)
    var slug: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "image_url", columnDefinition = "TEXT")
    var imageUrl: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: RecipeCategory? = null,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "recipe_count", nullable = false)
    var recipeCount: Int = 0,

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    val children: MutableList<RecipeCategory> = mutableListOf(),

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    val recipes: MutableList<Recipe> = mutableListOf()

) : BaseEntity() {

    val isRootCategory: Boolean get() = parent == null

    val hasChildren: Boolean get() = children.isNotEmpty()

    val fullPath: String
        get() = if (parent != null) "${parent!!.name} > $name" else name

    fun activate() {
        active = true
    }

    fun deactivate() {
        active = false
    }

    fun incrementRecipeCount() {
        recipeCount++
    }

    fun decrementRecipeCount() {
        if (recipeCount > 0) recipeCount--
    }
}