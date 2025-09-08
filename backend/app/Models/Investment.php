<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Investment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'invoice_id',
        'amount',
        'expected_return',
        'actual_return',
        'investment_date',
        'maturity_date',
        'status',
        'return_rate',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'expected_return' => 'decimal:2',
        'actual_return' => 'decimal:2',
        'return_rate' => 'decimal:4',
        'investment_date' => 'date',
        'maturity_date' => 'date',
    ];

    /**
     * The possible statuses for an investment.
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_DEFAULTED = 'defaulted';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the user that made the investment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the invoice that was invested in.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Scope a query to only include active investments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope a query to only include completed investments.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Calculate the profit from the investment.
     */
    public function getProfitAttribute()
    {
        return $this->actual_return ? 
               ($this->actual_return - $this->amount) : 
               ($this->expected_return - $this->amount);
    }

    /**
     * Calculate the ROI percentage.
     */
    public function getRoiPercentageAttribute()
    {
        if ($this->amount == 0) return 0;
        
        $return = $this->actual_return ?: $this->expected_return;
        return (($return - $this->amount) / $this->amount) * 100;
    }

    /**
     * Check if investment has matured.
     */
    public function hasMatured()
    {
        return $this->maturity_date <= now();
    }
}