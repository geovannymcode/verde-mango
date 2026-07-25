package com.geovannycode.verdemango.common.config

import com.geovannycode.verdemango.common.security.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    // Auth - public
                    .requestMatchers(
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/password/reset",
                        "/api/v1/auth/password/reset/confirm"
                    ).permitAll()
                    // Catalog - public reads
                    .requestMatchers(
                        "GET", "/api/v1/products/**",
                        "/api/v1/categories/**"
                    ).permitAll()
                    // Cart - allow guest access (session-based)
                    .requestMatchers("/api/v1/cart/**").permitAll()
                    // Recipes - public reads
                    .requestMatchers("GET", "/api/v1/recipes/**").permitAll()
                    // Swagger/OpenAPI
                    .requestMatchers(
                        "/swagger-ui/**",
                        "/api-docs/**",
                        "/swagger-ui.html"
                    ).permitAll()
                    // Actuator
                    .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    // Admin endpoints
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    // Everything else requires authentication
                    .anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager =
        config.authenticationManager
}
