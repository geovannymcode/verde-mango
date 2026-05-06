package com.geovannycode.shared.exception

/**
 * Clase base sellada para todas las excepciones del dominio.
 * Usar sealed class permite manejo exhaustivo en when expressions.
 */
sealed class VerdeMangException(
    override val message: String,
    val errorCode: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Recurso no encontrado (HTTP 404)
 */
class ResourceNotFoundException(
    resourceName: String,
    fieldName: String,
    fieldValue: Any
) : VerdeMangException(
    message = "$resourceName no encontrado con $fieldName: $fieldValue",
    errorCode = "RESOURCE_NOT_FOUND"
)

/**
 * Recurso ya existe (HTTP 409)
 */
class ResourceAlreadyExistsException(
    resourceName: String,
    fieldName: String,
    fieldValue: Any
) : VerdeMangException(
    message = "$resourceName ya existe con $fieldName: $fieldValue",
    errorCode = "RESOURCE_ALREADY_EXISTS"
)

/**
 * Violación de regla de negocio (HTTP 422)
 */
class BusinessRuleException(
    message: String,
    errorCode: String = "BUSINESS_RULE_VIOLATION"
) : VerdeMangException(message = message, errorCode = errorCode)

/**
 * Error de autenticación (HTTP 401)
 */
class AuthenticationException(
    message: String = "Autenticación fallida",
    errorCode: String = "AUTHENTICATION_FAILED"
) : VerdeMangException(message = message, errorCode = errorCode)

/**
 * Acceso denegado (HTTP 403)
 */
class AccessDeniedException(
    message: String = "Acceso denegado",
    errorCode: String = "ACCESS_DENIED"
) : VerdeMangException(message = message, errorCode = errorCode)

/**
 * Error de validación (HTTP 400)
 */
class ValidationException(
    message: String,
    val errors: Map<String, String> = emptyMap()
) : VerdeMangException(message = message, errorCode = "VALIDATION_ERROR")

/**
 * Error de servicio externo (HTTP 502)
 */
class ExternalServiceException(
    serviceName: String,
    message: String,
    cause: Throwable? = null
) : VerdeMangException(
    message = "Servicio externo '$serviceName' falló: $message",
    errorCode = "EXTERNAL_SERVICE_ERROR",
    cause = cause
)

/**
 * Error de pago (HTTP 402)
 */
class PaymentException(
    message: String,
    errorCode: String = "PAYMENT_FAILED",
    cause: Throwable? = null
) : VerdeMangException(message = message, errorCode = errorCode, cause = cause)

/**
 * Stock insuficiente (HTTP 409)
 */
class InsufficientStockException : VerdeMangException {
    constructor(
        productId: Long,
        requested: Int,
        available: Int
    ) : super(
        message = "Stock insuficiente para producto $productId. Solicitado: $requested, Disponible: $available",
        errorCode = "INSUFFICIENT_STOCK"
    )

    constructor(message: String) : super(
        message = message,
        errorCode = "INSUFFICIENT_STOCK"
    )
}

/**
 * Servicio externo no disponible (HTTP 503)
 */
class ServiceUnavailableException(
    message: String,
    cause: Throwable? = null
) : VerdeMangException(
    message = message,
    errorCode = "SERVICE_UNAVAILABLE",
    cause = cause
)

/**
 * Recurso duplicado (HTTP 409)
 */
class DuplicateResourceException(
    resourceName: String,
    fieldName: String,
    fieldValue: Any
) : VerdeMangException(
    message = "$resourceName duplicado con $fieldName: $fieldValue",
    errorCode = "DUPLICATE_RESOURCE"
)