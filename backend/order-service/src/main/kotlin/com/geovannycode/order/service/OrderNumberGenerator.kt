package com.geovannycode.order.service

import com.geovannycode.order.repository.OrderRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.concurrent.atomic.AtomicInteger

@Component
class OrderNumberGenerator(
    private val orderRepository: OrderRepository,
    @Value("\${order.number-prefix:VM}")
    private val prefix: String
) {
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd")
    private var currentDate: String = ""
    private var sequence = AtomicInteger(0)

    @Synchronized
    fun generate(): String {
        val today = LocalDate.now().format(dateFormatter)

        if (today != currentDate) {
            currentDate = today
            sequence.set(0)
        }

        val seq = sequence.incrementAndGet()
        val orderNumber = "$prefix-$today-${seq.toString().padStart(4, '0')}"

        // Verificar unicidad (en caso de reinicio del servicio)
        return if (orderRepository.existsByOrderNumber(orderNumber)) {
            generate() // Recursivo si ya existe
        } else {
            orderNumber
        }
    }
}