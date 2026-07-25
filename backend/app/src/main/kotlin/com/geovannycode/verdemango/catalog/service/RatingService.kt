package com.geovannycode.verdemango.catalog.service

import com.geovannycode.verdemango.catalog.domain.ProductRating
import com.geovannycode.verdemango.catalog.repository.ProductRatingRepository
import com.geovannycode.verdemango.catalog.repository.ProductRepository
import com.geovannycode.verdemango.catalog.web.CreateRatingRequest
import com.geovannycode.verdemango.catalog.web.RatingResponse
import com.geovannycode.verdemango.catalog.web.RatingStatsResponse
import com.geovannycode.verdemango.catalog.web.UpdateRatingRequest
import com.geovannycode.verdemango.common.domain.BusinessRuleException
import com.geovannycode.verdemango.common.domain.PageResponse
import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RatingService(
    private val ratingRepository: ProductRatingRepository,
    private val productRepository: ProductRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun getRatings(
        productId: Long,
        page: Int = 0,
        size: Int = 10,
        sortBy: String = "createdAt"
    ): PageResponse<RatingResponse> {
        logger.debug("Obteniendo ratings del producto: $productId")

        val sort = Sort.by(Sort.Direction.DESC, sortBy)
        val pageable = PageRequest.of(page, size.coerceIn(1, 50), sort)

        val ratingsPage = ratingRepository.findByProductIdAndApprovedTrue(productId, pageable)

        return PageResponse.of(
            content = ratingsPage.content.map { RatingResponse.from(it) },
            page = page,
            size = size,
            totalElements = ratingsPage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getRatingStats(productId: Long): RatingStatsResponse {
        logger.debug("Obteniendo estadísticas de ratings del producto: $productId")
        return RatingStatsResponse.from(ratingRepository.getRatingStatistics(productId))
    }

    @Transactional
    fun createRating(
        productId: Long,
        userId: Long,
        request: CreateRatingRequest,
        verifiedPurchase: Boolean = false
    ): RatingResponse {
        logger.info("Creando rating - producto: $productId, usuario: $userId")

        val product = productRepository.findById(productId)
            .orElseThrow { ResourceNotFoundException("Producto", "id", productId) }

        if (ratingRepository.existsByProductIdAndUserId(productId, userId)) {
            throw BusinessRuleException("Ya has calificado este producto")
        }

        val rating = ProductRating(
            product = product,
            userId = userId,
            rating = request.rating.toShort(),
            title = request.title?.trim(),
            comment = request.comment?.trim(),
            verifiedPurchase = verifiedPurchase
        )

        val saved = ratingRepository.save(rating)
        logger.info("Rating creado: ${saved.id}")

        return RatingResponse.from(saved)
    }

    @Transactional
    fun updateRating(
        ratingId: Long,
        userId: Long,
        request: UpdateRatingRequest
    ): RatingResponse {
        logger.info("Actualizando rating: $ratingId")

        val rating = ratingRepository.findById(ratingId)
            .orElseThrow { ResourceNotFoundException("Rating", "id", ratingId) }

        if (rating.userId != userId) {
            throw BusinessRuleException("No tienes permiso para modificar este rating")
        }

        request.rating?.let { rating.updateRating(it) }
        request.title?.let { rating.title = it.trim() }
        request.comment?.let { rating.comment = it.trim() }

        val saved = ratingRepository.save(rating)
        return RatingResponse.from(saved)
    }

    @Transactional
    fun deleteRating(ratingId: Long, userId: Long) {
        logger.info("Eliminando rating: $ratingId")

        val rating = ratingRepository.findById(ratingId)
            .orElseThrow { ResourceNotFoundException("Rating", "id", ratingId) }

        if (rating.userId != userId) {
            throw BusinessRuleException("No tienes permiso para eliminar este rating")
        }

        ratingRepository.delete(rating)
    }

    @Transactional
    fun markAsHelpful(ratingId: Long) {
        ratingRepository.incrementHelpfulCount(ratingId)
    }

    // ============== Operaciones admin ==============

    @Transactional
    fun approveRating(ratingId: Long) {
        logger.info("Aprobando rating: $ratingId")
        ratingRepository.approve(ratingId)
    }

    @Transactional
    fun rejectRating(ratingId: Long) {
        logger.info("Rechazando rating: $ratingId")
        ratingRepository.reject(ratingId)
    }

    @Transactional(readOnly = true)
    fun getPendingRatings(page: Int = 0, size: Int = 20): PageResponse<RatingResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"))
        val ratingsPage = ratingRepository.findByApprovedFalse(pageable)

        return PageResponse.of(
            content = ratingsPage.content.map { RatingResponse.from(it) },
            page = page,
            size = size,
            totalElements = ratingsPage.totalElements
        )
    }
}
