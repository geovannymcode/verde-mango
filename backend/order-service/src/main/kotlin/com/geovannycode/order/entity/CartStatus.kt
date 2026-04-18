package com.geovannycode.order.entity

enum class CartStatus {
    ACTIVE,      // Carrito activo
    MERGED,      // Fusionado con carrito de usuario
    CONVERTED,   // Convertido a orden
    ABANDONED,   // Abandonado
    EXPIRED      // Expirado
}