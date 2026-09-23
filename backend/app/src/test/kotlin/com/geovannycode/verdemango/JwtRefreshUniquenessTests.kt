package com.geovannycode.verdemango

import com.geovannycode.verdemango.auth.domain.User
import com.geovannycode.verdemango.auth.service.JwtService
import com.geovannycode.verdemango.common.security.JwtProperties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class JwtRefreshUniquenessTests {
    @Test fun tokensIssuedInTheSameSecondAreUnique() {
        val service = JwtService(JwtProperties(secret = "test-secret-".repeat(8), issuer = "test"))
        val user = User("qa@example.test", "unused", "Prueba", "Token")
        val tokens = (1..50).map { service.generateRefreshToken(user) }
        assertEquals(50, tokens.distinct().size)
    }
}
