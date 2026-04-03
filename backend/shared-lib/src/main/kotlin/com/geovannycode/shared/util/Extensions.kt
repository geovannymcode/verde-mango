package com.geovannycode.shared.dto

import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

// ============== String Extensions ==============

/**
 * Convierte un string a slug URL-friendly
 * "Verde Mango Shop" -> "verde-mango-shop"
 */
fun String.toSlug(): String = this
    .lowercase()
    .replace(Regex("[^a-z0-9\\s-]"), "")
    .replace(Regex("\\s+"), "-")
    .replace(Regex("-+"), "-")
    .trim('-')

/**
 * Retorna string vacío si es null
 */
fun String?.orEmpty(): String = this ?: ""

/**
 * Verifica si no es null ni blank
 */
fun String?.isNotNullOrBlank(): Boolean = !this.isNullOrBlank()

/**
 * Capitaliza cada palabra
 * "verde mango" -> "Verde Mango"
 */
fun String.capitalizeWords(): String = split(" ")
    .joinToString(" ") { word ->
        word.lowercase().replaceFirstChar { it.uppercase() }
    }

// ============== UUID Extensions ==============

/**
 * Genera un UUID como String
 */
fun generateUUID(): String = UUID.randomUUID().toString()

/**
 * Valida si un string es un UUID válido
 */
fun String.isValidUUID(): Boolean = try {
    UUID.fromString(this)
    true
} catch (e: IllegalArgumentException) {
    false
}

// ============== Date/Time Extensions ==============

private val DEFAULT_ZONE = ZoneId.of("America/Bogota")
private val ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME

fun Instant.toLocalDateTime(zoneId: ZoneId = DEFAULT_ZONE): LocalDateTime =
    LocalDateTime.ofInstant(this, zoneId)

fun LocalDateTime.toInstant(zoneId: ZoneId = DEFAULT_ZONE): Instant =
    this.atZone(zoneId).toInstant()

fun Instant.formatISO(): String =
    ISO_FORMATTER.format(this.atZone(DEFAULT_ZONE))

// ============== Collection Extensions ==============

/**
 * Ejecuta bloque solo si la lista no está vacía
 */
inline fun <T> List<T>.ifNotEmpty(block: (List<T>) -> Unit) {
    if (this.isNotEmpty()) block(this)
}

/**
 * Ejecuta bloque solo si el map no está vacío
 */
inline fun <K, V> Map<K, V>.ifNotEmpty(block: (Map<K, V>) -> Unit) {
    if (this.isNotEmpty()) block(this)
}

// ============== Numeric Extensions ==============

fun Long?.orZero(): Long = this ?: 0L
fun Int?.orZero(): Int = this ?: 0
fun Double?.orZero(): Double = this ?: 0.0

/**
 * Formatea como pesos colombianos
 * 28000L -> "$28,000"
 */
fun Long.formatAsCOP(): String = String.format("$%,d", this)

fun Double.formatAsCOP(): String = String.format("$%,.0f", this)