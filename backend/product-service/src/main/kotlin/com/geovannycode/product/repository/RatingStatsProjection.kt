package com.geovannycode.product.repository

/**
 * Projection interface para las estadísticas agregadas de ratings de un producto.
 *
 * Spring Data mapea automáticamente las columnas de la query a estos getters
 * usando los alias definidos en el SELECT (ver [ProductRatingRepository.getRatingStatistics]).
 *
 * Los retornos son nullables porque cuando un producto no tiene ratings:
 * - `total` será 0 (no null) gracias a COUNT
 * - `average` será null (AVG sobre conjunto vacío)
 * - Los conteos por estrella serán 0 o null según la BD
 */
interface RatingStatsProjection {
    fun getTotal(): Long
    fun getAverage(): Double?
    fun getFiveStars(): Long?
    fun getFourStars(): Long?
    fun getThreeStars(): Long?
    fun getTwoStars(): Long?
    fun getOneStar(): Long?
}