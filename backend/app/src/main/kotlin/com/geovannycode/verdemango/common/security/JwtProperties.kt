package com.geovannycode.verdemango.common.security

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.validation.annotation.Validated

/**
 * Propiedades de configuracion JWT mapeadas desde `application.yaml`.
 *
 * Validaciones:
 * - [secret]: no puede estar vacio y debe tener al menos 48 caracteres
 *   (HS384 requiere claves de minimo 384 bits = 48 bytes ASCII).
 * - [issuer]: no puede estar vacio.
 */
@ConfigurationProperties(prefix = "jwt")
@Validated
data class JwtProperties(

    @field:NotBlank(message = "jwt.secret no puede estar vacio. Define la variable de entorno JWT_SECRET.")
    @field:Size(
        min = 48,
        message = "jwt.secret debe tener al menos 48 caracteres (HS384 requiere claves de 384 bits)."
    )
    val secret: String,

    @field:NotBlank(message = "jwt.issuer no puede estar vacio.")
    val issuer: String,

    val accessTokenExpiration: Long = 900000,

    val refreshTokenExpiration: Long = 604800000
)
