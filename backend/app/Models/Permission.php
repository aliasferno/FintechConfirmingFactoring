<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'resource',
    ];

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission');
    }

    /**
     * Permission constants for common actions
     */
    const VIEW_COMPANIES = 'view_companies';
    const CREATE_INVESTMENT = 'create_investment';
    const VIEW_INVESTMENTS = 'view_investments';
    const MANAGE_USERS = 'manage_users';
    const VIEW_INVOICES = 'view_invoices';
    const CREATE_INVOICES = 'create_invoices';
    const MANAGE_COMPANY_PROFILE = 'manage_company_profile';
    const MANAGE_INVESTOR_PROFILE = 'manage_investor_profile';
    const VIEW_PORTFOLIO = 'view_portfolio';
    const ADMIN_ACCESS = 'admin_access';
}
