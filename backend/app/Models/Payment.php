<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'investment_id',
        'invoice_id',
        'payer_id',
        'payee_id',
        'type',
        'amount',
        'original_invoice_amount',
        'discount_percentage',
        'commission_percentage',
        'scheduled_date',
        'executed_date',
        'original_due_date',
        'status',
        'description',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'original_invoice_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'scheduled_date' => 'datetime',
        'executed_date' => 'datetime',
        'original_due_date' => 'date',
        'metadata' => 'array',
    ];

    /**
     * Payment types constants.
     */
    const TYPE_PAYMENT_TO_SUPPLIER = 'payment_to_supplier';
    const TYPE_CHARGE_TO_COMPANY = 'charge_to_company';

    /**
     * Payment status constants.
     */
    const STATUS_PENDING = 'pending';
    const STATUS_EXECUTED = 'executed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the investment that this payment belongs to.
     */
    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class);
    }

    /**
     * Get the invoice that this payment is related to.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the user who makes the payment (payer).
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    /**
     * Get the user who receives the payment (payee).
     */
    public function payee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payee_id');
    }

    /**
     * Scope a query to only include pending payments.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope a query to only include executed payments.
     */
    public function scopeExecuted($query)
    {
        return $query->where('status', self::STATUS_EXECUTED);
    }

    /**
     * Scope a query to only include payments to suppliers.
     */
    public function scopePaymentsToSuppliers($query)
    {
        return $query->where('type', self::TYPE_PAYMENT_TO_SUPPLIER);
    }

    /**
     * Scope a query to only include charges to companies.
     */
    public function scopeChargesToCompanies($query)
    {
        return $query->where('type', self::TYPE_CHARGE_TO_COMPANY);
    }

    /**
     * Check if the payment is due for execution.
     */
    public function isDue(): bool
    {
        return $this->scheduled_date <= now() && $this->status === self::STATUS_PENDING;
    }

    /**
     * Mark the payment as executed.
     */
    public function markAsExecuted(): void
    {
        $this->update([
            'status' => self::STATUS_EXECUTED,
            'executed_date' => now(),
        ]);
    }

    /**
     * Mark the payment as failed.
     */
    public function markAsFailed(): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
        ]);
    }

    /**
     * Calculate the net amount after discount or commission.
     */
    public function getNetAmountAttribute(): float
    {
        if ($this->type === self::TYPE_PAYMENT_TO_SUPPLIER && $this->discount_percentage) {
            // Para pagos al proveedor: monto original - descuento
            return $this->original_invoice_amount * (1 - ($this->discount_percentage / 100));
        } elseif ($this->type === self::TYPE_CHARGE_TO_COMPANY && $this->commission_percentage) {
            // Para cobros a la empresa: monto original + comisión
            return $this->original_invoice_amount * (1 + ($this->commission_percentage / 100));
        }
        
        return $this->amount;
    }
}
