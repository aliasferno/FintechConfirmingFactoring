<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class InvestmentProposal extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'investor_id',
        'invoice_id',
        // Campos específicos de factoring
        'advance_percentage',
        'factoring_commission',
        'risk_assessment',
        'factoring_type',
        // Campos específicos de confirming
        'payment_terms',
        'guarantee_type',
        'confirming_type',
        'supplier_notification',
        'advance_request',
        'confirming_commission',
        'payment_guarantee',
        'early_payment_discount',
        // Campos de control del sistema
        'status',
        'sent_at',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'approval_notes',
        'company_response',
        'responded_at',
        'responded_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // Campos específicos de factoring
        'advance_percentage' => 'decimal:2',
        'factoring_commission' => 'decimal:2',
        // Campos específicos de confirming
        'confirming_commission' => 'decimal:2',
        'early_payment_discount' => 'decimal:2',
        'advance_request' => 'boolean',
        'supplier_notification' => 'boolean',
        // Campos de control del sistema
        'sent_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    /**
     * The possible statuses for a proposal.
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_SENT = 'sent';
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COUNTER_OFFERED = 'counter_offered';
    const STATUS_EXPIRED = 'expired';

    /**
     * Get the investor that made the proposal.
     */
    public function investor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'investor_id');
    }

    /**
     * Get the invoice this proposal is for.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the user who responded to the proposal.
     */
    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    /**
     * Get the parent proposal if this is a counter offer.
     */
    public function parentProposal(): BelongsTo
    {
        return $this->belongsTo(InvestmentProposal::class, 'parent_proposal_id');
    }

    /**
     * Get the counter offers for this proposal.
     */
    public function counterOffers(): HasMany
    {
        return $this->hasMany(InvestmentProposal::class, 'parent_proposal_id');
    }

    /**
     * Scope to get active proposals (not expired or rejected).
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_COUNTER_OFFERED]);
    }

    /**
     * Scope to get expired proposals.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    /**
     * Scope to get proposals for a specific investor.
     */
    public function scopeForInvestor($query, $investorId)
    {
        return $query->where('investor_id', $investorId);
    }

    /**
     * Scope to get proposals for a specific invoice.
     */
    public function scopeForInvoice($query, $invoiceId)
    {
        return $query->where('invoice_id', $invoiceId);
    }

    /**
     * Check if the proposal is expired.
     */
    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    /**
     * Check if the proposal can be responded to.
     */
    public function canBeResponded(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_COUNTER_OFFERED]);
    }

    /**
     * Calculate expected return based on proposed terms.
     */
    public function calculateExpectedReturn(): float
    {
        $invoice = $this->invoice;
        if (!$invoice) return 0.0;
        
        if ($this->factoring_commission && $this->advance_percentage) {
            // Factoring: comisión sobre el monto de anticipo
            $advanceAmount = $invoice->amount * ($this->advance_percentage / 100);
            return $advanceAmount * ($this->factoring_commission / 100);
        } elseif ($this->confirming_commission) {
            // Confirming: comisión sobre el monto total
            return $invoice->amount * ($this->confirming_commission / 100);
        }
        
        return 0.0;
    }

    /**
     * Get the difference between proposed and original terms.
     */
    public function getTermsDifference(): array
    {
        if (!$this->original_terms) {
            return [];
        }

        $original = $this->original_terms;
        $proposed = [
            'amount' => (float) $this->proposed_amount,
            'interest_rate' => (float) $this->proposed_interest_rate,
            'term_days' => $this->proposed_term_days,
            'discount_rate' => (float) $this->proposed_discount_rate,
            'commission_rate' => (float) $this->proposed_commission_rate,
        ];

        $differences = [];
        foreach ($proposed as $key => $value) {
            if (isset($original[$key]) && $original[$key] != $value) {
                $differences[$key] = [
                    'original' => $original[$key],
                    'proposed' => $value,
                    'difference' => $value - $original[$key]
                ];
            }
        }

        return $differences;
    }

    /**
     * Mark proposal as expired.
     */
    public function markAsExpired(): bool
    {
        if (!$this->isExpired() && in_array($this->status, [self::STATUS_SENT, self::STATUS_PENDING])) {
            $this->status = self::STATUS_EXPIRED;
            return $this->save();
        }
        return false;
    }

    /**
     * Create a counter offer based on this proposal.
     */
    public function createCounterOffer(array $counterTerms, string $response, int $respondedBy): self
    {
        // Preparar datos base para la contraoferta
        $counterOfferData = [
            'investor_id' => $this->investor_id,
            'invoice_id' => $this->invoice_id,
            'company_response' => $response,
            'responded_by' => $respondedBy,
            'responded_at' => now(),
            'status' => self::STATUS_PENDING,
        ];

        // Agregar campos específicos según el tipo de operación
        if (isset($counterTerms['advance_percentage'])) {
            $counterOfferData['advance_percentage'] = $counterTerms['advance_percentage'];
        }
        if (isset($counterTerms['factoring_commission'])) {
            $counterOfferData['factoring_commission'] = $counterTerms['factoring_commission'];
        }
        if (isset($counterTerms['confirming_commission'])) {
            $counterOfferData['confirming_commission'] = $counterTerms['confirming_commission'];
        }
        if (isset($counterTerms['payment_terms'])) {
            $counterOfferData['payment_terms'] = $counterTerms['payment_terms'];
        }
        if (isset($counterTerms['risk_assessment'])) {
            $counterOfferData['risk_assessment'] = $counterTerms['risk_assessment'];
        }
        if (isset($counterTerms['early_payment_discount'])) {
            $counterOfferData['early_payment_discount'] = $counterTerms['early_payment_discount'];
        }

        return self::create($counterOfferData);
    }

    /**
     * Send the proposal to the company for approval.
     */
    public function sendToCompany(): bool
    {
        if ($this->status !== self::STATUS_DRAFT) {
            return false;
        }

        $this->status = self::STATUS_SENT;
        $this->sent_at = now();
        return $this->save();
    }

    /**
     * Approve the proposal.
     */
    public function approve(int $approvedBy, string $notes = null): bool
    {
        if (!in_array($this->status, [self::STATUS_SENT, self::STATUS_PENDING])) {
            return false;
        }

        $this->status = self::STATUS_APPROVED;
        $this->approved_at = now();
        $this->responded_by = $approvedBy;
        $this->responded_at = now();
        $this->approval_notes = $notes;
        return $this->save();
    }

    /**
     * Reject the proposal.
     */
    public function reject(int $rejectedBy, string $reason = null): bool
    {
        if (!in_array($this->status, [self::STATUS_SENT, self::STATUS_PENDING])) {
            return false;
        }

        $this->status = self::STATUS_REJECTED;
        $this->rejected_at = now();
        $this->responded_by = $rejectedBy;
        $this->responded_at = now();
        $this->rejection_reason = $reason;
        return $this->save();
    }

    /**
     * Check if the proposal can be sent.
     */
    public function canBeSent(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if the proposal can be approved or rejected.
     */
    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_SENT, self::STATUS_PENDING]);
    }

    /**
     * Check if the proposal can be approved or rejected.
     */
    public function canBeApprovedOrRejected(): bool
    {
        return in_array($this->status, [self::STATUS_SENT, self::STATUS_PENDING]);
    }

    /**
     * Get the status display name.
     */
    public function getStatusDisplayName(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_SENT => 'Enviada',
            self::STATUS_PENDING => 'Pendiente',
            self::STATUS_APPROVED => 'Aprobada',
            self::STATUS_REJECTED => 'Rechazada',
            self::STATUS_COUNTER_OFFERED => 'Contraoferta',
            self::STATUS_EXPIRED => 'Expirada',
            default => 'Desconocido'
        };
    }
}