package com.geovannycode.recipe.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToMany
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "recipe_tags")
class RecipeTag(

    @Column(name = "name", nullable = false, length = 50)
    var name: String,

    @Column(name = "slug", nullable = false, unique = true, length = 60)
    var slug: String,

    @Column(name = "recipe_count", nullable = false)
    var recipeCount: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @ManyToMany(mappedBy = "tags")
    val recipes: MutableSet<Recipe> = mutableSetOf()

) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RecipeTag) return false
        if (id == 0L) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}