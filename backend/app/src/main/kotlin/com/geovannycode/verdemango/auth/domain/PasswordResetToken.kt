package com.geovannycode.verdemango.auth.domain

import com.geovannycode.verdemango.common.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

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

    val isExpired: Boolean
        get() = Instant.now().isAfter(expiresAt)

    val isValid: Boolean
        get() = !used && !isExpired

    val remainingTimeSeconds: Long
        get() {
            val remaining = expiresAt.epochSecond - Instant.now().epochSecond
            return if (remaining > 0) remaining else 0
        }

    fun markAsUsed() {
        check(!used) { "Token ya fue utilizado" }
        check(!isExpired) { "Token ha expirado" }
        this.used = true
    }

    fun validate() {
        check(!used) { "Token ya fue utilizado" }
        check(!isExpired) { "Token ha expirado" }
    }

    override fun toString(): String =
        "PasswordResetToken(id=$id, userId=${user.id}, used=$used, expired=$isExpired, expiresAt=$expiresAt)"

    companion object {
        const val DEFAULT_EXPIRATION_HOURS = 1L

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
