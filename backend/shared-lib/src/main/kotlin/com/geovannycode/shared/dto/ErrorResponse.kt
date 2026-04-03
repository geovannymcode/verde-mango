package com.geovannycode.shared.dto

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.Instant

/**
 * Respuesta detallada de error.
 * Incluye errores de validación a nivel de campo.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ErrorResponse(
    val success: Boolean = false,
    val message: String,
    val errorCode: String? = null,
    val errors: List<FieldError>? = null,
    val timestamp: Instant = Instant.now(),
    val path: String? = null,
    val traceId: String? = null
) {
    companion object {
        fun of(message: String, errorCode: String? = null, path: String? = null) =
            ErrorResponse(message = message, errorCode = errorCode, path = path)

        fun withValidationErrors(
            message: String,
            errors: List<FieldError>,
            path: String? = null
        ) = ErrorResponse(
            message = message,
            errorCode = "VALIDATION_ERROR",
            errors = errors,
            path = path
        )
    }
}

/**
 * Error de validación de un campo específico.
 */
data class FieldError(
    val field: String,
    val message: String,
    val rejectedValue: Any? = null
)