package com.geovannycode.order.config

import com.geovannycode.shared.constant.MessagingConstants
import org.springframework.amqp.core.Binding
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.Queue
import org.springframework.amqp.core.TopicExchange
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.amqp.support.converter.MessageConverter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class RabbitConfig {

    // Exchange para eventos de orden
    @Bean
    fun orderExchange(): TopicExchange = TopicExchange(MessagingConstants.ORDER_EXCHANGE)

    // Cola para órdenes creadas
    @Bean
    fun orderCreatedQueue(): Queue = Queue("order.created.queue", true)

    @Bean
    fun orderCreatedBinding(orderCreatedQueue: Queue, orderExchange: TopicExchange): Binding =
        BindingBuilder.bind(orderCreatedQueue).to(orderExchange).with(MessagingConstants.ORDER_CREATED)

    // Cola para órdenes pagadas
    @Bean
    fun orderPaidQueue(): Queue = Queue("order.paid.queue", true)

    @Bean
    fun orderPaidBinding(orderPaidQueue: Queue, orderExchange: TopicExchange): Binding =
        BindingBuilder.bind(orderPaidQueue).to(orderExchange).with(MessagingConstants.ORDER_PAID)

    // Cola para escuchar pagos completados
    @Bean
    fun paymentCompletedQueue(): Queue = Queue("payment.completed.order.queue", true)

    // 1. Registramos explícitamente el exchange como un Bean
    @Bean
    fun paymentExchange(): TopicExchange = TopicExchange(MessagingConstants.PAYMENT_EXCHANGE)

    // 2. Inyectamos el exchange en el binding
    @Bean
    fun paymentCompletedBinding(
        paymentCompletedQueue: Queue,
        paymentExchange: TopicExchange // <-- Inyectado aquí
    ): Binding =
        BindingBuilder.bind(paymentCompletedQueue)
            .to(paymentExchange)
            .with(MessagingConstants.PAYMENT_COMPLETED)

    @Bean
    fun messageConverter(): MessageConverter = Jackson2JsonMessageConverter()
}