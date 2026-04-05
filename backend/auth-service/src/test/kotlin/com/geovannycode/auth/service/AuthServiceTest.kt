package com.geovannycode.auth.service

import com.geovannycode.auth.dto.LoginRequest
import com.geovannycode.auth.dto.RegisterRequest
import com.geovannycode.auth.entity.User
import com.geovannycode.auth.repository.RefreshTokenRepository
import com.geovannycode.auth.repository.UserRepository
import com.geovannycode.auth.security.JwtService
import com.geovannycode.shared.constant.Role
import com.geovannycode.shared.exception.AuthenticationException
import com.geovannycode.shared.exception.ResourceAlreadyExistsException
import io.mockk.Runs
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.just
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.Optional

@ExtendWith(MockKExtension::class)
class AuthServiceTest {

    @MockK
    private lateinit var userRepository: UserRepository

    @MockK
    private lateinit var refreshTokenRepository: RefreshTokenRepository

    @MockK
    private lateinit var passwordEncoder: PasswordEncoder

    @MockK
    private lateinit var jwtService: JwtService

    @MockK
    private lateinit var rabbitTemplate: RabbitTemplate

    @InjectMockKs
    private lateinit var authService: AuthService

    @BeforeEach
    fun setup() {
        // Configuración común para los mocks
        every { rabbitTemplate.convertAndSend(any(), any(), any<Any>()) } just Runs
    }

    @Test
    fun `register should create user and return auth response`() {
        // Given
        val request = RegisterRequest(
            email = "test@example.com",
            password = "Password123",
            firstName = "Test",
            lastName = "User"
        )
        val encodedPassword = "encoded_password"
        val savedUser = createTestUser(1L, request.email)

        every { userRepository.existsByEmail(request.email.lowercase()) } returns false
        every { passwordEncoder.encode(request.password) } returns encodedPassword
        every { userRepository.save(any()) } returns savedUser
        every { jwtService.generateAccessToken(savedUser) } returns "access_token"
        every { jwtService.generateRefreshToken(savedUser) } returns "refresh_token"
        every { jwtService.getAccessTokenExpirationSeconds() } returns 900L
        every { jwtService.getRefreshTokenExpirationMillis() } returns 604800000L
        every { refreshTokenRepository.save(any()) } answers { firstArg() }

        // When
        val result = authService.register(request)

        // Then
        assertThat(result.accessToken).isEqualTo("access_token")
        assertThat(result.user.email).isEqualTo(request.email.lowercase())
        verify { userRepository.save(any()) }
    }

    @Test
    fun `register should throw exception when email exists`() {
        // Given
        val request = RegisterRequest(
            email = "existing@example.com",
            password = "Password123",
            firstName = "Test",
            lastName = "User"
        )

        every { userRepository.existsByEmail(request.email.lowercase()) } returns true

        // When/Then
        assertThatThrownBy { authService.register(request) }
            .isInstanceOf(ResourceAlreadyExistsException::class.java)
            .hasMessageContaining("email")
    }

    @Test
    fun `login should return auth response for valid credentials`() {
        // Given
        val request = LoginRequest(email = "test@example.com", password = "Password123")
        val user = createTestUser(1L, request.email)

        every { userRepository.findByEmail(request.email.lowercase()) } returns Optional.of(user)
        every { passwordEncoder.matches(request.password, user.password) } returns true
        every { jwtService.generateAccessToken(user) } returns "access_token"
        every { jwtService.generateRefreshToken(user) } returns "refresh_token"
        every { jwtService.getAccessTokenExpirationSeconds() } returns 900L
        every { jwtService.getRefreshTokenExpirationMillis() } returns 604800000L
        every { refreshTokenRepository.save(any()) } answers { firstArg() }

        // When
        val result = authService.login(request)

        // Then
        assertThat(result.accessToken).isEqualTo("access_token")
        assertThat(result.user.email).isEqualTo(request.email)
    }

    @Test
    fun `login should throw exception for invalid password`() {
        // Given
        val request = LoginRequest(email = "test@example.com", password = "wrong")
        val user = createTestUser(1L, request.email)

        every { userRepository.findByEmail(request.email.lowercase()) } returns Optional.of(user)
        every { passwordEncoder.matches(request.password, user.password) } returns false

        // When/Then
        assertThatThrownBy { authService.login(request) }
            .isInstanceOf(AuthenticationException::class.java)
            .hasMessageContaining("inválidas")
    }

    // Helper method
    private fun createTestUser(id: Long, email: String): User {
        val user = User(
            email = email,
            passwordHash = "hashed_password",
            firstName = "Test",
            lastName = "User",
            role = Role.CUSTOMER
        )
        // Usar reflexión para setear el ID (ya que es val)
        val idField = user.javaClass.superclass.getDeclaredField("id")
        idField.isAccessible = true
        idField.set(user, id)
        return user
    }
}