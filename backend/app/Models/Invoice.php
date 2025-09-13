<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'invoice_number',
        'client_name',
        'client_tax_id',
        'amount',
        'issue_date',
        'due_date',
        'status',
        'risk_score',
        'discount_rate',
        'net_amount',
        'document_path',
        'verification_status',
        'operation_type',
        'description',
        // Campos específicos para Factoring
        'advance_percentage',
        'commission_rate',
        'expected_collection_date',
        'credit_risk_assessment',
        // Campos específicos para Confirming
        'supplier_name',
        'supplier_tax_id',
        'payment_terms',
        'early_payment_discount',
        'confirmation_deadline',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'discount_rate' => 'decimal:4',
        'net_amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
        'risk_score' => 'integer',
        // Campos específicos para Factoring
        'advance_percentage' => 'decimal:2',
        'commission_rate' => 'decimal:4',
        'expected_collection_date' => 'date',
        // Campos específicos para Confirming
        'early_payment_discount' => 'decimal:2',
        'confirmation_deadline' => 'date',
    ];

    /**
     * The possible statuses for an invoice.
     */
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_FUNDED = 'funded';
    const STATUS_PAID = 'paid';
    const STATUS_REJECTED = 'rejected';
    const STATUS_EXPIRED = 'expired';

    /**
     * The possible operation types for an invoice.
     */
    const OPERATION_TYPE_CONFIRMING = 'confirming';
    const OPERATION_TYPE_FACTORING = 'factoring';

    /**
     * Get the company that owns the invoice.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the investments for the invoice.
     */
    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    /**
     * Scope a query to only include approved invoices.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope a query to only include funded invoices.
     */
    public function scopeFunded($query)
    {
        return $query->where('status', self::STATUS_FUNDED);
    }

    /**
     * Calculate the discount amount.
     */
    public function getDiscountAmountAttribute()
    {
        return $this->amount * ($this->discount_rate / 100);
    }

    /**
     * Check if invoice is available for investment.
     */
    public function isAvailableForInvestment()
    {
        return $this->status === self::STATUS_APPROVED && 
               $this->verification_status === 'verified';
    }
}