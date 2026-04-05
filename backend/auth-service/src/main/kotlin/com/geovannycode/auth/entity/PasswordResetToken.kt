package com.geovannycode.auth.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

/**
 * Token para funcionalidad de recuperación de contraseña.
 *
 * Flujo de uso:
 * 1. Usuario solicita reset -> se genera token y se envía por email
 * 2. Usuario hace clic en link con token -> se valida token
 * 3. Usuario ingresa nueva contraseña -> token se marca como usado
 *
 * Consideraciones de seguridad:
 * - Token expira en 1 hora (configurable)
 * - Token de un solo uso (se marca como usado después de reset)
 * - Tokens anteriores del mismo usuario se invalidan al crear uno nuevo
 */
@Entity
@Table(
    name = "password_reset_tokens",
    indexes = [
        Index(name = "idx_password_reset_token", columnList = "token", unique = true),
        Index(name = "idx_password_reset_user_id", columnList = "user_id"),
        Index(name = "idx_password_reset_expires_at", columnList = "expires_at")
    ]
)
class PasswordResetToken(

    @Column(name = "token", nullable = false, unique = true, length = 255)
    val token: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "used", nullable = false)
    var used: Boolean = false

) : BaseEntity() {

    /**
     * Verifica si el token ha expirado
     */
    val isExpired: Boolean
        get() = Instant.now().isAfter(expiresAt)

    /**
     * Verifica si el token es válido (no usado y no expirado)
     */
    val isValid: Boolean
        get() = !used && !isExpired

    /**
     * Tiempo restante antes de expiración en segundos.
     * Retorna 0 si ya expiró.
     */
    val remainingTimeSeconds: Long
        get() {
            val remaining = expiresAt.epochSecond - Instant.now().epochSecond
            return if (remaining > 0) remaining else 0
        }

    /**
     * Marca el token como usado después de un reset exitoso.
     *
     * @throws IllegalStateException si el token ya fue usado o expiró
     */
    fun markAsUsed() {
        check(!used) { "Token ya fue utilizado" }
        check(!isExpired) { "Token ha expirado" }
        this.used = true
    }

    /**
     * Valida el token y lanza excepción si no es válido.
     * Útil para validación en el service layer.
     *
     * @throws IllegalStateException si el token no es válido
     */
    fun validate() {
        check(!used) { "Token ya fue utilizado" }
        check(!isExpired) { "Token ha expirado" }
    }

    override fun toString(): String =
        "PasswordResetToken(id=$id, userId=${user.id}, used=$used, expired=$isExpired, expiresAt=$expiresAt)"

    companion object {
        /**
         * Duración por defecto del token: 1 hora
         */
        const val DEFAULT_EXPIRATION_HOURS = 1L

        /**
         * Factory method para crear un nuevo token de reset.
         *
         * @param token Token generado (UUID o similar)
         * @param user Usuario que solicita el reset
         * @param expirationHours Horas hasta expiración (default: 1 hora)
         * @return Nueva instancia de PasswordResetToken
         */
        fun create(
            token: String,
            user: User,
            expirationHours: Long = DEFAULT_EXPIRATION_HOURS
        ): PasswordResetToken = PasswordResetToken(
            token = token,
            user = user,
            expiresAt = Instant.now().plusSeconds(expirationHours * 3600)
        )
    }
}