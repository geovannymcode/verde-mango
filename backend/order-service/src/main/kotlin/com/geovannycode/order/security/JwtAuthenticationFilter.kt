package com.geovannycode.order.security

import com.geovannycode.shared.constant.Role
import com.geovannycode.shared.constant.SecurityConstants
import com.geovannycode.shared.security.JwtKeyFactory
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.SignatureException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
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
 * No autentica usuarios contra BD, solo valida la firma del token y extrae los claims.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtProperties: JwtProperties
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    private val signingKey: SecretKey by lazy {
        JwtKeyFactory.buildHs384Key(jwtProperties.secret)
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val token = extractToken(request)

            if (token != null) {
                authenticate(token, request)
            }
        } catch (e: ExpiredJwtException) {
            log.debug("Token expirado: {}", e.message)
        } catch (e: SignatureException) {
            log.warn("Firma JWT inválida: {}", e.message)
        } catch (e: JwtException) {
            log.warn("Token JWT inválido: {}", e.message)
        } catch (e: Exception) {
            log.error("Error inesperado en autenticación JWT", e)
        }

        filterChain.doFilter(request, response)
    }

    private fun authenticate(token: String, request: HttpServletRequest) {
        val claims = parseClaims(token)

        if (claims.expiration.before(Date())) {
            log.debug("Token expirado para subject: {}", claims.subject)
            return
        }

        val email = claims.subject ?: run {
            log.warn("Token sin subject (email)")
            return
        }

        val userId = extractUserId(claims) ?: run {
            log.warn("Token sin claim userId válido")
            return
        }

        val role = extractRole(claims) ?: run {
            log.warn("Token sin claim role válido")
            return
        }

        val authorities = listOf(SimpleGrantedAuthority("ROLE_${role.name}"))
        val principal = UserPrincipal(id = userId, email = email, role = role)

        val authentication = UsernamePasswordAuthenticationToken(
            principal,
            null,
            authorities
        )
        authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
        SecurityContextHolder.getContext().authentication = authentication

        // Atributos disponibles para controllers
        request.setAttribute("userId", userId)
        request.setAttribute("userEmail", email)
        request.setAttribute("userRole", role)

        log.debug("Usuario autenticado: {} (ID: {}, rol: {})", email, userId, role)
    }

    private fun extractToken(request: HttpServletRequest): String? {
        val header = request.getHeader(SecurityConstants.HEADER_AUTHORIZATION) ?: return null
        return if (header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            header.substring(SecurityConstants.TOKEN_PREFIX.length)
        } else {
            null
        }
    }

    /**
     * Extrae `userId` del token aceptando tanto Integer como Long.
     *
     * JJWT deserializa números JSON como Integer cuando caben en 32 bits,
     * pero el claim puede venir como Long si es un ID grande. Usamos Number
     * como tipo común y convertimos a Long de forma segura.
     */
    private fun extractUserId(claims: Claims): Long? =
        claims.get("userId", Number::class.java)?.toLong()

    private fun extractRole(claims: Claims): Role? =
        claims.get("role", String::class.java)?.let { runCatching { Role.fromString(it) }.getOrNull() }

    private fun parseClaims(token: String): Claims =
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