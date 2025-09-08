<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Investor extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'investor_type',
        'risk_tolerance',
        'investment_experience',
        'investment_capacity',
        'preferred_sectors',
        'minimum_investment',
        'maximum_investment',
        'investment_horizon',
        'verification_status',
        'accredited_investor',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'minimum_investment' => 'decimal:2',
        'maximum_investment' => 'decimal:2',
        'preferred_sectors' => 'array',
        'accredited_investor' => 'boolean',
    ];

    /**
     * The possible investor types.
     */
    const TYPE_INDIVIDUAL = 'individual';
    const TYPE_INSTITUTIONAL = 'institutional';
    const TYPE_CORPORATE = 'corporate';

    /**
     * The possible risk tolerance levels.
     */
    const RISK_LOW = 'low';
    const RISK_MEDIUM = 'medium';
    const RISK_HIGH = 'high';

    /**
     * Get the user that owns the investor profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the investments made by this investor.
     */
    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class, 'user_id', 'user_id');
    }

    /**
     * Scope a query to only include verified investors.
     */
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    /**
     * Scope a query to only include accredited investors.
     */
    public function scopeAccredited($query)
    {
        return $query->where('accredited_investor', true);
    }

    /**
     * Scope a query by risk tolerance.
     */
    public function scopeByRiskTolerance($query, $riskLevel)
    {
        return $query->where('risk_tolerance', $riskLevel);
    }

    /**
     * Calculate total invested amount.
     */
    public function getTotalInvestedAttribute()
    {
        return $this->investments()->sum('amount');
    }

    /**
     * Calculate total returns.
     */
    public function getTotalReturnsAttribute()
    {
        return $this->investments()->sum('actual_return') ?: 
               $this->investments()->sum('expected_return');
    }

    /**
     * Calculate portfolio ROI.
     */
    public function getPortfolioRoiAttribute()
    {
        $totalInvested = $this->total_invested;
        if ($totalInvested == 0) return 0;
        
        $totalReturns = $this->total_returns;
        return (($totalReturns - $totalInvested) / $totalInvested) * 100;
    }
}