package com.geovannycode.shared.dto

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.Instant

/**
 * Respuesta estándar de la API.
 * Todos los endpoints deben retornar este formato.
 *
 * Ejemplo de uso:
 * ```kotlin
 * // Éxito con datos
 * ApiResponse.success(userDto, "Usuario creado exitosamente")
 *
 * // Error
 * ApiResponse.error<Nothing>("Usuario no encontrado")
 * ```
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val timestamp: Instant = Instant.now(),
    val path: String? = null
) {
    companion object {
        // Factory method para respuestas exitosas con datos
        fun <T> success(data: T, message: String? = null): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = data)

        // Factory method para respuestas exitosas sin datos
        fun <T> success(message: String): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = null)

        // Factory method para errores
        fun <T> error(message: String, path: String? = null): ApiResponse<T> =
            ApiResponse(success = false, message = message, data = null, path = path)

        // Factory method para recursos creados (HTTP 201)
        fun <T> created(data: T, message: String = "Recurso creado exitosamente"): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = data)
    }
}
