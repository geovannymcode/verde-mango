package com.geovannycode.auth.controller

import com.geovannycode.auth.dto.AuthResponse
import com.geovannycode.auth.dto.LoginRequest
import com.geovannycode.auth.dto.RefreshTokenRequest
import com.geovannycode.auth.dto.RegisterRequest
import com.geovannycode.auth.dto.TokenResponse
import com.geovannycode.auth.dto.UserResponse
import com.geovannycode.auth.entity.User
import com.geovannycode.auth.service.AuthService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints de autenticación")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario")
    fun register(
        @Valid @RequestBody request: RegisterRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<AuthResponse>> {
        val ipAddress = getClientIp(httpRequest)
        val response = authService.register(request, ipAddress)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(response, "Usuario registrado exitosamente"))
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<AuthResponse>> {
        val ipAddress = getClientIp(httpRequest)
        val response = authService.login(request, ipAddress)
        return ResponseEntity.ok(ApiResponse.success(response, "Login exitoso"))
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refrescar tokens")
    fun refreshToken(
        @Valid @RequestBody request: RefreshTokenRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val ipAddress = getClientIp(httpRequest)
        val response = authService.refreshToken(request, ipAddress)
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión")
    fun logout(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<ApiResponse<Nothing>> {
        authService.logout(user.id)
        return ResponseEntity.ok(ApiResponse.success("Sesión cerrada exitosamente"))
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener usuario actual")
    fun getCurrentUser(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<ApiResponse<UserResponse>> {
        return ResponseEntity.ok(ApiResponse.success(UserResponse.from(user)))
    }

    // ============== Métodos privados ==============

    private fun getClientIp(request: HttpServletRequest): String? {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return if (!xForwardedFor.isNullOrBlank()) {
            xForwardedFor.split(",").first().trim()
        } else {
            request.remoteAddr
        }
    }
}