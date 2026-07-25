package com.geovannycode.verdemango.common.security

import com.geovannycode.verdemango.common.domain.Role

/**
 * Principal simplificado para el contexto de seguridad.
 * Almacena los datos esenciales del usuario autenticado extraidos del JWT.
 */
data class UserPrincipal(
    val id: Long,
    val email: String,
    val role: Role,
    val name: String? = null
)
