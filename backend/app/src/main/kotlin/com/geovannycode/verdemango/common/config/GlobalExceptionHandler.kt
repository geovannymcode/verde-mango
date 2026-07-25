package com.geovannycode.verdemango.common.config

import com.geovannycode.verdemango.common.domain.AuthenticationException
import com.geovannycode.verdemango.common.domain.BusinessRuleException
import com.geovannycode.verdemango.common.domain.ErrorResponse
import com.geovannycode.verdemango.common.domain.FieldError
import com.geovannycode.verdemango.common.domain.InsufficientStockException
import com.geovannycode.verdemango.common.domain.PaymentException
import com.geovannycode.verdemango.common.domain.ResourceAlreadyExistsException
import com.geovannycode.verdemango.common.domain.ResourceNotFoundException
import com.geovannycode.verdemango.common.domain.ServiceUnavailableException
import com.geovannycode.verdemango.common.domain.ValidationException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException as SpringAccessDeniedException
import org.springframework.validation.FieldError as SpringFieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleNotFound(
        ex: ResourceNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Recurso no encontrado: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(ResourceAlreadyExistsException::class)
    fun handleConflict(
        ex: ResourceAlreadyExistsException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Conflicto de recurso: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(InsufficientStockException::class)
    fun handleInsufficientStock(
        ex: InsufficientStockException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Stock insuficiente: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthentication(
        ex: AuthenticationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Error de autenticacion: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(com.geovannycode.verdemango.common.domain.AccessDeniedException::class, SpringAccessDeniedException::class)
    fun handleAccessDenied(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Acceso denegado: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.of("Acceso denegado", "ACCESS_DENIED", request.requestURI))
    }

    @ExceptionHandler(ValidationException::class)
    fun handleValidation(
        ex: ValidationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errors = ex.errors.map { (field, message) -> FieldError(field, message) }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.withValidationErrors(ex.message, errors, request.requestURI))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValid(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.allErrors.mapNotNull { error ->
            val field = (error as? SpringFieldError)?.field ?: "unknown"
            val message = error.defaultMessage ?: "Error de validacion"
            FieldError(field, message, (error as? SpringFieldError)?.rejectedValue)
        }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.withValidationErrors("Error de validacion", errors, request.requestURI))
    }

    @ExceptionHandler(BusinessRuleException::class)
    fun handleBusinessRule(
        ex: BusinessRuleException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Violacion de regla de negocio: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(PaymentException::class)
    fun handlePayment(
        ex: PaymentException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Error de pago: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.PAYMENT_REQUIRED)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(ServiceUnavailableException::class)
    fun handleServiceUnavailable(
        ex: ServiceUnavailableException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Servicio no disponible: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Error interno: ${ex.message}", ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(
                "Error interno del servidor",
                "INTERNAL_ERROR",
                request.requestURI
            ))
    }
}
