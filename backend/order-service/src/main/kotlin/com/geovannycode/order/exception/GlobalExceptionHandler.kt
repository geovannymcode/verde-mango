package com.geovannycode.order.exception

import com.geovannycode.shared.dto.ErrorResponse
import com.geovannycode.shared.dto.FieldError
import com.geovannycode.shared.exception.AccessDeniedException
import com.geovannycode.shared.exception.BusinessRuleException
import com.geovannycode.shared.exception.InsufficientStockException
import com.geovannycode.shared.exception.ResourceNotFoundException
import com.geovannycode.shared.exception.ServiceUnavailableException
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
    fun handleNotFound(ex: ResourceNotFoundException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Recurso no encontrado: ${ex.message}")
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(BusinessRuleException::class)
    fun handleBusinessRule(ex: BusinessRuleException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Regla de negocio violada: ${ex.message}")
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(InsufficientStockException::class)
    fun handleInsufficientStock(ex: InsufficientStockException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Stock insuficiente: ${ex.message}")
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(ServiceUnavailableException::class)
    fun handleServiceUnavailable(ex: ServiceUnavailableException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        logger.error("Servicio externo no disponible: ${ex.message}")
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ErrorResponse.of(ex.message, ex.errorCode, request.requestURI))
    }

    @ExceptionHandler(AccessDeniedException::class, SpringAccessDeniedException::class)
    fun handleAccessDenied(ex: Exception, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.of("Acceso denegado", "ACCESS_DENIED", request.requestURI))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.allErrors.mapNotNull { error ->
            val field = (error as? SpringFieldError)?.field ?: "unknown"
            val message = error.defaultMessage ?: "Error de validación"
            FieldError(field, message, (error as? SpringFieldError)?.rejectedValue)
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.withValidationErrors("Error de validación", errors, request.requestURI))
    }

    @ExceptionHandler(IllegalArgumentException::class, IllegalStateException::class)
    fun handleIllegal(ex: Exception, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Error: ${ex.message}")
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(ex.message ?: "Error en la solicitud", "BAD_REQUEST", request.requestURI))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        logger.error("Error interno: ${ex.message}", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of("Error interno del servidor", "INTERNAL_ERROR", request.requestURI))
    }
}