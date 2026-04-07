package com.geovannycode.product.security

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
import java.util.Date
import javax.crypto.SecretKey

/**
 * Filtro JWT para validar tokens emitidos por el Auth Service.
 * No autentica usuarios, solo valida tokens existentes.
 */
@Component
class JwtAuthenticationFilter(
    @Value("\${jwt.secret}")
    private val secret: String
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

            if (token != null && validateToken(token)) {
                val claims = extractAllClaims(token)
                val email = claims.subject
                val userId = claims.get("userId", java.lang.Long::class.java)?.toLong()
                val roleStr = claims.get("role", String::class.java)

                if (email != null && userId != null && roleStr != null) {
                    val role = Role.fromString(roleStr)
                    val authorities = listOf(SimpleGrantedAuthority("ROLE_${role.name}"))

                    val authentication = UsernamePasswordAuthenticationToken(
                        UserPrincipal(userId, email, role),
                        null,
                        authorities
                    )
                    authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
                    SecurityContextHolder.getContext().authentication = authentication

                    // Agregar headers para uso en controllers
                    request.setAttribute("userId", userId)
                    request.setAttribute("userEmail", email)
                    request.setAttribute("userRole", role)

                    log.debug("Usuario autenticado: $email (ID: $userId)")
                }
            }
        } catch (e: Exception) {
            log.error("Error en autenticación JWT: ${e.message}")
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

    private fun validateToken(token: String): Boolean {
        return try {
            val claims = extractAllClaims(token)
            !claims.expiration.before(Date())
        } catch (e: ExpiredJwtException) {
            log.debug("Token expirado")
            false
        } catch (e: JwtException) {
            log.warn("Token inválido: ${e.message}")
            false
        }
    }

    private fun extractAllClaims(token: String): Claims =
        Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
}

/**
 * Principal simplificado para el contexto de seguridad
 */
data class UserPrincipal(
    val id: Long,
    val email: String,
    val role: Role
)