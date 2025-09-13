<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Models\Invoice;
use App\Models\Investor;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InvestmentController extends Controller
{
    /**
     * Display a listing of investments.
     */
    public function index(Request $request)
    {
        $query = Investment::with(['investor.user', 'invoice.company.user']);
        
        // Filter by investor if provided
        if ($request->has('investor_id')) {
            $query->where('investor_id', $request->investor_id);
        }
        
        // Filter by invoice if provided
        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('investment_date', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('investment_date', '<=', $request->end_date);
        }
        
        $investments = $query->paginate(15);
        
        return response()->json($investments);
    }

    /**
     * Store a newly created investment.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'investor_id' => 'required|exists:investors,id',
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'expected_return_rate' => 'nullable|numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Check if invoice is available for investment
        $invoice = Invoice::find($request->invoice_id);
        if ($invoice->status !== 'approved') {
            return response()->json([
                'message' => 'Invoice is not available for investment'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Check if investor has sufficient capacity
        $investor = Investor::find($request->investor_id);
        $currentInvestments = $investor->investments()->sum('amount');
        
        if (($currentInvestments + $request->amount) > $investor->investment_capacity) {
            return response()->json([
                'message' => 'Investment amount exceeds investor capacity'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Check investment limits
        if ($investor->minimum_investment && $request->amount < $investor->minimum_investment) {
            return response()->json([
                'message' => 'Investment amount is below minimum limit'
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($investor->maximum_investment && $request->amount > $investor->maximum_investment) {
            return response()->json([
                'message' => 'Investment amount exceeds maximum limit'
            ], Response::HTTP_BAD_REQUEST);
        }

        DB::beginTransaction();
        
        try {
            $investmentData = $request->all();
            $investmentData['investment_date'] = now();
            $investmentData['status'] = 'active';
            
            // Calculate expected return if rate is provided
            if ($request->expected_return_rate) {
                $investmentData['expected_return'] = $request->amount * $request->expected_return_rate;
            }

            $investment = Investment::create($investmentData);

            // Update invoice status to funded if fully funded
            $totalInvestments = $invoice->investments()->sum('amount');
            if ($totalInvestments >= $invoice->amount) {
                $invoice->update(['status' => 'funded']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Investment created successfully',
                'investment' => $investment->load(['investor.user', 'invoice.company.user'])
            ], Response::HTTP_CREATED);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to create investment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified investment.
     */
    public function show(string $id)
    {
        $investment = Investment::with(['investor.user', 'invoice.company.user'])->find($id);
        
        if (!$investment) {
            return response()->json([
                'message' => 'Investment not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($investment);
    }

    /**
     * Update the specified investment.
     */
    public function update(Request $request, string $id)
    {
        $investment = Investment::find($id);
        
        if (!$investment) {
            return response()->json([
                'message' => 'Investment not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Only allow updates to certain fields
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|required|in:active,completed,cancelled',
            'actual_return' => 'sometimes|nullable|numeric|min:0',
            'return_date' => 'sometimes|nullable|date',
            'expected_return_rate' => 'sometimes|nullable|numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $updateData = $request->only(['status', 'actual_return', 'return_date', 'expected_return_rate']);
        
        // Recalculate expected return if rate is updated
        if (isset($updateData['expected_return_rate'])) {
            $updateData['expected_return'] = $investment->amount * $updateData['expected_return_rate'];
        }

        $investment->update($updateData);

        return response()->json([
            'message' => 'Investment updated successfully',
            'investment' => $investment->load(['investor.user', 'invoice.company.user'])
        ]);
    }

    /**
     * Remove the specified investment.
     */
    public function destroy(string $id)
    {
        $investment = Investment::find($id);
        
        if (!$investment) {
            return response()->json([
                'message' => 'Investment not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Only allow deletion if investment is not active
        if ($investment->status === 'active') {
            return response()->json([
                'message' => 'Cannot delete active investment'
            ], Response::HTTP_BAD_REQUEST);
        }

        $investment->delete();

        return response()->json([
            'message' => 'Investment deleted successfully'
        ]);
    }

    /**
     * Get investment statistics.
     */
    public function statistics(Request $request)
    {
        $query = Investment::query();
        
        // Apply date filters if provided
        if ($request->has('start_date')) {
            $query->where('investment_date', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('investment_date', '<=', $request->end_date);
        }

        $statistics = [
            'total_investments' => $query->count(),
            'total_amount_invested' => $query->sum('amount'),
            'total_expected_returns' => $query->sum('expected_return'),
            'total_actual_returns' => $query->sum('actual_return'),
            'active_investments' => $query->where('status', 'active')->count(),
            'completed_investments' => $query->where('status', 'completed')->count(),
            'cancelled_investments' => $query->where('status', 'cancelled')->count(),
            'average_investment_amount' => $query->avg('amount'),
            'investments_by_month' => $query
                ->select(DB::raw('YEAR(investment_date) as year'), DB::raw('MONTH(investment_date) as month'), DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total_amount'))
                ->groupBy(DB::raw('YEAR(investment_date)'), DB::raw('MONTH(investment_date)'))
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get(),
        ];

        return response()->json($statistics);
    }

    /**
     * Get available investment opportunities.
     */
    public function opportunities(Request $request)
    {
        $query = Invoice::approved()
            ->with(['company.user'])
            ->whereHas('company', function ($q) {
                $q->where('verification_status', 'verified');
            })
            // Filtrar facturas vencidas - solo mostrar facturas no vencidas
            ->where('due_date', '>', now());
        
        // No filtrar por tipo de operación para mostrar tanto factoring como confirming
        
        // Filter by risk score if provided
        if ($request->has('max_risk_score')) {
            $query->where('risk_score', '<=', $request->max_risk_score);
        }
        
        // Filter by minimum amount
        if ($request->has('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }
        
        // Filter by maximum amount
        if ($request->has('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }
        
        // Filter by due date
        if ($request->has('max_due_date')) {
            $query->where('due_date', '<=', $request->max_due_date);
        }
        
        $opportunities = $query->paginate(15);
        
        // Convert monetary values to float for each invoice
        $opportunities->getCollection()->transform(function ($invoice) {
            $invoice->amount = (float) $invoice->amount;
            $invoice->net_amount = (float) $invoice->net_amount;
            if ($invoice->discount_rate) {
                $invoice->discount_rate = (float) $invoice->discount_rate;
            }
            if ($invoice->advance_percentage) {
                $invoice->advance_percentage = (float) $invoice->advance_percentage;
            }
            if ($invoice->commission_rate) {
                $invoice->commission_rate = (float) $invoice->commission_rate;
            }
            if ($invoice->early_payment_discount) {
                $invoice->early_payment_discount = (float) $invoice->early_payment_discount;
            }
            return $invoice;
        });
        
        return response()->json($opportunities);
    }

    /**
     * Get a specific investment opportunity by ID.
     */
    public function getOpportunity(string $id)
    {
        $opportunity = Invoice::approved()
            ->with(['company.user'])
            ->whereHas('company', function ($q) {
                $q->where('verification_status', 'verified');
            })
            // Filtrar facturas vencidas - solo mostrar facturas no vencidas
            ->where('due_date', '>', now())
            ->find($id);
        
        if (!$opportunity) {
            return response()->json([
                'message' => 'Investment opportunity not found'
            ], Response::HTTP_NOT_FOUND);
        }
        
        // Convert monetary values to float
        $opportunity->amount = (float) $opportunity->amount;
        $opportunity->net_amount = (float) $opportunity->net_amount;
        if ($opportunity->discount_rate) {
            $opportunity->discount_rate = (float) $opportunity->discount_rate;
        }
        if ($opportunity->advance_percentage) {
            $opportunity->advance_percentage = (float) $opportunity->advance_percentage;
        }
        if ($opportunity->commission_rate) {
            $opportunity->commission_rate = (float) $opportunity->commission_rate;
        }
        if ($opportunity->early_payment_discount) {
            $opportunity->early_payment_discount = (float) $opportunity->early_payment_discount;
        }
        
        return response()->json($opportunity);
    }

    /**
     * Process investment return.
     */
    public function processReturn(Request $request, string $id)
    {
        $investment = Investment::find($id);
        
        if (!$investment) {
            return response()->json([
                'message' => 'Investment not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'actual_return' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $investment->update([
            'actual_return' => $request->actual_return,
            'return_date' => now(),
            'status' => 'completed'
        ]);

        return response()->json([
            'message' => 'Investment return processed successfully',
            'investment' => $investment
        ]);
    }

    /**
     * Get investor dashboard statistics.
     */
    public function investorStats(Request $request)
    {
        $user = $request->user();
        
        // Get investor record
        $investor = Investor::where('user_id', $user->id)->first();
        
        if (!$investor) {
            return response()->json([
                'message' => 'Investor profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Get investment statistics
        $totalInversiones = Investment::where('user_id', $user->id)->count();
        $inversionesActivas = Investment::where('user_id', $user->id)
            ->where('status', 'active')
            ->count();
        $montoInvertido = (float) Investment::where('user_id', $user->id)->sum('amount');
        $rendimientoTotal = (float) Investment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->sum('actual_return');

        // Get available investment opportunities (approved invoices)
        $opportunities = Invoice::where('status', 'approved')
            ->with(['company'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($invoice) {
                $amount = (float) $invoice->amount;
                
                // Calcular tasa de interés con la misma lógica de priorización
                $interestRate = 0;
                if ($invoice->operation_type === 'factoring' && $invoice->commission_rate > 0) {
                    $interestRate = $invoice->commission_rate;
                } elseif ($invoice->operation_type === 'confirming' && $invoice->early_payment_discount > 0) {
                    $interestRate = $invoice->early_payment_discount;
                } elseif ($invoice->discount_rate > 0) {
                    $interestRate = $invoice->discount_rate;
                }
                
                $term = (int) now()->diffInDays($invoice->due_date);
                $expectedReturn = ($amount * $interestRate * $term) / (365 * 100);
                
                return [
                    'id' => $invoice->id,
                    'companyName' => $invoice->company->business_name ?? 'N/A',
                    'facturaNumber' => $invoice->invoice_number,
                    'amount' => $amount,
                    'interestRate' => $interestRate,
                    'term' => $term,
                    'expectedReturn' => $expectedReturn,
                    'riskLevel' => $this->calculateRiskLevel($invoice->risk_score ?? 50),
                    'dueDate' => $invoice->due_date->toISOString()
                ];
            });

        // Get recent investment activities
        $recentActivities = Investment::where('user_id', $user->id)
            ->with(['invoice.company'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($investment) {
                $type = 'inversion_realizada';
                $description = "Inversión realizada en {$investment->invoice->company->business_name}";
                
                if ($investment->status === 'completed') {
                    $type = 'pago_recibido';
                    $description = "Pago recibido de inversión en {$investment->invoice->company->business_name}";
                }
                
                return [
                    'id' => $investment->id,
                    'type' => $type,
                    'description' => $description,
                    'amount' => (float) $investment->amount,
                    'date' => $investment->created_at->toISOString()
                ];
            });

        return response()->json([
            'totalInversiones' => $totalInversiones,
            'inversionesActivas' => $inversionesActivas,
            'montoInvertido' => $montoInvertido,
            'rendimientoTotal' => $rendimientoTotal,
            'opportunities' => $opportunities,
            'recentActivities' => $recentActivities
        ]);
    }

    /**
     * Calculate risk level based on risk score.
     */
    private function calculateRiskLevel($riskScore)
    {
        if ($riskScore <= 30) {
            return 'bajo';
        } elseif ($riskScore <= 70) {
            return 'medio';
        } else {
            return 'alto';
        }
    }
}
