package com.geovannycode.recipe.security

import com.geovannycode.shared.constant.Role
import com.geovannycode.shared.constant.SecurityConstants
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import javax.crypto.SecretKey

@Component
class JwtAuthenticationFilter(
    @Value("\${jwt.secret}")
    private val secret: String,
    @Value("\${jwt.issuer}")
    private val expectedIssuer: String
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    private val signingKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray())
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val token = extractToken(request)

            if (token != null) {
                val claims = validateAndExtractClaims(token)

                if (claims != null) {
                    val userId = claims.get("userId", java.lang.Long::class.java)?.toLong()
                    val email = claims.subject
                    val role = claims.get("role", String::class.java)?.let { Role.fromString(it) }
                    val userName = claims.get("name", String::class.java)

                    if (userId != null && email != null && role != null) {
                        val authorities = listOf(SimpleGrantedAuthority("ROLE_${role.name}"))

                        val authToken = UsernamePasswordAuthenticationToken(
                            userId,
                            email,
                            authorities
                        )
                        authToken.details = WebAuthenticationDetailsSource().buildDetails(request)

                        SecurityContextHolder.getContext().authentication = authToken

                        // Headers para usar en controllers
                        request.setAttribute("userEmail", email)
                        request.setAttribute("userName", userName)

                        log.debug("Usuario autenticado: $email (ID: $userId, Role: ${role.name})")
                    }
                }
            }
        } catch (e: Exception) {
            log.error("Error procesando JWT: ${e.message}")
        }

        filterChain.doFilter(request, response)
    }

    private fun extractToken(request: HttpServletRequest): String? {
        val header = request.getHeader(SecurityConstants.HEADER_AUTHORIZATION)
        return if (header != null && header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            header.substring(SecurityConstants.TOKEN_PREFIX.length)
        } else {
            null
        }
    }

    private fun validateAndExtractClaims(token: String): Claims? {
        return try {
            val claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .payload

            if (claims.issuer != expectedIssuer) {
                log.warn("Token con issuer inválido: ${claims.issuer}")
                return null
            }

            if (claims.get("type", String::class.java) == "refresh") {
                log.warn("Intento de usar refresh token como access token")
                return null
            }

            claims
        } catch (e: ExpiredJwtException) {
            log.debug("Token expirado")
            null
        } catch (e: JwtException) {
            log.warn("Token inválido: ${e.message}")
            null
        }
    }
}