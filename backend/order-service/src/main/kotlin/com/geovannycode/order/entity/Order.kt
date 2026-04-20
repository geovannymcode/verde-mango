package com.geovannycode.order.entity

import com.geovannycode.shared.constant.OrderStatus
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.time.Instant
import java.util.Locale

@Entity
@Table(name = "orders")
class Order(

    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    val orderNumber: String,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(name = "user_email", nullable = false, length = 255)
    val userEmail: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: OrderStatus = OrderStatus.PENDING,

    // Totales
    @Column(name = "subtotal", nullable = false)
    var subtotal: Long,

    @Column(name = "shipping_cost", nullable = false)
    var shippingCost: Long = 0,

    @Column(name = "tax_amount", nullable = false)
    var taxAmount: Long = 0,

    @Column(name = "discount_amount", nullable = false)
    var discountAmount: Long = 0,

    @Column(name = "total_amount", nullable = false)
    var totalAmount: Long,

    @Column(name = "item_count", nullable = false)
    var itemCount: Int = 0,

    // Dirección de envío (embebida)
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "recipientName", column = Column(name = "shipping_recipient_name")),
        AttributeOverride(name = "phone", column = Column(name = "shipping_phone")),
        AttributeOverride(name = "streetAddress", column = Column(name = "shipping_street_address")),
        AttributeOverride(name = "apartment", column = Column(name = "shipping_apartment")),
        AttributeOverride(name = "city", column = Column(name = "shipping_city")),
        AttributeOverride(name = "state", column = Column(name = "shipping_state")),
        AttributeOverride(name = "postalCode", column = Column(name = "shipping_postal_code")),
        AttributeOverride(name = "country", column = Column(name = "shipping_country")),
        AttributeOverride(name = "instructions", column = Column(name = "shipping_instructions"))
    )
    var shippingAddress: Address,

    // Facturación
    @Column(name = "billing_same_as_shipping", nullable = false)
    var billingSameAsShipping: Boolean = true,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "recipientName", column = Column(name = "billing_recipient_name")),
        AttributeOverride(name = "phone", column = Column(name = "billing_phone")),
        AttributeOverride(name = "streetAddress", column = Column(name = "billing_street_address")),
        AttributeOverride(name = "apartment", column = Column(name = "billing_apartment")),
        AttributeOverride(name = "city", column = Column(name = "billing_city")),
        AttributeOverride(name = "state", column = Column(name = "billing_state")),
        AttributeOverride(name = "postalCode", column = Column(name = "billing_postal_code")),
        AttributeOverride(name = "country", column = Column(name = "billing_country")),
        AttributeOverride(name = "instructions", column = Column(name = "billing_instructions"))
    )
    var billingAddress: Address? = null,

    @Column(name = "billing_tax_id", length = 50)
    var billingTaxId: String? = null,

    // Pago
    @Column(name = "payment_id")
    var paymentId: Long? = null,

    @Column(name = "payment_method", length = 50)
    var paymentMethod: String? = null,

    @Column(name = "payment_reference", length = 100)
    var paymentReference: String? = null,

    @Column(name = "paid_at")
    var paidAt: Instant? = null,

    // Envío
    @Column(name = "shipped_at")
    var shippedAt: Instant? = null,

    @Column(name = "delivered_at")
    var deliveredAt: Instant? = null,

    @Column(name = "tracking_number", length = 100)
    var trackingNumber: String? = null,

    @Column(name = "carrier", length = 100)
    var carrier: String? = null,

    // Cancelación
    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    var cancellationReason: String? = null,

    @Column(name = "refunded_at")
    var refundedAt: Instant? = null,

    @Column(name = "refund_amount")
    var refundAmount: Long? = null,

    // Notas
    @Column(name = "customer_notes", columnDefinition = "TEXT")
    var customerNotes: String? = null,

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    var internalNotes: String? = null,

    @Column(name = "cart_id")
    var cartId: Long? = null,

    // Relaciones
    @OneToMany(mappedBy = "order", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("id ASC")
    val items: MutableList<OrderItem> = mutableListOf(),

    @OneToMany(mappedBy = "order", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("createdAt DESC")
    val statusHistory: MutableList<OrderStatusHistory> = mutableListOf()

) : BaseEntity() {

    // ==================== Propiedades computadas ====================

    val canBeCancelled: Boolean get() = status.canTransitionTo(OrderStatus.CANCELLED)

    val canBeRefunded: Boolean get() = status.canTransitionTo(OrderStatus.REFUNDED) && paidAt != null

    val isPaid: Boolean get() = paidAt != null

    val isTerminal: Boolean get() = status in listOf(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED)

    val totalFormatted: String get() = "$${String.format(Locale.US, "%,d", totalAmount)}"

    // ==================== Métodos de negocio ====================

    fun addItem(item: OrderItem) {
        check(status == OrderStatus.PENDING) { "No se pueden agregar items a una orden confirmada" }
        item.order = this
        items.add(item)
        recalculateTotals()
    }

    fun updateStatus(
        newStatus: OrderStatus,
        comment: String? = null,
        changedBy: Long? = null,
        changedByType: String = "SYSTEM"
    ) {
        check(status.canTransitionTo(newStatus)) {
            "Transición de estado inválida: $status -> $newStatus"
        }

        val history = OrderStatusHistory(
            order = this,
            fromStatus = status,
            toStatus = newStatus,
            comment = comment,
            changedByUserId = changedBy,
            changedByType = changedByType
        )
        statusHistory.add(history)

        status = newStatus

        when (newStatus) {
            OrderStatus.CONFIRMED -> paidAt = paidAt ?: Instant.now()
            OrderStatus.SHIPPED -> shippedAt = Instant.now()
            OrderStatus.DELIVERED -> deliveredAt = Instant.now()
            OrderStatus.CANCELLED -> cancelledAt = Instant.now()
            OrderStatus.REFUNDED -> refundedAt = Instant.now()
            else -> {}
        }
    }

    fun confirmPayment(paymentId: Long, paymentMethod: String, paymentReference: String?) {
        check(status == OrderStatus.PENDING) { "La orden no está pendiente de pago" }
        this.paymentId = paymentId
        this.paymentMethod = paymentMethod
        this.paymentReference = paymentReference
        updateStatus(OrderStatus.CONFIRMED, "Pago confirmado - $paymentMethod", changedByType = "PAYMENT_WEBHOOK")
    }

    fun cancel(reason: String, cancelledBy: Long? = null) {
        check(canBeCancelled) { "La orden no puede ser cancelada en el estado actual: $status" }
        this.cancellationReason = reason
        updateStatus(OrderStatus.CANCELLED, reason, cancelledBy, if (cancelledBy != null) "USER" else "SYSTEM")
    }

    fun markAsShipped(trackingNumber: String?, carrier: String?, shippedBy: Long) {
        check(status == OrderStatus.PROCESSING) { "La orden no está en procesamiento" }
        this.trackingNumber = trackingNumber
        this.carrier = carrier
        val comment = "Enviado" + (carrier?.let { " via $it" } ?: "") + (trackingNumber?.let { " - Tracking: $it" } ?: "")
        updateStatus(OrderStatus.SHIPPED, comment, shippedBy, "ADMIN")
    }

    fun markAsDelivered(deliveredBy: Long) {
        check(status == OrderStatus.SHIPPED) { "La orden no ha sido enviada" }
        updateStatus(OrderStatus.DELIVERED, "Entregado al destinatario", deliveredBy, "ADMIN")
    }

    fun refund(amount: Long, refundedBy: Long) {
        check(canBeRefunded) { "La orden no puede ser reembolsada" }
        require(amount > 0 && amount <= totalAmount) { "Monto de reembolso inválido" }
        this.refundAmount = amount
        updateStatus(OrderStatus.REFUNDED, "Reembolso de $${String.format(Locale.US, "%,d", amount)}", refundedBy, "ADMIN")
    }

    fun recalculateTotals() {
        itemCount = items.size
        subtotal = items.sumOf { it.subtotal }
        totalAmount = subtotal + shippingCost + taxAmount - discountAmount
    }
}