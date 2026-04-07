package com.geovannycode.product.service

import com.geovannycode.product.dto.CreateRatingRequest
import com.geovannycode.product.dto.RatingResponse
import com.geovannycode.product.dto.RatingStatsResponse
import com.geovannycode.product.dto.UpdateRatingRequest
import com.geovannycode.product.entity.ProductRating
import com.geovannycode.product.repository.ProductRatingRepository
import com.geovannycode.product.repository.ProductRepository
import com.geovannycode.shared.dto.PageResponse
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceNotFoundException
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

    /**
     * Obtiene ratings de un producto
     */
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

    /**
     * Obtiene estadísticas de ratings de un producto
     */
    @Transactional(readOnly = true)
    fun getRatingStats(productId: Long): RatingStatsResponse {
        val stats = ratingRepository.getRatingStatistics(productId)
        return RatingStatsResponse.from(stats)
    }

    /**
     * Crea un nuevo rating
     */
    @Transactional
    fun createRating(
        productId: Long,
        userId: Long,
        request: CreateRatingRequest,
        verifiedPurchase: Boolean = false
    ): RatingResponse {
        logger.info("Creando rating - producto: $productId, usuario: $userId")

        // Verificar que el producto existe
        val product = productRepository.findById(productId)
            .orElseThrow { ResourceNotFoundException("Producto", "id", productId) }

        // Verificar que el usuario no haya calificado ya
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

    /**
     * Actualiza un rating existente (solo el dueño puede actualizar)
     */
    @Transactional
    fun updateRating(
        ratingId: Long,
        userId: Long,
        request: UpdateRatingRequest
    ): RatingResponse {
        logger.info("Actualizando rating: $ratingId")

        val rating = ratingRepository.findById(ratingId)
            .orElseThrow { ResourceNotFoundException("Rating", "id", ratingId) }

        // Verificar propiedad
        if (rating.userId != userId) {
            throw BusinessRuleException("No tienes permiso para modificar este rating")
        }

        request.rating?.let { rating.updateRating(it) }
        request.title?.let { rating.title = it.trim() }
        request.comment?.let { rating.comment = it.trim() }

        val saved = ratingRepository.save(rating)
        return RatingResponse.from(saved)
    }

    /**
     * Elimina un rating (solo el dueño puede eliminar)
     */
    @Transactional
    fun deleteRating(ratingId: Long, userId: Long) {
        logger.info("Eliminando rating: $ratingId")

        val rating = ratingRepository.findById(ratingId)
            .orElseThrow { ResourceNotFoundException("Rating", "id", ratingId) }

        // Verificar propiedad
        if (rating.userId != userId) {
            throw BusinessRuleException("No tienes permiso para eliminar este rating")
        }

        ratingRepository.delete(rating)
    }

    /**
     * Marca un rating como útil
     */
    @Transactional
    fun markAsHelpful(ratingId: Long) {
        ratingRepository.incrementHelpfulCount(ratingId)
    }

    // ============== Operaciones admin ==============

    /**
     * Aprueba un rating pendiente
     */
    @Transactional
    fun approveRating(ratingId: Long) {
        logger.info("Aprobando rating: $ratingId")
        ratingRepository.approve(ratingId)
    }

    /**
     * Rechaza un rating
     */
    @Transactional
    fun rejectRating(ratingId: Long) {
        logger.info("Rechazando rating: $ratingId")
        ratingRepository.reject(ratingId)
    }

    /**
     * Obtiene ratings pendientes de moderación
     */
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