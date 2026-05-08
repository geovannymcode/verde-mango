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
import java.time.Instant

@Entity
@Table(name = "recipe_ratings")
class RecipeRating(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    var recipe: Recipe? = null,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(name = "user_name", length = 100)
    var userName: String? = null,

    @Column(name = "rating", nullable = false)
    var rating: Int,

    @Column(name = "comment", columnDefinition = "TEXT")
    var comment: String? = null,

    @Column(name = "made_recipe")
    var madeRecipe: Boolean = false,

    @Column(name = "approved", nullable = false)
    var approved: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()

) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    init {
        require(rating in 1..5) { "El rating debe estar entre 1 y 5" }
    }

    fun approve() {
        approved = true
        updatedAt = Instant.now()
    }

    fun reject() {
        approved = false
        updatedAt = Instant.now()
    }

    fun update(newRating: Int, newComment: String?, newMadeRecipe: Boolean) {
        require(newRating in 1..5) { "El rating debe estar entre 1 y 5" }
        rating = newRating
        comment = newComment
        madeRecipe = newMadeRecipe
        updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RecipeRating) return false
        if (id == 0L) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}