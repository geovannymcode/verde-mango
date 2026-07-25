package com.geovannycode.verdemango.catalog.web

import com.geovannycode.verdemango.catalog.domain.Category
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

// ==================== REQUEST DTOs ====================

data class CreateCategoryRequest(
    @field:NotBlank(message = "El nombre es requerido")
    @field:Size(min = 2, max = 100)
    val name: String,
    @field:Size(max = 120) val slug: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val parentId: Long? = null,
    val sortOrder: Int = 0,
    val metaTitle: String? = null,
    val metaDescription: String? = null
)

data class UpdateCategoryRequest(
    @field:Size(min = 2, max = 100) val name: String? = null,
    @field:Size(max = 120) val slug: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val parentId: Long? = null,
    val sortOrder: Int? = null,
    val active: Boolean? = null,
    val metaTitle: String? = null,
    val metaDescription: String? = null
)

data class ReorderCategoriesRequest(
    val categoryOrders: List<CategoryOrder>
)

data class CategoryOrder(
    val categoryId: Long,
    val sortOrder: Int
)

// ==================== RESPONSE DTOs ====================

data class CategoryResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val description: String?,
    val imageUrl: String?,
    val parentId: Long?,
    val parentName: String?,
    val sortOrder: Int,
    val active: Boolean,
    val productCount: Int,
    val metaTitle: String?,
    val metaDescription: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(category: Category, productCount: Int = 0) = CategoryResponse(
            id = category.id,
            name = category.name,
            slug = category.slug,
            description = category.description,
            imageUrl = category.imageUrl,
            parentId = category.parent?.id,
            parentName = category.parent?.name,
            sortOrder = category.sortOrder,
            active = category.active,
            productCount = productCount,
            metaTitle = category.metaTitle,
            metaDescription = category.metaDescription,
            createdAt = category.createdAt,
            updatedAt = category.updatedAt
        )
    }
}

data class CategorySummary(
    val id: Long,
    val name: String,
    val slug: String,
    val imageUrl: String?,
    val productCount: Int
) {
    companion object {
        fun from(category: Category, productCount: Int = 0) = CategorySummary(
            id = category.id,
            name = category.name,
            slug = category.slug,
            imageUrl = category.imageUrl,
            productCount = productCount
        )
    }
}

data class CategoryWithChildren(
    val id: Long,
    val name: String,
    val slug: String,
    val imageUrl: String?,
    val children: List<CategorySummary>
) {
    companion object {
        fun from(category: Category) = CategoryWithChildren(
            id = category.id,
            name = category.name,
            slug = category.slug,
            imageUrl = category.imageUrl,
            children = category.children
                .filter { it.active }
                .sortedBy { it.sortOrder }
                .map { CategorySummary.from(it) }
        )
    }
}
