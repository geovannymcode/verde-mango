package com.geovannycode.auth.service

import com.geovannycode.auth.dto.AuthResponse
import com.geovannycode.auth.dto.LoginRequest
import com.geovannycode.auth.dto.RefreshTokenRequest
import com.geovannycode.auth.dto.RegisterRequest
import com.geovannycode.auth.dto.TokenResponse
import com.geovannycode.auth.dto.UserResponse
import com.geovannycode.auth.entity.RefreshToken
import com.geovannycode.auth.entity.User
import com.geovannycode.auth.repository.RefreshTokenRepository
import com.geovannycode.auth.repository.UserRepository
import com.geovannycode.auth.security.JwtService
import com.geovannycode.shared.constant.Role
import com.geovannycode.shared.dto.UserRegisteredEvent
import com.geovannycode.shared.exception.AuthenticationException
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import com.geovannycode.shared.exception.ResourceNotFoundException
import com.geovannycode.shared.util.generateUUID
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
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
    private val rabbitTemplate: RabbitTemplate
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Registra un nuevo usuario
     */
    @Transactional
    fun register(request: RegisterRequest, ipAddress: String? = null): AuthResponse {
        logger.info("Intentando registrar usuario: ${request.email}")

        // Verificar si el email ya existe
        if (userRepository.existsByEmail(request.email)) {
            throw ResourceAlreadyExistsException("Usuario", "email", request.email)
        }

        // Crear usuario
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

        // Generar tokens
        val authResponse = generateAuthResponse(savedUser, ipAddress)

        // Publicar evento
        publishUserRegisteredEvent(savedUser)

        return authResponse
    }

    /**
     * Autentica un usuario existente
     */
    @Transactional
    fun login(request: LoginRequest, ipAddress: String? = null): AuthResponse {
        logger.info("Intento de login: ${request.email}")

        val user = userRepository.findByEmail(request.email.lowercase())
            .orElseThrow { AuthenticationException("Credenciales inválidas") }

        // Verificar si está activo
        if (!user.active) {
            throw AuthenticationException("Cuenta desactivada")
        }

        // Verificar contraseña
        if (!passwordEncoder.matches(request.password, user.password)) {
            throw AuthenticationException("Credenciales inválidas")
        }

        logger.info("Login exitoso: ${user.id}")
        return generateAuthResponse(user, ipAddress)
    }

    /**
     * Refresca los tokens usando el refresh token
     */
    @Transactional
    fun refreshToken(request: RefreshTokenRequest, ipAddress: String? = null): TokenResponse {
        val refreshToken = refreshTokenRepository.findByToken(request.refreshToken)
            .orElseThrow { AuthenticationException("Refresh token inválido") }

        // Validar token
        if (!refreshToken.isValid) {
            throw AuthenticationException("Refresh token expirado o revocado")
        }

        // Revocar el token actual (rotación de tokens)
        refreshToken.revoke()
        refreshTokenRepository.save(refreshToken)

        // Generar nuevos tokens
        val user = refreshToken.user
        val newAccessToken = jwtService.generateAccessToken(user)
        val newRefreshToken = createRefreshToken(user, ipAddress)

        return TokenResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken.token,
            expiresIn = jwtService.getAccessTokenExpirationSeconds()
        )
    }

    /**
     * Cierra sesión revocando todos los refresh tokens del usuario
     */
    @Transactional
    fun logout(userId: Long) {
        logger.info("Cerrando sesión de usuario: $userId")
        refreshTokenRepository.revokeAllByUserId(userId)
    }

    // ============== Métodos privados ==============

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
            rabbitTemplate.convertAndSend("user.exchange", "user.registered", event)
            logger.debug("Evento UserRegistered publicado para: ${user.id}")
        } catch (e: Exception) {
            logger.error("Error publicando evento UserRegistered: ${e.message}")
            // No fallar el registro por error en mensajería
        }
    }
}