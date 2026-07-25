package com.geovannycode.verdemango.auth.web

import com.geovannycode.verdemango.auth.domain.User
import com.geovannycode.verdemango.common.domain.Role
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

// ==================== REQUEST DTOs ====================

data class RegisterRequest(
    @field:NotBlank(message = "Email es requerido")
    @field:Email(message = "Formato de email invalido")
    val email: String,

    @field:NotBlank(message = "Contrasena es requerida")
    @field:Size(min = 8, max = 100, message = "Contrasena debe tener entre 8 y 100 caracteres")
    @field:Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Contrasena debe contener al menos una minuscula, una mayuscula y un digito"
    )
    val password: String,

    @field:NotBlank(message = "Nombre es requerido")
    @field:Size(min = 2, max = 100)
    val firstName: String,

    @field:NotBlank(message = "Apellido es requerido")
    @field:Size(min = 2, max = 100)
    val lastName: String,

    @field:Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Numero de telefono invalido")
    val phone: String? = null
)

data class LoginRequest(
    @field:NotBlank(message = "Email es requerido")
    @field:Email(message = "Formato de email invalido")
    val email: String,

    @field:NotBlank(message = "Contrasena es requerida")
    val password: String
)

data class RefreshTokenRequest(
    @field:NotBlank(message = "Refresh token es requerido")
    val refreshToken: String
)

data class ChangePasswordRequest(
    @field:NotBlank(message = "Contrasena actual es requerida")
    val currentPassword: String,

    @field:NotBlank(message = "Nueva contrasena es requerida")
    @field:Size(min = 8, max = 100)
    @field:Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Contrasena debe contener al menos una minuscula, una mayuscula y un digito"
    )
    val newPassword: String
)

data class UpdateProfileRequest(
    @field:Size(min = 2, max = 100)
    val firstName: String? = null,

    @field:Size(min = 2, max = 100)
    val lastName: String? = null,

    @field:Pattern(regexp = "^\\+?[0-9]{7,15}$")
    val phone: String? = null,

    val avatarUrl: String? = null
)

// ==================== RESPONSE DTOs ====================

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
)

data class UserResponse(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val phone: String?,
    val role: Role,
    val emailVerified: Boolean,
    val avatarUrl: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(user: User) = UserResponse(
            id = user.id,
            email = user.email,
            firstName = user.firstName,
            lastName = user.lastName,
            fullName = user.fullName,
            phone = user.phone,
            role = user.role,
            emailVerified = user.emailVerified,
            avatarUrl = user.avatarUrl,
            createdAt = user.createdAt
        )
    }
}

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long
)
