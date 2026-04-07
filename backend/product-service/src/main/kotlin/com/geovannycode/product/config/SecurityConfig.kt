package com.geovannycode.product.config

import com.geovannycode.product.security.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
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
                    // Endpoints públicos de lectura
                    .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()

                    // Swagger/OpenAPI
                    .requestMatchers(
                        "/swagger-ui/**",
                        "/api-docs/**",
                        "/swagger-ui.html"
                    ).permitAll()

                    // Actuator
                    .requestMatchers("/actuator/health").permitAll()

                    // Admin endpoints
                    .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                    // Ratings - crear requiere autenticación
                    .requestMatchers(HttpMethod.POST, "/api/v1/products/*/ratings").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/v1/products/*/ratings/*").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/v1/products/*/ratings/*").authenticated()

                    // Todo lo demás requiere autenticación
                    .anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }
}