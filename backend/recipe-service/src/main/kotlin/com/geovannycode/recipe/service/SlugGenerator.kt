package com.geovannycode.recipe.service

import org.springframework.stereotype.Component
import java.text.Normalizer
import java.util.UUID

@Component
class SlugGenerator {

    /**
     * Genera un slug único a partir de un texto.
     * "Bibimbap Vegano con Kimchi" → "bibimbap-vegano-con-kimchi"
     */
    fun generate(text: String): String {
        val normalized = Normalizer.normalize(text.lowercase(), Normalizer.Form.NFD)
            .replace(Regex("[\\p{InCombiningDiacriticalMarks}]"), "") // Quitar acentos
            .replace(Regex("[^a-z0-9\\s-]"), "") // Solo alfanuméricos, espacios y guiones
            .trim()
            .replace(Regex("\\s+"), "-") // Espacios a guiones
            .replace(Regex("-+"), "-") // Múltiples guiones a uno
            .take(200) // Limitar longitud

        return normalized.ifEmpty { UUID.randomUUID().toString().take(8) }
    }

    /**
     * Genera un slug único verificando que no exista.
     * Si existe, añade un sufijo numérico.
     */
    fun generateUnique(text: String, existsCheck: (String) -> Boolean): String {
        val baseSlug = generate(text)

        if (!existsCheck(baseSlug)) {
            return baseSlug
        }

        var counter = 1
        var candidateSlug: String
        do {
            candidateSlug = "$baseSlug-$counter"
            counter++
        } while (existsCheck(candidateSlug) && counter < 100)

        return candidateSlug
    }
}