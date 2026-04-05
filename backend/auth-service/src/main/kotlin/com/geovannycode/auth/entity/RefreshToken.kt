package com.geovannycode.auth.entity

import java.time.Instant
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

/**
 * Token de refresco para renovación de JWT.
 */
@Entity
@Table(
    name = "refresh_tokens",
    indexes = [
        Index(name = "idx_refresh_tokens_token", columnList = "token", unique = true),
        Index(name = "idx_refresh_tokens_user_id", columnList = "user_id")
    ]
)
class RefreshToken(
    @Column(name = "token", nullable = false, unique = true, length = 500)
    val token: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "device_info", length = 500)
    val deviceInfo: String? = null,

    @Column(name = "ip_address", length = 45)
    val ipAddress: String? = null,

    @Column(name = "revoked", nullable = false)
    var revoked: Boolean = false
) : BaseEntity() {

    val isExpired: Boolean
        get() = Instant.now().isAfter(expiresAt)

    val isValid: Boolean
        get() = !revoked && !isExpired

    fun revoke() {
        this.revoked = true
    }
}