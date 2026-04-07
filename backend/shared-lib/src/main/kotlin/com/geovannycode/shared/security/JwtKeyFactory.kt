package com.geovannycode.shared.security

import io.jsonwebtoken.security.Keys
import javax.crypto.SecretKey

/**
 * Factory para construir la [SecretKey] de firma JWT de forma consistente
 * entre todos los microservicios.
 *
 * Fuerza el algoritmo HS384 explícitamente en lugar de depender de la
 * derivación automática de `Keys.hmacShaKeyFor()`, que cambia el algoritmo
 * según el tamaño del secret y puede romper silenciosamente la verificación
 * si alguien cambia el largo del secret.
 *
 * Requisitos:
 * - El secret debe tener al menos 48 bytes (384 bits) para HS384.
 * - Todos los servicios que firmen o verifiquen tokens deben usar esta factory.
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
                    "Tamaño actual: ${bytes.size} bytes."
        }
        return Keys.hmacShaKeyFor(bytes)
    }
}