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
@Table(name = "recipe_steps")
class RecipeStep(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    var recipe: Recipe? = null,

    @Column(name = "step_number", nullable = false)
    var stepNumber: Int,

    @Column(name = "instruction", nullable = false, columnDefinition = "TEXT")
    var instruction: String,

    @Column(name = "image_url", columnDefinition = "TEXT")
    var imageUrl: String? = null,

    @Column(name = "tip", columnDefinition = "TEXT")
    var tip: String? = null,

    @Column(name = "estimated_time")
    var estimatedTime: Int? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()

) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    val hasImage: Boolean get() = imageUrl != null

    val hasTip: Boolean get() = tip != null

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RecipeStep) return false
        if (id == 0L) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}