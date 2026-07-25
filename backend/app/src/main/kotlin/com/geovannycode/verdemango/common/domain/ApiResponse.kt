package com.geovannycode.verdemango.common.domain

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.Instant

/**
 * Respuesta estándar de la API.
 * Todos los endpoints deben retornar este formato.
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
        fun <T> success(data: T, message: String? = null): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = data)

        fun <T> success(message: String): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = null)

        fun <T> error(message: String, path: String? = null): ApiResponse<T> =
            ApiResponse(success = false, message = message, data = null, path = path)

        fun <T> created(data: T, message: String = "Recurso creado exitosamente"): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = data)
    }
}
