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
@Table(name = "recipe_images")
class RecipeImage(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    var recipe: Recipe? = null,

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    var imageUrl: String,

    @Column(name = "alt_text", length = 200)
    var altText: String? = null,

    @Column(name = "caption", length = 300)
    var caption: String? = null,

    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()

) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    fun markAsPrimary() {
        isPrimary = true
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RecipeImage) return false
        if (id == 0L) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}