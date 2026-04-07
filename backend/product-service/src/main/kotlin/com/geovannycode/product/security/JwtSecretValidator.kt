package com.geovannycode.product.security

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

/**
 * Validación adicional del secret JWT en el profile `prod`.
 *
 * Rechaza explícitamente el secret de desarrollo conocido para evitar
 * que termine en producción por descuido (ej: alguien copia application.yml
 * sin setear la variable de entorno JWT_SECRET).
 *
 * Solo se activa cuando el profile `prod` está activo. En dev/test no aplica.
 */
@Component
@Profile("prod")
class JwtSecretValidator(
    private val jwtProperties: JwtProperties
) {

    private val log = LoggerFactory.getLogger(javaClass)

    @PostConstruct
    fun validateProductionSecret() {
        check(jwtProperties.secret !in FORBIDDEN_DEV_SECRETS) {
            "JWT_SECRET en producción no puede ser un secret de desarrollo conocido. " +
                    "Define la variable de entorno JWT_SECRET con un valor seguro y único."
        }

        check(jwtProperties.secret.length >= MIN_PRODUCTION_SECRET_LENGTH) {
            "JWT_SECRET en producción debe tener al menos $MIN_PRODUCTION_SECRET_LENGTH caracteres. " +
                    "Longitud actual: ${jwtProperties.secret.length}"
        }

        log.info("JWT secret validado correctamente para profile prod")
    }

    companion object {
        private const val MIN_PRODUCTION_SECRET_LENGTH = 64

        /**
         * Lista de secrets de desarrollo conocidos que NO deben aparecer en producción.
         * Si agregas más secrets de dev en otros entornos, agrégalos aquí.
         */
        private val FORBIDDEN_DEV_SECRETS = setOf(
            "verdemango-super-secret-key-that-should-be-changed-in-production-2024",
            "dev-secret-do-not-use-in-production-minimum-32-chars-long"
        )
    }
}