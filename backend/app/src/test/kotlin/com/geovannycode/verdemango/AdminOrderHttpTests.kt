package com.geovannycode.verdemango

import com.geovannycode.verdemango.common.config.SecurityConfig
import com.geovannycode.verdemango.common.domain.OrderStatus
import com.geovannycode.verdemango.common.domain.OrderTransitionConflict
import com.geovannycode.verdemango.common.domain.Role
import com.geovannycode.verdemango.common.security.JwtAuthenticationFilter
import com.geovannycode.verdemango.common.security.JwtProperties
import com.geovannycode.verdemango.common.security.UserPrincipal
import com.geovannycode.verdemango.orders.service.OrderService
import com.geovannycode.verdemango.orders.web.AdminOrderController
import com.geovannycode.verdemango.orders.web.UpdateOrderStatusRequest
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AdminOrderController::class)
@Import(SecurityConfig::class, JwtAuthenticationFilter::class)
@EnableConfigurationProperties(JwtProperties::class)
class AdminOrderHttpTests {
    @Autowired lateinit var mvc: MockMvc
    @MockitoBean lateinit var service: OrderService
    private fun principal(role: Role) = authentication(UsernamePasswordAuthenticationToken(
        UserPrincipal(7, "qa@example.test", role), null, listOf(SimpleGrantedAuthority("ROLE_${role.name}"))))

    @Test fun conflictReturnsTheServerMessageForBothAdminRoles() {
        val request = UpdateOrderStatusRequest(OrderStatus.SHIPPED, "Nota")
        doThrow(OrderTransitionConflict("Transición de estado inválida: CANCELLED -> SHIPPED"))
            .`when`(service).updateOrderStatus(42, request, 7)
        for (role in listOf(Role.ADMIN, Role.SUPER_ADMIN)) {
            mvc.perform(patch("/api/v1/admin/orders/42/status").with(principal(role))
                .contentType(MediaType.APPLICATION_JSON).content("""{"status":"SHIPPED","comment":"Nota"}"""))
                .andExpect(status().isConflict)
                .andExpect(jsonPath("message").value("Transición de estado inválida: CANCELLED -> SHIPPED"))
        }
    }
    @Test fun rejectsTooLongNoteBeforeCallingService() {
        mvc.perform(patch("/api/v1/admin/orders/42/status").with(principal(Role.ADMIN))
            .contentType(MediaType.APPLICATION_JSON).content("""{"status":"SHIPPED","comment":"${"x".repeat(501)}"}"""))
            .andExpect(status().isBadRequest)
        verifyNoInteractions(service)
    }
    @Test fun customerCannotMutateAnOrderThroughAdmin() {
        mvc.perform(patch("/api/v1/admin/orders/42/status").with(principal(Role.CUSTOMER))
            .contentType(MediaType.APPLICATION_JSON).content("""{"status":"CANCELLED"}"""))
            .andExpect(status().isForbidden)
        verifyNoInteractions(service)
    }
}
