package com.geovannycode.verdemango.auth.service

import com.geovannycode.verdemango.auth.domain.RefreshToken
import com.geovannycode.verdemango.auth.domain.User
import com.geovannycode.verdemango.auth.repository.RefreshTokenRepository
import com.geovannycode.verdemango.auth.repository.UserRepository
import com.geovannycode.verdemango.auth.web.AuthResponse
import com.geovannycode.verdemango.auth.web.LoginRequest
import com.geovannycode.verdemango.auth.web.RefreshTokenRequest
import com.geovannycode.verdemango.auth.web.RegisterRequest
import com.geovannycode.verdemango.auth.web.TokenResponse
import com.geovannycode.verdemango.auth.web.UserResponse
import com.geovannycode.verdemango.common.domain.AuthenticationException
import com.geovannycode.verdemango.common.domain.ResourceAlreadyExistsException
import com.geovannycode.verdemango.common.domain.Role
import com.geovannycode.verdemango.common.domain.UserRegisteredEvent
import com.geovannycode.verdemango.common.domain.generateUUID
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun register(request: RegisterRequest, ipAddress: String? = null): AuthResponse {
        logger.info("Intentando registrar usuario: ${request.email}")

        if (userRepository.existsByEmail(request.email)) {
            throw ResourceAlreadyExistsException("Usuario", "email", request.email)
        }

        val user = User(
            email = request.email.lowercase().trim(),
            passwordHash = passwordEncoder.encode(request.password),
            firstName = request.firstName.trim(),
            lastName = request.lastName.trim(),
            phone = request.phone?.trim(),
            role = Role.CUSTOMER
        )

        val savedUser = userRepository.save(user)
        logger.info("Usuario registrado exitosamente: ${savedUser.id}")

        val authResponse = generateAuthResponse(savedUser, ipAddress)

        publishUserRegisteredEvent(savedUser)

        return authResponse
    }

    @Transactional
    fun login(request: LoginRequest, ipAddress: String? = null): AuthResponse {
        logger.info("Intento de login: ${request.email}")

        val user = userRepository.findByEmail(request.email.lowercase())
            .orElseThrow { AuthenticationException("Credenciales invalidas") }

        if (!user.active) {
            throw AuthenticationException("Cuenta desactivada")
        }

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw AuthenticationException("Credenciales invalidas")
        }

        logger.info("Login exitoso: ${user.id}")
        return generateAuthResponse(user, ipAddress)
    }

    @Transactional
    fun refreshToken(request: RefreshTokenRequest, ipAddress: String? = null): TokenResponse {
        val refreshToken = refreshTokenRepository.findByToken(request.refreshToken)
            .orElseThrow { AuthenticationException("Refresh token invalido") }

        if (!refreshToken.isValid) {
            throw AuthenticationException("Refresh token expirado o revocado")
        }

        refreshToken.revoke()
        refreshTokenRepository.save(refreshToken)

        val user = refreshToken.user
        val newAccessToken = jwtService.generateAccessToken(user)
        val newRefreshToken = createRefreshToken(user, ipAddress)

        return TokenResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken.token,
            expiresIn = jwtService.getAccessTokenExpirationSeconds()
        )
    }

    @Transactional
    fun logout(userId: Long) {
        logger.info("Cerrando sesion de usuario: $userId")
        refreshTokenRepository.revokeAllByUserId(userId)
    }

    private fun generateAuthResponse(user: User, ipAddress: String?): AuthResponse {
        val accessToken = jwtService.generateAccessToken(user)
        val refreshToken = createRefreshToken(user, ipAddress)

        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken.token,
            expiresIn = jwtService.getAccessTokenExpirationSeconds(),
            user = UserResponse.from(user)
        )
    }

    private fun createRefreshToken(user: User, ipAddress: String?): RefreshToken {
        val token = jwtService.generateRefreshToken(user)
        val expiresAt = Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMillis())

        val refreshToken = RefreshToken(
            token = token,
            user = user,
            expiresAt = expiresAt,
            ipAddress = ipAddress
        )

        return refreshTokenRepository.save(refreshToken)
    }

    private fun publishUserRegisteredEvent(user: User) {
        val event = UserRegisteredEvent(
            eventId = generateUUID(),
            userId = user.id,
            email = user.email,
            firstName = user.firstName,
            lastName = user.lastName
        )

        try {
            eventPublisher.publishEvent(event)
            logger.debug("Evento UserRegistered publicado para: ${user.id}")
        } catch (e: Exception) {
            logger.error("Error publicando evento UserRegistered: ${e.message}")
        }
    }
}
