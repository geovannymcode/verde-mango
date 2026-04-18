package com.geovannycode.order.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable

@Embeddable
data class Address(

    @Column(name = "recipient_name", nullable = false, length = 200)
    val recipientName: String,

    @Column(name = "phone", nullable = false, length = 20)
    val phone: String,

    @Column(name = "street_address", nullable = false, length = 500)
    val streetAddress: String,

    @Column(name = "apartment", length = 100)
    val apartment: String? = null,

    @Column(name = "city", nullable = false, length = 100)
    val city: String,

    @Column(name = "state", length = 100)
    val state: String? = null,

    @Column(name = "postal_code", length = 20)
    val postalCode: String? = null,

    @Column(name = "country", nullable = false, length = 100)
    val country: String = "Colombia",

    @Column(name = "instructions", columnDefinition = "TEXT")
    val instructions: String? = null

) {
    val formatted: String
        get() = buildString {
            append(streetAddress)
            apartment?.let { append(", $it") }
            append(", $city")
            state?.let { append(", $it") }
            postalCode?.let { append(" $it") }
            append(", $country")
        }

    companion object {
        fun empty() = Address(
            recipientName = "",
            phone = "",
            streetAddress = "",
            city = "",
            country = "Colombia"
        )
    }
}