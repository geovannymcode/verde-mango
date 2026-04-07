package com.geovannycode.product.config

import com.fasterxml.jackson.annotation.JsonAutoDetect
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.PropertyAccessor
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.cache.RedisCacheManager
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import java.time.Duration

/**
 * Configuración de Redis Cache.
 *
 * Usa un [ObjectMapper] dedicado con soporte para tipos de Java 8 (Instant,
 * LocalDateTime, etc.) vía [JavaTimeModule]. Spring Boot auto-registra este
 * módulo en el mapper principal de Spring MVC, pero el mapper interno del
 * [GenericJackson2JsonRedisSerializer] es independiente y debe configurarse
 * manualmente.
 */
@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun cacheManager(connectionFactory: RedisConnectionFactory): RedisCacheManager {
        val serializer = GenericJackson2JsonRedisSerializer(buildRedisObjectMapper())

        val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(serializer)
            )
            .disableCachingNullValues()

        val cacheConfigurations = mapOf(
            "products" to defaultConfig.entryTtl(Duration.ofMinutes(30)),
            "categories" to defaultConfig.entryTtl(Duration.ofHours(2)),
            "featured" to defaultConfig.entryTtl(Duration.ofMinutes(15))
        )

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build()
    }

    /**
     * Construye un ObjectMapper configurado para serialización en Redis.
     *
     * - [JavaTimeModule]: soporte para Instant, LocalDateTime, etc.
     * - [KotlinModule]: soporte para data classes, nullables y constructores de Kotlin.
     * - `WRITE_DATES_AS_TIMESTAMPS = false`: serializa fechas como ISO-8601
     *   strings (ej: "2026-04-07T03:43:10.642161Z") en lugar de epoch millis.
     *   Más legible al inspeccionar Redis con redis-cli.
     * - Default typing activado: Redis necesita guardar el tipo concreto para
     *   poder deserializar polimórficamente al leer.
     */
    private fun buildRedisObjectMapper(): ObjectMapper {
        val polymorphicValidator = BasicPolymorphicTypeValidator.builder()
            .allowIfSubType("com.geovannycode.")
            .allowIfSubType("java.util.")
            .allowIfSubType("java.time.")
            .allowIfSubType("java.math.")
            .build()

        return ObjectMapper()
            .registerModule(JavaTimeModule())
            .registerModule(KotlinModule.Builder().build())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY)
            .activateDefaultTyping(
                polymorphicValidator,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
            )
    }
}