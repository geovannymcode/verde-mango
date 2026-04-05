package com.geovannycode.auth.exception

import com.geovannycode.shared.dto.ErrorResponse
import com.geovannycode.shared.dto.FieldError
import com.geovannycode.shared.exception.AuthenticationException
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import com.geovannycode.shared.exception.ResourceNotFoundException
import com.geovannycode.shared.exception.ValidationException
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

    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthentication(
        ex: AuthenticationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Error de autenticación: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(AccessDeniedException::class, SpringAccessDeniedException::class)
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
            val message = error.defaultMessage ?: "Error de validación"
            FieldError(field, message, (error as? SpringFieldError)?.rejectedValue)
        }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.withValidationErrors("Error de validación", errors, request.requestURI))
    }

    @ExceptionHandler(BusinessRuleException::class)
    fun handleBusinessRule(
        ex: BusinessRuleException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Violación de regla de negocio: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
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