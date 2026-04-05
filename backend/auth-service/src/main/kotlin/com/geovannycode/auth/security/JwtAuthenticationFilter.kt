package com.geovannycode.auth.security

import com.geovannycode.auth.repository.UserRepository
import com.geovannycode.shared.constant.SecurityConstants
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    private val userRepository: UserRepository
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val token = extractToken(request)

            if (token != null && jwtService.validateToken(token)) {
                val email = jwtService.extractEmail(token)

                if (email != null && SecurityContextHolder.getContext().authentication == null) {
                    val user = userRepository.findByEmail(email).orElse(null)

                    if (user != null && user.isEnabled) {
                        val authToken = UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            user.authorities
                        )
                        authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
                        SecurityContextHolder.getContext().authentication = authToken

                        log.debug("Usuario autenticado: ${user.email}")
                    }
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
}