package com.geovannycode.recipe.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun openAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("Verde Mango - Recipe Service API")
                    .description("API del servicio de recetas veganas")
                    .version("1.0.0")
                    .contact(
                        Contact()
                            .name("Verde Mango")
                            .url("https://verdemango.com")
                    )
            )
            .schemaRequirement(
                "bearerAuth",
                SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
            )
    }
}