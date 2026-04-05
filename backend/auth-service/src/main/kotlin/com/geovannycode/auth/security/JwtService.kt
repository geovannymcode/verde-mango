package com.geovannycode.auth.security

import com.geovannycode.auth.entity.User
import com.geovannycode.shared.constant.Role
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date
import javax.crypto.SecretKey

/**
 * Servicio para generación y validación de JWT tokens.
 */
@Service
class JwtService(
    @Value("\${jwt.secret}")
    private val secret: String,

    @Value("\${jwt.access-token-expiration}")
    private val accessTokenExpiration: Long,

    @Value("\${jwt.refresh-token-expiration}")
    private val refreshTokenExpiration: Long,

    @Value("\${jwt.issuer}")
    private val issuer: String
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // Key generada una sola vez (lazy initialization)
    private val signingKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray())
    }

    /**
     * Genera access token JWT
     */
    fun generateAccessToken(user: User): String {
        val now = Date()
        val expiry = Date(now.time + accessTokenExpiration)

        return Jwts.builder()
            .subject(user.email)
            .issuer(issuer)
            .issuedAt(now)
            .expiration(expiry)
            .claim("userId", user.id)
            .claim("role", user.role.name)
            .claim("fullName", user.fullName)
            .signWith(signingKey)
            .compact()
    }

    /**
     * Genera refresh token (más largo, menos claims)
     */
    fun generateRefreshToken(user: User): String {
        val now = Date()
        val expiry = Date(now.time + refreshTokenExpiration)

        return Jwts.builder()
            .subject(user.email)
            .issuer(issuer)
            .issuedAt(now)
            .expiration(expiry)
            .claim("userId", user.id)
            .claim("type", "refresh")
            .signWith(signingKey)
            .compact()
    }

    /**
     * Extrae email (subject) del token
     */
    fun extractEmail(token: String): String? =
        extractClaim(token) { it.subject }

    /**
     * Extrae userId del token
     */
    fun extractUserId(token: String): Long? =
        extractClaim(token) { it.get("userId", java.lang.Long::class.java)?.toLong() }

    /**
     * Extrae rol del token
     */
    fun extractRole(token: String): Role? =
        extractClaim(token) { claims ->
            claims.get("role", String::class.java)?.let { Role.fromString(it) }
        }

    /**
     * Valida el token
     */
    fun validateToken(token: String): Boolean {
        return try {
            val claims = extractAllClaims(token)
            !claims.expiration.before(Date())
        } catch (e: ExpiredJwtException) {
            logger.debug("Token expirado: ${e.message}")
            false
        } catch (e: JwtException) {
            logger.warn("Token inválido: ${e.message}")
            false
        }
    }

    /**
     * Verifica si es un refresh token
     */
    fun isRefreshToken(token: String): Boolean =
        extractClaim(token) { it.get("type", String::class.java) } == "refresh"

    /**
     * Obtiene tiempo de expiración del access token en segundos
     */
    fun getAccessTokenExpirationSeconds(): Long = accessTokenExpiration / 1000

    fun getRefreshTokenExpirationMillis(): Long = refreshTokenExpiration

    // ============== Métodos privados ==============

    private fun <T> extractClaim(token: String, resolver: (Claims) -> T): T? {
        return try {
            resolver(extractAllClaims(token))
        } catch (e: JwtException) {
            logger.debug("Error extrayendo claim: ${e.message}")
            null
        }
    }

    private fun extractAllClaims(token: String): Claims =
        Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
}
