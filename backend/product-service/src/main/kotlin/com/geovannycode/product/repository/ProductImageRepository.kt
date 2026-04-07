package com.geovannycode.product.repository

import com.geovannycode.product.entity.ProductImage
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface ProductImageRepository : JpaRepository<ProductImage, Long> {

    fun findByProductIdOrderBySortOrderAsc(productId: Long): List<ProductImage>

    fun findByProductIdAndIsPrimaryTrue(productId: Long): ProductImage?

    fun countByProductId(productId: Long): Int

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isPrimary = false WHERE pi.product.id = :productId")
    fun clearPrimaryForProduct(productId: Long): Int

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isPrimary = true WHERE pi.id = :imageId")
    fun setPrimary(imageId: Long): Int

    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId")
    fun deleteByProductId(productId: Long): Int
}