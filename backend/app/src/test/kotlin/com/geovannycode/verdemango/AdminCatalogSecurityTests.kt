package com.geovannycode.verdemango

import com.geovannycode.verdemango.catalog.service.CategoryService
import com.geovannycode.verdemango.catalog.web.AdminCategoryController
import com.geovannycode.verdemango.common.config.SecurityConfig
import com.geovannycode.verdemango.common.security.JwtAuthenticationFilter
import com.geovannycode.verdemango.common.security.JwtProperties
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AdminCategoryController::class)
@Import(SecurityConfig::class, JwtAuthenticationFilter::class)
@EnableConfigurationProperties(JwtProperties::class)
class AdminCatalogSecurityTests {
    @Autowired lateinit var mvc: MockMvc
    @MockitoBean lateinit var categories: CategoryService

    @Test fun adminAndSuperAdminCanReadCatalog() {
        `when`(categories.getAllAdmin(null, null)).thenReturn(emptyList())
        for (role in listOf("ADMIN", "SUPER_ADMIN")) {
            mvc.perform(get("/api/v1/admin/categories").with(user("test").roles(role)))
                .andExpect(status().isOk)
        }
    }
    @Test fun customerCannotReadAdminCatalog() {
        mvc.perform(get("/api/v1/admin/categories").with(user("test").roles("CUSTOMER")))
            .andExpect(status().isForbidden)
    }
}
