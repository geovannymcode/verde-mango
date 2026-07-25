package com.geovannycode.verdemango.catalog.domain

import com.geovannycode.verdemango.common.domain.BaseEntity
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table

@Entity
@Table(
    name = "categories",
    indexes = [
        Index(name = "idx_categories_slug", columnList = "slug", unique = true),
        Index(name = "idx_categories_parent_id", columnList = "parent_id"),
        Index(name = "idx_categories_active", columnList = "active")
    ]
)
class Category(

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
    var parent: Category? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "meta_title", length = 70)
    var metaTitle: String? = null,

    @Column(name = "meta_description", length = 160)
    var metaDescription: String? = null

) : BaseEntity() {

    @OneToMany(mappedBy = "parent", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    val children: MutableList<Category> = mutableListOf()

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    val products: MutableList<Product> = mutableListOf()

    val isRoot: Boolean
        get() = parent == null

    val hasChildren: Boolean
        get() = children.isNotEmpty()

    val activeProductCount: Int
        get() = products.count { it.active }

    val fullPath: String
        get() = parent?.let { "${it.name} / $name" } ?: name

    fun addChild(child: Category) {
        child.parent = this
        children.add(child)
    }

    fun removeChild(child: Category) {
        child.parent = null
        children.remove(child)
    }

    fun deactivate(includeChildren: Boolean = false) {
        this.active = false
        if (includeChildren) {
            children.forEach { it.deactivate(includeChildren = true) }
        }
    }

    fun activate() {
        this.active = true
    }

    override fun toString(): String =
        "Category(id=$id, name='$name', slug='$slug', active=$active)"
}
