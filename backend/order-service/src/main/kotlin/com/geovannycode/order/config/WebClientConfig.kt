package com.geovannycode.order.config

import io.netty.channel.ChannelOption
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import java.time.Duration

@Configuration
class WebClientConfig(
    @Value("\${services.product-service.url}")
    private val productServiceUrl: String,
    @Value("\${services.product-service.timeout:5000}")
    private val productServiceTimeout: Long,
    @Value("\${services.payment-service.url}")
    private val paymentServiceUrl: String,
    @Value("\${services.payment-service.timeout:10000}")
    private val paymentServiceTimeout: Long
) {

    @Bean
    fun productServiceWebClient(): WebClient {
        val httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, productServiceTimeout.toInt())
            .responseTimeout(Duration.ofMillis(productServiceTimeout))

        return WebClient.builder()
            .baseUrl(productServiceUrl)
            .clientConnector(ReactorClientHttpConnector(httpClient))
            .build()
    }

    @Bean
    fun paymentServiceWebClient(): WebClient {
        val httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, paymentServiceTimeout.toInt())
            .responseTimeout(Duration.ofMillis(paymentServiceTimeout))

        return WebClient.builder()
            .baseUrl(paymentServiceUrl)
            .clientConnector(ReactorClientHttpConnector(httpClient))
            .build()
    }
}