package com.geovannycode.verdemango.recipes.service

import com.geovannycode.verdemango.common.domain.PageResponse
import com.geovannycode.verdemango.common.domain.ResourceAlreadyExistsException
import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import com.geovannycode.verdemango.recipes.domain.RecipeRating
import com.geovannycode.verdemango.recipes.repository.RecipeRatingRepository
import com.geovannycode.verdemango.recipes.repository.RecipeRepository
import com.geovannycode.verdemango.recipes.web.CreateRatingRequest
import com.geovannycode.verdemango.recipes.web.RatingResponse
import com.geovannycode.verdemango.recipes.web.RatingStatsResponse
import com.geovannycode.verdemango.recipes.web.UpdateRatingRequest
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service("recipeRatingService")
class RatingService(
    private val ratingRepository: RecipeRatingRepository,
    private val recipeRepository: RecipeRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun getRatings(recipeSlug: String, page: Int, size: Int): PageResponse<RatingResponse> {
        val recipe = recipeRepository.findBySlug(recipeSlug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", recipeSlug) }

        val pageable = PageRequest.of(page, size)
        val ratingsPage = ratingRepository.findByRecipeIdAndApprovedTrueOrderByCreatedAtDesc(recipe.id, pageable)

        return PageResponse.of(
            content = ratingsPage.content.map { RatingResponse.from(it) },
            page = page, size = size, totalElements = ratingsPage.totalElements
        )
    }

    @Transactional(readOnly = true)
    fun getRatingStats(recipeSlug: String): RatingStatsResponse {
        val recipe = recipeRepository.findBySlug(recipeSlug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", recipeSlug) }

        val average = ratingRepository.getAverageRating(recipe.id) ?: 0.0
        val total = ratingRepository.countApprovedRatings(recipe.id)
        val distribution = ratingRepository.getRatingDistribution(recipe.id)
            .associate { (it[0] as Int) to (it[1] as Long) }

        return RatingStatsResponse(
            averageRating = average,
            totalRatings = total,
            distribution = distribution
        )
    }

    @Transactional
    fun createRating(
        recipeSlug: String,
        userId: Long,
        userName: String?,
        request: CreateRatingRequest
    ): RatingResponse {
        val recipe = recipeRepository.findBySlug(recipeSlug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", recipeSlug) }

        if (ratingRepository.existsByRecipeIdAndUserId(recipe.id, userId)) {
            throw ResourceAlreadyExistsException("Rating", "userId", userId)
        }

        val rating = RecipeRating(
            recipe = recipe,
            userId = userId,
            userName = userName,
            rating = request.rating,
            comment = request.comment,
            madeRecipe = request.madeRecipe
        )

        val saved = ratingRepository.save(rating)
        logger.info("Rating creado para receta ${recipe.slug} por usuario $userId")

        return RatingResponse.from(saved)
    }

    @Transactional
    fun updateRating(
        recipeSlug: String,
        userId: Long,
        request: UpdateRatingRequest
    ): RatingResponse {
        val recipe = recipeRepository.findBySlug(recipeSlug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", recipeSlug) }

        val rating = ratingRepository.findByRecipeIdAndUserId(recipe.id, userId)
            .orElseThrow { ResourceNotFoundException("Rating", "userId", userId) }

        request.rating?.let { rating.rating = it }
        request.comment?.let { rating.comment = it }
        request.madeRecipe?.let { rating.madeRecipe = it }

        val saved = ratingRepository.save(rating)
        return RatingResponse.from(saved)
    }

    @Transactional
    fun deleteRating(recipeSlug: String, userId: Long) {
        val recipe = recipeRepository.findBySlug(recipeSlug)
            .orElseThrow { ResourceNotFoundException("Receta", "slug", recipeSlug) }

        val rating = ratingRepository.findByRecipeIdAndUserId(recipe.id, userId)
            .orElseThrow { ResourceNotFoundException("Rating", "userId", userId) }

        ratingRepository.delete(rating)
        logger.info("Rating eliminado para receta ${recipe.slug} por usuario $userId")
    }
}
