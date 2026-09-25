package com.geovannycode.verdemango.orders.repository

import com.geovannycode.verdemango.orders.web.AdminPaymentSummary
import com.geovannycode.verdemango.orders.web.OrderFilterParams
import com.geovannycode.verdemango.common.domain.ValidationException
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository

/** Read model across persisted order/customer/payment records. No inferred gateway state. */
@Repository
class AdminOrderReadRepository(private val jdbc: NamedParameterJdbcTemplate) {
    private val joins = """
        FROM orders o LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN LATERAL (SELECT * FROM payments WHERE order_id = o.id
            ORDER BY created_at DESC, id DESC LIMIT 1) p ON true
    """.trimIndent()

    fun page(params: OrderFilterParams): Pair<List<Long>, Long> {
        if (params.page < 0 || params.size !in 1..100) throw ValidationException("Paginación inválida")
        if (params.fromDate != null && params.toDate != null && params.fromDate > params.toDate)
            throw ValidationException("La fecha inicial debe ser anterior a la final")
        val sort = when(params.sortBy) { "createdAt" -> "o.created_at"; "totalAmount" -> "o.total_amount"; else -> throw ValidationException("Ordenamiento inválido") }
        val direction = when(params.sortDir.lowercase()) { "asc" -> "ASC"; "desc" -> "DESC"; else -> throw ValidationException("Dirección inválida") }
        val values = mutableMapOf<String, Any>("limit" to params.size, "offset" to params.page.toLong() * params.size)
        val filters = mutableListOf<String>()
        val statuses = params.statuses?.takeIf { it.isNotEmpty() } ?: params.status?.let { listOf(it) }
        statuses?.let { filters += "o.status IN (:statuses)"; values["statuses"] = it.map { status -> status.name } }
        params.userId?.let { filters += "o.user_id = :userId"; values["userId"] = it }
        params.search?.takeIf { it.isNotBlank() }?.let {
            filters += "(o.order_number ILIKE :search OR o.user_email ILIKE :search)"; values["search"] = "%${it.trim()}%"
        }
        params.fromDate?.let { filters += "o.created_at >= :fromDate"; values["fromDate"] = java.sql.Timestamp.from(it) }
        params.toDate?.let { filters += "o.created_at <= :toDate"; values["toDate"] = java.sql.Timestamp.from(it) }
        params.paymentStatus?.let {
            if (it == "UNRECORDED") filters += "p.id IS NULL"
            else { filters += "p.status = :paymentStatus"; values["paymentStatus"] = it }
        }
        val where = if (filters.isEmpty()) "" else " WHERE " + filters.joinToString(" AND ")
        val count = jdbc.queryForObject("SELECT COUNT(*) $joins $where", values, Long::class.java) ?: 0
        val ids = jdbc.query("SELECT o.id $joins $where ORDER BY $sort $direction, o.id $direction LIMIT :limit OFFSET :offset", values) { rs, _ -> rs.getLong("id") }
        return ids to count
    }

    fun metadata(ids: List<Long>): Map<Long, AdminOrderMetadata> {
        if (ids.isEmpty()) return emptyMap()
        return jdbc.query("""SELECT o.id, o.user_email, o.billing_tax_id,
            NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '') AS customer_name, u.phone,
            p.reference, p.external_reference, p.payment_method, p.status AS payment_status,
            p.gateway, COALESCE(p.confirmed_at, p.processed_at) AS payment_date
            $joins WHERE o.id IN (:ids)""", mapOf("ids" to ids)) { rs, _ ->
            val reference = rs.getString("reference")
            rs.getLong("id") to AdminOrderMetadata(
                rs.getString("customer_name"), rs.getString("user_email"), rs.getString("phone"), rs.getString("billing_tax_id"),
                reference?.let { AdminPaymentSummary(it, rs.getString("external_reference"), rs.getString("payment_method"),
                    rs.getString("payment_status"), rs.getString("gateway"), rs.getTimestamp("payment_date")?.toInstant()) }
            )
        }.toMap()
    }
}
data class AdminOrderMetadata(val name: String?, val email: String, val phone: String?, val document: String?, val payment: AdminPaymentSummary?)
