<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Models\Invoice;
use App\Models\Investor;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvestmentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

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
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'accepted_conditions' => 'boolean',
            'investment_type' => 'required|in:direct,proposal',
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

        // Get investor record
        $investor = Investor::where('user_id', $user->id)->first();
        if (!$investor) {
            return response()->json([
                'message' => 'Investor profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Check if investor has sufficient capacity
        $currentInvestments = Investment::where('user_id', $user->id)->sum('amount');
        
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
            // Solo crear inversión directa si se aceptan las condiciones originales
            if ($request->investment_type === 'direct' && $request->accepted_conditions) {
                // Calculate expected return based on invoice conditions
                $expectedReturn = $this->calculateExpectedReturn($invoice, $request->amount);
                
                // Calculate return rate
                $returnRate = $request->amount > 0 ? ($expectedReturn / $request->amount) : 0;
                
                // Calculate maturity date based on invoice due date
                $maturityDate = $invoice->due_date ?? now()->addDays(30);
                
                $investmentData = [
                    'user_id' => $user->id,
                    'invoice_id' => $request->invoice_id,
                    'amount' => $request->amount,
                    'expected_return' => $expectedReturn,
                    'investment_date' => now(),
                    'maturity_date' => $maturityDate,
                    'status' => 'active',
                    'return_rate' => $returnRate,
                ];

                $investment = Investment::create($investmentData);

                // *** NUEVO: Crear pagos para operaciones de confirming con solicitud de adelanto ***
                if ($invoice->operation_type === 'confirming' && $invoice->advance_request) {
                    try {
                        $payments = $this->paymentService->createConfirmingPayments($investment);
                        
                        Log::info('Pagos de confirming creados exitosamente', [
                            'investment_id' => $investment->id,
                            'payments_count' => count($payments),
                            'supplier_payment' => $payments[0]->id ?? null,
                            'company_charge' => $payments[1]->id ?? null
                        ]);
                        
                    } catch (\Exception $paymentError) {
                        Log::error('Error al crear pagos de confirming', [
                            'investment_id' => $investment->id,
                            'error' => $paymentError->getMessage()
                        ]);
                        
                        // No fallar la inversión por errores en pagos, pero registrar el error
                        // En un entorno de producción, podrías querer manejar esto de manera diferente
                    }
                }

                // Update invoice status to funded if fully funded
                $totalInvestments = $invoice->investments()->sum('amount');
                if ($totalInvestments >= $invoice->amount) {
                    $invoice->update(['status' => 'funded']);
                }

                DB::commit();

                // Preparar respuesta con información de pagos si aplica
                $responseData = [
                    'message' => 'Investment created successfully',
                    'investment' => $investment->load(['investor.user', 'invoice.company.user'])
                ];

                // Agregar información de pagos si se crearon
                if ($invoice->operation_type === 'confirming' && $invoice->advance_request) {
                    $payments = $this->paymentService->getPaymentsByInvestment($investment->id);
                    $responseData['payments'] = $payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'type' => $payment->type,
                            'amount' => $payment->amount,
                            'scheduled_date' => $payment->scheduled_date,
                            'status' => $payment->status,
                            'description' => $payment->description
                        ];
                    });
                }

                return response()->json($responseData, Response::HTTP_CREATED);
            } else {
                // Si no se aceptan las condiciones, debe crear una propuesta
                return response()->json([
                    'message' => 'Direct investment requires accepting original conditions. Use proposal endpoint for modifications.',
                ], Response::HTTP_BAD_REQUEST);
            }
            
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
     * Calculate expected return based on invoice conditions
     * Uses the same logic as the frontend modal for consistency
     */
    private function calculateExpectedReturn($invoice, $amount)
    {
        $expectedReturn = 0;
        
        if ($invoice->operation_type === 'factoring') {
            // Para factoring: comisión sobre el monto de adelanto
            $advancePercentage = $invoice->advance_percentage ?? 80; // 80% por defecto
            $advanceAmount = $amount * ($advancePercentage / 100);
            $commissionRate = $invoice->commission_rate ?? 5; // 5% por defecto
            $expectedReturn = $advanceAmount * ($commissionRate / 100);
        } elseif ($invoice->operation_type === 'confirming') {
            // Para confirming: usar confirming_commission si está disponible, sino commission_rate
            $commissionRate = $invoice->confirming_commission ?? $invoice->commission_rate ?? 3; // 3% por defecto
            $expectedReturn = $amount * ($commissionRate / 100);
            
            // Si advance_request es true, agregar el descuento por pago anticipado
            if ($invoice->advance_request === true && $invoice->early_payment_discount) {
                $earlyPaymentBonus = $amount * ($invoice->early_payment_discount / 100);
                $expectedReturn += $earlyPaymentBonus;
            }
        }
        
        return $expectedReturn;
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
        if ($opportunity->confirming_commission) {
            $opportunity->confirming_commission = (float) $opportunity->confirming_commission;
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
        $montoInvertido = (float) Investment::where('user_id', $user->id)
            ->where('status', 'active')
            ->sum('amount');
        $rendimientoTotal = (float) Investment::where('user_id', $user->id)
            ->where('status', 'active')
            ->sum('expected_return');

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
                    'dueDate' => $invoice->due_date->toISOString(),
                    'operationType' => $invoice->operation_type ?? 'factoring',
                    'supplierName' => $invoice->supplier_name ?? null,
                    'advancePercentage' => $invoice->advance_percentage,
                    'advanceRequest' => $invoice->advance_request ?? false,
                    'earlyPaymentDiscount' => $invoice->early_payment_discount,
                    'confirmingCommission' => $invoice->confirming_commission
                ];
            });

        // Get recent investment activities with detailed payment information
        $recentActivities = Investment::where('user_id', $user->id)
            ->with(['invoice.company'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($investment) {
                $invoice = $investment->invoice;
                $company = $invoice->company;
                
                // Determinar el tipo de actividad y descripción
                $type = 'inversion_realizada';
                $description = "Inversión realizada en {$company->business_name}";
                $paymentStatus = 'active';
                
                if ($investment->status === 'completed') {
                    $type = 'pago_recibido';
                    $description = "Pago recibido de inversión en {$company->business_name}";
                    $paymentStatus = 'completed';
                }
                
                // Información específica del tipo de operación
                $operationDetails = [
                    'operation_type' => $invoice->operation_type,
                    'invoice_number' => $invoice->invoice_number,
                    'due_date' => $invoice->due_date->toISOString(),
                    'payment_status' => $paymentStatus,
                ];
                
                // Agregar detalles específicos según el tipo de operación
                if ($invoice->operation_type === 'confirming') {
                    $operationDetails = array_merge($operationDetails, [
                        'supplier_name' => $invoice->supplier_name,
                        'payment_terms' => $invoice->payment_terms,
                        'early_payment_discount' => $invoice->early_payment_discount,
                        'confirming_commission' => $invoice->confirming_commission,
                        'advance_request' => $invoice->advance_request,
                        'supplier_notification' => $invoice->supplier_notification,
                        'confirmation_deadline' => $invoice->confirmation_deadline ? $invoice->confirmation_deadline->toISOString() : null,
                    ]);
                } elseif ($invoice->operation_type === 'factoring') {
                    $operationDetails = array_merge($operationDetails, [
                        'client_name' => $invoice->client_name,
                        'advance_percentage' => $invoice->advance_percentage,
                        'commission_rate' => $invoice->commission_rate,
                        'expected_collection_date' => $invoice->expected_collection_date ? $invoice->expected_collection_date->toISOString() : null,
                        'credit_risk_assessment' => $invoice->credit_risk_assessment,
                    ]);
                }
                
                return [
                    'id' => $investment->id,
                    'type' => $type,
                    'description' => $description,
                    'amount' => (float) $investment->amount,
                    'expected_return' => (float) $investment->expected_return,
                    'actual_return' => $investment->actual_return ? (float) $investment->actual_return : null,
                    'return_rate' => $investment->return_rate ? (float) $investment->return_rate : null,
                    'investment_date' => $investment->investment_date ? $investment->investment_date->toISOString() : $investment->created_at->toISOString(),
                    'maturity_date' => $investment->maturity_date ? $investment->maturity_date->toISOString() : null,
                    'status' => $investment->status,
                    'company_name' => $company->business_name,
                    'operation_details' => $operationDetails,
                    'date' => $investment->created_at->toISOString()
                ];
            });

        // Get user's investments for the investments list
        $investments = Investment::where('user_id', $user->id)
            ->with(['invoice.company'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($investment) {
                return [
                    'id' => $investment->id,
                    'investor_id' => $investment->investor_id,
                    'invoice_id' => $investment->invoice_id,
                    'amount' => (float) $investment->amount,
                    'expected_return' => (float) $investment->expected_return,
                    'actual_return' => $investment->actual_return ? (float) $investment->actual_return : null,
                    'investment_date' => $investment->investment_date ? $investment->investment_date->toISOString() : $investment->created_at->toISOString(),
                    'maturity_date' => $investment->maturity_date ? $investment->maturity_date->toISOString() : null,
                    'status' => $investment->status,
                    'created_at' => $investment->created_at->toISOString(),
                    'updated_at' => $investment->updated_at->toISOString(),
                    'invoice' => [
                        'id' => $investment->invoice->id,
                        'invoice_number' => $investment->invoice->invoice_number,
                        'amount' => (float) $investment->invoice->amount,
                        'due_date' => $investment->invoice->due_date->toISOString(),
                        'operation_type' => $investment->invoice->operation_type,
                        'company' => [
                            'id' => $investment->invoice->company->id,
                            'business_name' => $investment->invoice->company->business_name
                        ]
                    ]
                ];
            });

        return response()->json([
            'totalInversiones' => $totalInversiones,
            'inversionesActivas' => $inversionesActivas,
            'montoInvertido' => $montoInvertido,
            'rendimientoTotal' => $rendimientoTotal,
            'opportunities' => $opportunities,
            'recentActivities' => $recentActivities,
            'investments' => $investments
        ]);
    }

    /**
     * Get company financing statistics (investments received on their invoices).
     */
    public function companyFinancingStats(Request $request)
    {
        $user = $request->user();
        
        // Get company record
        $company = \App\Models\Company::where('user_id', $user->id)->first();
        
        if (!$company) {
            return response()->json([
                'message' => 'Company profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Get investments made on this company's invoices
        $investments = Investment::whereHas('invoice', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        })
        ->with(['user', 'invoice', 'payments'])
        ->orderBy('created_at', 'desc')
        ->get();

        // Calculate statistics
        $totalFinanciamientos = $investments->count();
        $financiamientosActivos = $investments->where('status', 'active')->count();
        $montoTotalFinanciado = $investments->sum('amount');
        $montoTotalComisiones = $investments->sum('expected_return');

        // Map investments to financing records
        $financiamientos = $investments->map(function ($investment) {
            $invoice = $investment->invoice;
            $investor = $investment->user;
            
            // Determine operation type and details
            $operationType = $invoice->operation_type;
            $operationDetails = [];
            
            if ($operationType === 'factoring') {
                $operationDetails = [
                    'invoice_amount' => (float) $invoice->amount,
                    'advance_percentage' => $invoice->advance_percentage,
                    'commission_rate' => $invoice->commission_rate,
                    'factoring_type' => $invoice->factoring_type,
                ];
            } elseif ($operationType === 'confirming') {
                $operationDetails = [
                    'invoice_amount' => (float) $invoice->amount,
                    'confirming_commission' => $invoice->confirming_commission,
                    'advance_request' => $invoice->advance_request,
                    'early_payment_discount' => $invoice->early_payment_discount,
                    'payment_terms' => $invoice->payment_terms,
                ];
            }

            // Get payment information if exists
            $paymentInfo = null;
            if ($investment->payments && $investment->payments->count() > 0) {
                $paymentInfo = $investment->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'type' => $payment->type,
                        'amount' => (float) $payment->amount,
                        'scheduled_date' => $payment->scheduled_date,
                        'executed_date' => $payment->executed_date,
                        'status' => $payment->status,
                    ];
                });
            }

            return [
                'id' => $investment->id,
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'investor_name' => $investor->first_name . ' ' . $investor->last_name,
                'investor_email' => $investor->email,
                'amount' => (float) $investment->amount,
                'expected_return' => (float) $investment->expected_return,
                'actual_return' => $investment->actual_return ? (float) $investment->actual_return : null,
                'return_rate' => $investment->return_rate ? (float) $investment->return_rate : null,
                'investment_date' => $investment->investment_date ? $investment->investment_date->toISOString() : $investment->created_at->toISOString(),
                'maturity_date' => $investment->maturity_date ? $investment->maturity_date->toISOString() : null,
                'status' => $investment->status,
                'operation_type' => $operationType,
                'operation_details' => $operationDetails,
                'payments' => $paymentInfo,
                'created_at' => $investment->created_at->toISOString(),
            ];
        });

        // Get recent financing activities
        $recentActivities = $investments->take(10)->map(function ($investment) {
            $invoice = $investment->invoice;
            $investor = $investment->user;
            
            $description = "Financiamiento recibido de {$investor->first_name} {$investor->last_name} para factura {$invoice->invoice_number}";
            
            return [
                'id' => $investment->id,
                'type' => 'financiamiento_recibido',
                'description' => $description,
                'amount' => (float) $investment->amount,
                'date' => $investment->created_at->toISOString(),
                'status' => $investment->status,
                'operation_type' => $invoice->operation_type,
            ];
        });

        return response()->json([
            'totalFinanciamientos' => $totalFinanciamientos,
            'financiamientosActivos' => $financiamientosActivos,
            'montoTotalFinanciado' => $montoTotalFinanciado,
            'montoTotalComisiones' => $montoTotalComisiones,
            'financiamientos' => $financiamientos,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Get company financing history (detailed list of all investments received).
     */
    public function companyFinancingHistory(Request $request)
    {
        $user = $request->user();
        
        // Get company record
        $company = \App\Models\Company::where('user_id', $user->id)->first();
        
        if (!$company) {
            return response()->json([
                'message' => 'Company profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Get investments made on this company's invoices with pagination
        $investments = Investment::whereHas('invoice', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        })
        ->with(['user', 'invoice', 'payments'])
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        // Map investments to financing records
        $financingHistory = $investments->getCollection()->map(function ($investment) {
            $invoice = $investment->invoice;
            $investor = $investment->user;
            
            return [
                'id' => $investment->id,
                'invoice_number' => $invoice->invoice_number,
                'investor_name' => $investor->first_name . ' ' . $investor->last_name,
                'investor_email' => $investor->email,
                'amount' => (float) $investment->amount,
                'expected_return' => (float) $investment->expected_return,
                'investment_date' => $investment->investment_date ? $investment->investment_date->toISOString() : $investment->created_at->toISOString(),
                'maturity_date' => $investment->maturity_date ? $investment->maturity_date->toISOString() : null,
                'status' => $investment->status,
                'operation_type' => $invoice->operation_type,
                'due_date' => $invoice->due_date->toISOString(),
                'created_at' => $investment->created_at->toISOString(),
            ];
        });

        return response()->json([
            'data' => $financingHistory,
            'current_page' => $investments->currentPage(),
            'last_page' => $investments->lastPage(),
            'per_page' => $investments->perPage(),
            'total' => $investments->total(),
        ]);
    }

    /**
     * Get company financing activity (recent activities and notifications).
     */
    public function companyFinancingActivity(Request $request)
    {
        $user = $request->user();
        
        // Get company record
        $company = \App\Models\Company::where('user_id', $user->id)->first();
        
        if (!$company) {
            return response()->json([
                'message' => 'Company profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Get recent investments (last 30 days)
        $recentInvestments = Investment::whereHas('invoice', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        })
        ->with(['user', 'invoice'])
        ->where('created_at', '>=', now()->subDays(30))
        ->orderBy('created_at', 'desc')
        ->limit(20)
        ->get();

        // Map to activity format
        $activities = $recentInvestments->map(function ($investment) {
            $invoice = $investment->invoice;
            $investor = $investment->user;
            
            $description = "Nuevo financiamiento recibido de {$investor->first_name} {$investor->last_name}";
            
            return [
                'id' => $investment->id,
                'type' => 'financiamiento_recibido',
                'description' => $description,
                'amount' => (float) $investment->amount,
                'date' => $investment->created_at->toISOString(),
                'status' => $investment->status,
                'operation_type' => $invoice->operation_type,
                'invoice_number' => $invoice->invoice_number,
                'investor_name' => $investor->first_name . ' ' . $investor->last_name,
            ];
        });

        return response()->json([
            'activities' => $activities,
            'total_activities' => $activities->count(),
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

    /**
     * Cancel an investment and revert associated payments.
     */
    public function cancel(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            // Find the investment
            $investment = Investment::with(['payments', 'invoice', 'user'])->findOrFail($id);
            
            // Verify that the investment belongs to the authenticated user
            if ($investment->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'No tienes permisos para cancelar esta inversión'
                ], Response::HTTP_FORBIDDEN);
            }

            // Check if investment can be cancelled (only active investments)
            if ($investment->status !== Investment::STATUS_ACTIVE) {
                return response()->json([
                    'message' => 'Solo se pueden cancelar inversiones activas'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Check if any payments have been executed
            $executedPayments = $investment->payments()->where('status', Payment::STATUS_EXECUTED)->count();
            if ($executedPayments > 0) {
                return response()->json([
                    'message' => 'No se puede cancelar una inversión con pagos ya ejecutados'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Cancel all pending payments
            $investment->payments()->where('status', Payment::STATUS_PENDING)
                ->update(['status' => Payment::STATUS_CANCELLED]);

            // Update investment status to cancelled
            $investment->update(['status' => Investment::STATUS_CANCELLED]);

            // Update invoice status if needed
            $invoice = $investment->invoice;
            $remainingInvestments = $invoice->investments()
                ->where('status', Investment::STATUS_ACTIVE)
                ->sum('amount');

            // If no active investments remain, revert invoice to approved status
            if ($remainingInvestments == 0) {
                $invoice->update(['status' => 'approved']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Inversión cancelada exitosamente',
                'investment' => [
                    'id' => $investment->id,
                    'status' => $investment->status,
                    'amount' => $investment->amount,
                    'cancelled_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error cancelling investment', [
                'investment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error interno del servidor al cancelar la inversión'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
