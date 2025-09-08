<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InvestorController extends Controller
{
    /**
     * Display a listing of investors.
     */
    public function index(Request $request)
    {
        $query = Investor::with(['user', 'investments.invoice.company']);
        
        // Filter by verification status if provided
        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }
        
        // Filter by investment capacity
        if ($request->has('min_capacity')) {
            $query->where('investment_capacity', '>=', $request->min_capacity);
        }
        
        if ($request->has('max_capacity')) {
            $query->where('investment_capacity', '<=', $request->max_capacity);
        }
        
        $investors = $query->paginate(15);
        
        return response()->json($investors);
    }

    /**
     * Store a newly created investor.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id|unique:investors',
            'investment_capacity' => 'required|numeric|min:0',
            'risk_tolerance' => 'required|in:low,medium,high',
            'investment_experience' => 'required|in:beginner,intermediate,advanced',
            'preferred_sectors' => 'nullable|array',
            'preferred_sectors.*' => 'string|max:255',
            'minimum_investment' => 'nullable|numeric|min:0',
            'maximum_investment' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Convert preferred_sectors array to JSON if provided
        $investorData = $request->all();
        if (isset($investorData['preferred_sectors'])) {
            $investorData['preferred_sectors'] = json_encode($investorData['preferred_sectors']);
        }

        $investor = Investor::create($investorData);

        return response()->json([
            'message' => 'Investor created successfully',
            'investor' => $investor->load(['user', 'investments'])
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified investor.
     */
    public function show(string $id)
    {
        $investor = Investor::with(['user', 'investments.invoice.company'])->find($id);
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($investor);
    }

    /**
     * Update the specified investor.
     */
    public function update(Request $request, string $id)
    {
        $investor = Investor::find($id);
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'investment_capacity' => 'sometimes|required|numeric|min:0',
            'risk_tolerance' => 'sometimes|required|in:low,medium,high',
            'preferred_sectors' => 'nullable|array',
            'preferred_sectors.*' => 'string|max:255',
            'minimum_investment' => 'nullable|numeric|min:0',
            'maximum_investment' => 'nullable|numeric|min:0',
            'verification_status' => 'sometimes|required|in:pending,verified,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $updateData = $request->all();
        
        // Convert preferred_sectors array to JSON if provided
        if (isset($updateData['preferred_sectors'])) {
            $updateData['preferred_sectors'] = json_encode($updateData['preferred_sectors']);
        }

        $investor->update($updateData);

        return response()->json([
            'message' => 'Investor updated successfully',
            'investor' => $investor->load(['user', 'investments'])
        ]);
    }

    /**
     * Remove the specified investor.
     */
    public function destroy(string $id)
    {
        $investor = Investor::find($id);
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Check if investor has active investments
        $activeInvestments = $investor->investments()->whereHas('invoice', function ($query) {
            $query->whereIn('status', ['approved', 'funded']);
        })->count();

        if ($activeInvestments > 0) {
            return response()->json([
                'message' => 'Cannot delete investor with active investments'
            ], Response::HTTP_CONFLICT);
        }

        $investor->delete();

        return response()->json([
            'message' => 'Investor deleted successfully'
        ]);
    }

    /**
     * Get investor portfolio summary.
     */
    public function portfolio(string $id)
    {
        $investor = Investor::with(['investments.invoice'])->find($id);
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $portfolio = [
            'total_investments' => $investor->investments->count(),
            'total_invested_amount' => $investor->investments->sum('amount'),
            'active_investments' => $investor->investments()->whereHas('invoice', function ($query) {
                $query->whereIn('status', ['approved', 'funded']);
            })->count(),
            'completed_investments' => $investor->investments()->whereHas('invoice', function ($query) {
                $query->where('status', 'paid');
            })->count(),
            'expected_returns' => $investor->investments->sum('expected_return'),
            'actual_returns' => $investor->investments->sum('actual_return'),
            'investments_by_status' => $investor->investments()
                ->join('invoices', 'investments.invoice_id', '=', 'invoices.id')
                ->select('invoices.status', DB::raw('count(*) as count'), DB::raw('sum(investments.amount) as total_amount'))
                ->groupBy('invoices.status')
                ->get(),
        ];

        return response()->json([
            'investor' => $investor,
            'portfolio' => $portfolio
        ]);
    }

    /**
     * Get investment opportunities for investor.
     */
    public function opportunities(string $id, Request $request)
    {
        $investor = Investor::find($id);
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $query = Investment::availableForInvestment()
            ->with(['invoice.company.user']);
        
        // Filter by risk tolerance
        if ($investor->risk_tolerance === 'low') {
            $query->whereHas('invoice', function ($q) {
                $q->where('risk_score', '<=', 30);
            });
        } elseif ($investor->risk_tolerance === 'medium') {
            $query->whereHas('invoice', function ($q) {
                $q->whereBetween('risk_score', [20, 70]);
            });
        } elseif ($investor->risk_tolerance === 'high') {
            $query->whereHas('invoice', function ($q) {
                $q->where('risk_score', '>=', 50);
            });
        }
        
        // Filter by investment amount limits
        if ($investor->minimum_investment) {
            $query->whereHas('invoice', function ($q) use ($investor) {
                $q->where('amount', '>=', $investor->minimum_investment);
            });
        }
        
        if ($investor->maximum_investment) {
            $query->whereHas('invoice', function ($q) use ($investor) {
                $q->where('amount', '<=', $investor->maximum_investment);
            });
        }
        
        $opportunities = $query->paginate(15);
        
        return response()->json($opportunities);
    }

    /**
     * Update verification status.
     */
    public function updateVerificationStatus(Request $request, string $id)
    {
        $investor = Investor::find($id);
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => 'required|in:pending,verified,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $investor->update([
            'verification_status' => $request->verification_status
        ]);

        return response()->json([
            'message' => 'Verification status updated successfully',
            'investor' => $investor
        ]);
    }

    /**
     * Get current user's investor profile.
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $investor = $user->investor()->with(['investments.invoice.company'])->first();
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($investor);
    }
}
