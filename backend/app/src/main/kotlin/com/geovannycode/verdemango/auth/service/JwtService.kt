package com.geovannycode.verdemango.auth.service

import com.geovannycode.verdemango.auth.domain.User
import com.geovannycode.verdemango.common.domain.Role
import com.geovannycode.verdemango.common.security.JwtKeyFactory
import com.geovannycode.verdemango.common.security.JwtProperties
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.Date
import javax.crypto.SecretKey

@Service
class JwtService(
    private val jwtProperties: JwtProperties
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    private val signingKey: SecretKey by lazy {
        JwtKeyFactory.buildHs384Key(jwtProperties.secret)
    }

    fun generateAccessToken(user: User): String {
        val now = Date()
        val expiry = Date(now.time + jwtProperties.accessTokenExpiration)

        return Jwts.builder()
            .subject(user.email)
            .issuer(jwtProperties.issuer)
            .issuedAt(now)
            .expiration(expiry)
            .claim("userId", user.id)
            .claim("role", user.role.name)
            .claim("fullName", user.fullName)
            .signWith(signingKey)
            .compact()
    }

    fun generateRefreshToken(user: User): String {
        val now = Date()
        val expiry = Date(now.time + jwtProperties.refreshTokenExpiration)

        return Jwts.builder()
            .subject(user.email)
            .issuer(jwtProperties.issuer)
            .issuedAt(now)
            .expiration(expiry)
            .claim("userId", user.id)
            .claim("type", "refresh")
            .signWith(signingKey)
            .compact()
    }

    fun extractEmail(token: String): String? =
        extractClaim(token) { it.subject }

    fun extractUserId(token: String): Long? =
        extractClaim(token) { it.get("userId", java.lang.Long::class.java)?.toLong() }

    fun extractRole(token: String): Role? =
        extractClaim(token) { claims ->
            claims.get("role", String::class.java)?.let { Role.fromString(it) }
        }

    fun validateToken(token: String): Boolean {
        return try {
            val claims = extractAllClaims(token)
            !claims.expiration.before(Date())
        } catch (e: ExpiredJwtException) {
            logger.debug("Token expirado: ${e.message}")
            false
        } catch (e: JwtException) {
            logger.warn("Token invalido: ${e.message}")
            false
        }
    }

    fun isRefreshToken(token: String): Boolean =
        extractClaim(token) { it.get("type", String::class.java) } == "refresh"

    fun getAccessTokenExpirationSeconds(): Long = jwtProperties.accessTokenExpiration / 1000

    fun getRefreshTokenExpirationMillis(): Long = jwtProperties.refreshTokenExpiration

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
