package com.geovannycode.order.entity

import com.geovannycode.shared.constant.OrderStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant

@Entity
@Table(name = "order_status_history")
class OrderStatusHistory(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    var order: Order? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    val fromStatus: OrderStatus?,

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    val toStatus: OrderStatus,

    @Column(name = "comment", columnDefinition = "TEXT")
    val comment: String? = null,

    @Column(name = "changed_by_user_id")
    val changedByUserId: Long? = null,

    @Column(name = "changed_by_type", nullable = false, length = 20)
    val changedByType: String = "SYSTEM",

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    val metadata: Map<String, Any>? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    val description: String
        get() = buildString {
            append("Estado cambiado")
            fromStatus?.let { append(" de $it") }
            append(" a $toStatus")
            comment?.let { append(": $it") }
        }
}