package com.geovannycode.product.security

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.validation.annotation.Validated

/**
 * Propiedades de configuración JWT mapeadas desde `application.yml`.
 *
 * Validaciones:
 * - [secret]: no puede estar vacío y debe tener al menos 32 caracteres
 *   (HS256 requiere claves de mínimo 256 bits = 32 bytes ASCII).
 * - [issuer]: no puede estar vacío.
 *
 * Spring valida estas restricciones en el arranque y falla fast si no se cumplen.
 */
@ConfigurationProperties(prefix = "jwt")
@Validated
data class JwtProperties(

    @field:NotBlank(message = "jwt.secret no puede estar vacío. Define la variable de entorno JWT_SECRET.")
    @field:Size(
        min = 32,
        message = "jwt.secret debe tener al menos 32 caracteres (HS256 requiere claves de 256 bits)."
    )
    val secret: String,

    @field:NotBlank(message = "jwt.issuer no puede estar vacío.")
    val issuer: String
)