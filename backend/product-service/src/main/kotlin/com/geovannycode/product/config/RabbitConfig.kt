package com.geovannycode.product.config

import com.geovannycode.shared.constant.MessagingConstants
import org.springframework.amqp.core.QueueBuilder
import org.springframework.amqp.core.TopicExchange
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.amqp.support.converter.MessageConverter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.amqp.core.Queue
import org.springframework.amqp.core.Binding
import org.springframework.amqp.core.BindingBuilder

@Configuration
class RabbitConfig {

    // ============== Message Converter ==============

    @Bean
    fun messageConverter(): MessageConverter = Jackson2JsonMessageConverter()

    @Bean
    fun rabbitTemplate(
        connectionFactory: ConnectionFactory,
        messageConverter: MessageConverter
    ): RabbitTemplate {
        return RabbitTemplate(connectionFactory).apply {
            this.messageConverter = messageConverter
        }
    }

    // ============== Product Exchange ==============

    @Bean
    fun productExchange(): TopicExchange =
        TopicExchange(MessagingConstants.PRODUCT_EXCHANGE)

    // Queue para notificaciones de stock bajo
    @Bean
    fun lowStockQueue(): Queue =
        QueueBuilder.durable("product.stock.low.queue")
            .withArgument("x-dead-letter-exchange", "dlx.exchange")
            .build()

    @Bean
    fun lowStockBinding(): Binding =
        BindingBuilder
            .bind(lowStockQueue())
            .to(productExchange())
            .with(MessagingConstants.PRODUCT_STOCK_LOW)

    // ============== Order Exchange (para consumir eventos) ==============

    @Bean
    fun orderExchange(): TopicExchange =
        TopicExchange(MessagingConstants.ORDER_EXCHANGE)

    // Queue para recibir eventos de órdenes (actualizar stock)
    @Bean
    fun orderPaidQueue(): Queue =
        QueueBuilder.durable("product.order.paid.queue")
            .withArgument("x-dead-letter-exchange", "dlx.exchange")
            .build()

    @Bean
    fun orderPaidBinding(): Binding =
        BindingBuilder
            .bind(orderPaidQueue())
            .to(orderExchange())
            .with(MessagingConstants.ORDER_PAID)

    @Bean
    fun orderCancelledQueue(): Queue =
        QueueBuilder.durable("product.order.cancelled.queue")
            .withArgument("x-dead-letter-exchange", "dlx.exchange")
            .build()

    @Bean
    fun orderCancelledBinding(): Binding =
        BindingBuilder
            .bind(orderCancelledQueue())
            .to(orderExchange())
            .with(MessagingConstants.ORDER_CANCELLED)
}