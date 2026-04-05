package com.geovannycode.auth.repository

import com.geovannycode.auth.entity.RefreshToken
import com.geovannycode.auth.entity.User
import com.geovannycode.shared.constant.Role
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmail(email: String): Optional<User>
    fun existsByEmail(email: String): Boolean
    fun findByRole(role: Role, pageable: Pageable): Page<User>
    fun findByActiveTrue(pageable: Pageable): Page<User>

    @Query("""
        SELECT u FROM User u 
        WHERE u.active = true 
        AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    fun searchUsers(search: String, pageable: Pageable): Page<User>

    @Modifying
    @Query("UPDATE User u SET u.active = false WHERE u.id = :userId")
    fun deactivateUser(userId: Long): Int
}

@Repository
interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {
    fun findByToken(token: String): Optional<RefreshToken>
    fun findByUserIdAndRevokedFalse(userId: Long): List<RefreshToken>

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user.id = :userId")
    fun revokeAllByUserId(userId: Long): Int

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now OR rt.revoked = true")
    fun deleteExpiredAndRevoked(now: Instant): Int
}

@Repository
interface PasswordResetTokenRepository : JpaRepository<PasswordResetToken, Long> {
    fun findByToken(token: String): Optional<PasswordResetToken>

    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true WHERE prt.user.id = :userId AND prt.used = false")
    fun invalidateAllByUserId(userId: Long): Int

    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiresAt < :now OR prt.used = true")
    fun deleteExpiredAndUsed(now: Instant): Int
}