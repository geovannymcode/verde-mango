package com.geovannycode.order.service

import com.geovannycode.order.entity.CartStatus
import com.geovannycode.order.repository.CartRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class CartCleanupService(
    private val cartRepository: CartRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Limpia carritos expirados cada hora
     */
    @Scheduled(fixedRate = 3600000) // 1 hora
    @Transactional
    fun cleanupExpiredCarts() {
        val now = Instant.now()
        val count = cartRepository.markExpiredCarts(now, CartStatus.ACTIVE, CartStatus.EXPIRED)

        if (count > 0) {
            logger.info("$count carritos marcados como expirados")
        }
    }
}