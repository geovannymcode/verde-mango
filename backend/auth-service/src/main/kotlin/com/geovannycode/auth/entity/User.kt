package com.geovannycode.auth.entity

import com.geovannycode.shared.constant.Role
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

/**
 * Entidad User que representa un usuario registrado.
 * Implementa UserDetails de Spring Security.
 */
@Entity
@Table(
    name = "users",
    indexes = [Index(name = "idx_users_email", columnList = "email", unique = true)]
)
class User(
    @Column(name = "email", nullable = false, unique = true, length = 255)
    val email: String,

    @Column(name = "password_hash", nullable = false)
    private var passwordHash: String,

    @Column(name = "first_name", nullable = false, length = 100)
    var firstName: String,

    @Column(name = "last_name", nullable = false, length = 100)
    var lastName: String,

    @Column(name = "phone", length = 20)
    var phone: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    var role: Role = Role.CUSTOMER,

    @Column(name = "email_verified", nullable = false)
    var emailVerified: Boolean = false,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "avatar_url")
    var avatarUrl: String? = null
) : BaseEntity(), UserDetails {

    // Propiedad computada
    val fullName: String
        get() = "$firstName $lastName"

    // Métodos de negocio
    fun updatePassword(newPasswordHash: String) {
        this.passwordHash = newPasswordHash
    }

    fun deactivate() {
        this.active = false
    }

    fun activate() {
        this.active = true
    }

    fun verifyEmail() {
        this.emailVerified = true
    }

    // Implementación de UserDetails
    override fun getAuthorities(): Collection<GrantedAuthority> =
        listOf(SimpleGrantedAuthority("ROLE_${role.name}"))

    override fun getPassword(): String = passwordHash

    override fun getUsername(): String = email

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = active

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = active

    override fun toString(): String =
        "User(id=$id, email='$email', role=$role, active=$active)"
}