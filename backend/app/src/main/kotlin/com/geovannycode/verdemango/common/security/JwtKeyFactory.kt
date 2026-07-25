package com.geovannycode.verdemango.common.security

import io.jsonwebtoken.security.Keys
import javax.crypto.SecretKey

/**
 * Factory para construir la [SecretKey] de firma JWT de forma consistente.
 *
 * Fuerza el algoritmo HS384 explicitamente en lugar de depender de la
 * derivacion automatica de `Keys.hmacShaKeyFor()`, que cambia el algoritmo
 * segun el tamano del secret.
 *
 * Requisitos:
 * - El secret debe tener al menos 48 bytes (384 bits) para HS384.
 */
object JwtKeyFactory {

    private const val MIN_SECRET_BYTES = 48 // HS384 requiere al menos 384 bits

    /**
     * Construye la [SecretKey] para HMAC-SHA384.
     *
     * @throws IllegalArgumentException si el secret tiene menos de 48 bytes.
     */
    fun buildHs384Key(secret: String): SecretKey {
        val bytes = secret.toByteArray(Charsets.UTF_8)
        require(bytes.size >= MIN_SECRET_BYTES) {
            "JWT secret debe tener al menos $MIN_SECRET_BYTES bytes para HS384. " +
                    "Tamano actual: ${bytes.size} bytes."
        }
        return Keys.hmacShaKeyFor(bytes)
    }
}
