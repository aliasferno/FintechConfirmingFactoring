<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\InvestmentProposal;
use App\Models\Invoice;
use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InvestmentProposalController extends Controller
{
    /**
     * Display a listing of investment proposals.
     */
    public function index(Request $request)
    {
        $query = InvestmentProposal::with(['investor', 'invoice.company', 'respondedBy']);
        
        // Filter by investor
        if ($request->has('investor_id')) {
            $query->where('investor_id', $request->investor_id);
        }
        
        // Filter by invoice
        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by company (for company dashboard)
        if ($request->has('company_id')) {
            $query->whereHas('invoice', function ($q) use ($request) {
                $q->where('company_id', $request->company_id);
            });
        }
        
        // Only active proposals by default
        if ($request->get('include_expired', false) === 'false') {
            $query->active();
        }
        
        $proposals = $query->orderBy('created_at', 'desc')->paginate(15);
        
        return response()->json($proposals);
    }

    /**
     * Send a proposal to the company for approval.
     */
    public function sendProposal(Request $request, string $id)
    {
        $proposal = InvestmentProposal::findOrFail($id);
        $user = $request->user();

        // Verificar que el usuario es el dueño de la propuesta
        if ($proposal->investor_id !== $user->id) {
            return response()->json([
                'message' => 'No tienes permisos para enviar esta propuesta'
            ], Response::HTTP_FORBIDDEN);
        }

        // Verificar que la propuesta puede ser enviada
        if (!$proposal->canBeSent()) {
            return response()->json([
                'message' => 'Esta propuesta no puede ser enviada en su estado actual'
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($proposal->sendToCompany()) {
            $proposal->load(['investor', 'invoice.company']);
            
            return response()->json([
                'message' => 'Propuesta enviada exitosamente a la empresa',
                'proposal' => $proposal
            ]);
        }

        return response()->json([
            'message' => 'Error al enviar la propuesta'
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * Approve a proposal.
     */
    public function approveProposal(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'approval_notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $proposal = InvestmentProposal::findOrFail($id);
        $user = $request->user();

        // Verificar que el usuario pertenece a la empresa dueña de la factura
        if ($proposal->invoice->company_id !== $user->company_id) {
            return response()->json([
                'message' => 'No tienes permisos para aprobar esta propuesta'
            ], Response::HTTP_FORBIDDEN);
        }

        // Verificar que la propuesta puede ser aprobada
        if (!$proposal->canBeApprovedOrRejected()) {
            return response()->json([
                'message' => 'Esta propuesta no puede ser aprobada en su estado actual'
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($proposal->approve($user->id, $request->approval_notes)) {
            $proposal->load(['investor', 'invoice.company', 'respondedBy']);
            
            return response()->json([
                'message' => 'Propuesta aprobada exitosamente',
                'proposal' => $proposal
            ]);
        }

        return response()->json([
            'message' => 'Error al aprobar la propuesta'
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * Reject a proposal.
     */
    public function rejectProposal(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $proposal = InvestmentProposal::findOrFail($id);
        $user = $request->user();

        // Verificar que el usuario pertenece a la empresa dueña de la factura
        if ($proposal->invoice->company_id !== $user->company_id) {
            return response()->json([
                'message' => 'No tienes permisos para rechazar esta propuesta'
            ], Response::HTTP_FORBIDDEN);
        }

        // Verificar que la propuesta puede ser rechazada
        if (!$proposal->canBeApprovedOrRejected()) {
            return response()->json([
                'message' => 'Esta propuesta no puede ser rechazada en su estado actual'
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($proposal->reject($user->id, $request->rejection_reason)) {
            $proposal->load(['investor', 'invoice.company', 'respondedBy']);
            
            return response()->json([
                'message' => 'Propuesta rechazada exitosamente',
                'proposal' => $proposal
            ]);
        }

        return response()->json([
            'message' => 'Error al rechazar la propuesta'
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * Get proposals pending approval for a company.
     */
    public function companyProposals(Request $request)
    {
        $user = $request->user();
        
        // Buscar la empresa del usuario
        $company = $user->company;
        if (!$company) {
            return response()->json([
                'message' => 'Usuario no pertenece a ninguna empresa'
            ], Response::HTTP_FORBIDDEN);
        }

        $query = InvestmentProposal::with(['investor', 'invoice', 'respondedBy'])
            ->whereHas('invoice', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            });

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // Por defecto, mostrar solo las enviadas y pendientes
            $query->whereIn('status', [InvestmentProposal::STATUS_SENT, InvestmentProposal::STATUS_PENDING]);
        }

        $proposals = $query->orderBy('sent_at', 'desc')
                          ->orderBy('created_at', 'desc')
                          ->paginate(15);

        return response()->json($proposals);
    }

    /**
     * Store a newly created investment proposal.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|exists:invoices,id',
            // Campos específicos de factoring
            'advance_percentage' => 'nullable|numeric|min:70|max:90',
            'factoring_commission' => 'nullable|numeric|min:0.5|max:10',
            'risk_assessment' => 'nullable|in:low,medium,high',
            'factoring_type' => 'nullable|in:with_recourse,without_recourse,international',
            // Campos específicos de confirming
            'payment_terms' => 'nullable|string|max:255',
            'guarantee_type' => 'nullable|in:bank_guarantee,insurance,collateral,surety_bond,none',
            'confirming_type' => 'nullable|in:with_recourse,without_recourse,international',
            'supplier_notification' => 'nullable|boolean',
            'advance_request' => 'nullable|boolean',
            'confirming_commission' => 'nullable|numeric|min:0.5|max:10',
            'payment_guarantee' => 'nullable|string|max:255',
            'early_payment_discount' => 'nullable|numeric|min:0|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();
        $invoice = Invoice::findOrFail($request->invoice_id);
        
        // Verificar que la factura esté disponible para inversión
        if ($invoice->status !== Invoice::STATUS_APPROVED) {
            return response()->json([
                'message' => 'Esta factura no está disponible para inversión'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validaciones específicas para factoring
        if ($invoice->operation_type === 'factoring') {
            $factoringValidator = Validator::make($request->all(), [
                'advance_percentage' => 'required|numeric|min:70|max:90',
                'factoring_commission' => 'required|numeric|min:0.5|max:10',
            ]);

            if ($factoringValidator->fails()) {
                return response()->json([
                    'message' => 'Para operaciones de factoring se requieren campos adicionales',
                    'errors' => $factoringValidator->errors()
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }
        
        // Validaciones específicas para confirming
        if ($invoice->operation_type === 'confirming') {
            $confirmingValidator = Validator::make($request->all(), [
                'payment_terms' => 'required|string|max:255',
                'confirming_type' => 'required|in:with_recourse,without_recourse,international',
                'confirming_commission' => 'required|numeric|min:0.5|max:10',
            ]);

            if ($confirmingValidator->fails()) {
                return response()->json([
                    'message' => 'Para operaciones de confirming se requieren campos adicionales',
                    'errors' => $confirmingValidator->errors()
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }
        
        // Verificar que no haya una propuesta activa del mismo inversor para la misma factura
        $existingProposal = InvestmentProposal::where('investor_id', $user->id)
            ->where('invoice_id', $request->invoice_id)
            ->active()
            ->first();
            
        if ($existingProposal) {
            return response()->json([
                'message' => 'Ya tienes una propuesta activa para esta factura'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        // Crear datos específicos según el tipo de operación
        $proposalData = [
            'investor_id' => $user->id,
            'invoice_id' => $request->invoice_id,
            'status' => InvestmentProposal::STATUS_DRAFT,
        ];
        
        DB::beginTransaction();
        try {
            // Datos específicos según el tipo de operación
            if ($invoice->operation_type === 'factoring') {
                $proposalData = array_merge($proposalData, [
                    'advance_percentage' => $request->advance_percentage,
                    'factoring_commission' => $request->factoring_commission,
                    'risk_assessment' => $request->risk_assessment,
                    'factoring_type' => $request->factoring_type,
                ]);
            } elseif ($invoice->operation_type === 'confirming') {
                $proposalData = array_merge($proposalData, [
                    'payment_terms' => $request->payment_terms,
                    'guarantee_type' => $request->guarantee_type,
                    'confirming_type' => $request->confirming_type,
                    'supplier_notification' => (bool)($request->supplier_notification ?? false),
                    'advance_request' => (bool)($request->advance_request ?? false),
                    'confirming_commission' => $request->confirming_commission,
                    'payment_guarantee' => $request->payment_guarantee,
                    'early_payment_discount' => $request->early_payment_discount,
                ]);
            }
            
            $proposal = InvestmentProposal::create($proposalData);
            
            DB::commit();
            
            // Cargar relaciones para la respuesta
            $proposal->load(['investor', 'invoice.company']);
            
            return response()->json([
                'message' => 'Propuesta de inversión creada exitosamente',
                'proposal' => $proposal
            ], Response::HTTP_CREATED);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear la propuesta de inversión',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified investment proposal.
     */
    public function show(string $id)
    {
        $proposal = InvestmentProposal::with([
            'investor', 
            'invoice.company', 
            'respondedBy',
            'parentProposal',
            'counterOffers'
        ])->findOrFail($id);
        
        return response()->json([
            'proposal' => $proposal,
            'terms_difference' => $proposal->getTermsDifference(),
            'expected_return' => $proposal->calculateExpectedReturn(),
            'can_be_responded' => $proposal->canBeResponded(),
            'is_expired' => $proposal->isExpired()
        ]);
    }

    /**
     * Respond to an investment proposal (approve, reject, or counter-offer).
     */
    public function respond(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject,counter_offer',
            'response_message' => 'required|string|max:1000',
            'counter_terms' => 'required_if:action,counter_offer|array',
            'counter_terms.amount' => 'required_if:action,counter_offer|numeric|min:1000',
            'counter_terms.interest_rate' => 'required_if:action,counter_offer|numeric|min:0|max:100',
            'counter_terms.term_days' => 'required_if:action,counter_offer|integer|min:1|max:365',
            'counter_terms.discount_rate' => 'nullable|numeric|min:0|max:100',
            'counter_terms.commission_rate' => 'nullable|numeric|min:0|max:100',
            'counter_terms.negotiation_terms' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $proposal = InvestmentProposal::with(['invoice.company'])->findOrFail($id);
        $user = $request->user();
        
        // Verificar que el usuario tenga permisos para responder (debe ser de la empresa propietaria)
        if ($proposal->invoice->company->user_id !== $user->id) {
            return response()->json([
                'message' => 'No tienes permisos para responder a esta propuesta'
            ], Response::HTTP_FORBIDDEN);
        }
        
        // Verificar que la propuesta pueda ser respondida
        if (!$proposal->canBeResponded()) {
            return response()->json([
                'message' => 'Esta propuesta ya no puede ser respondida'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        DB::beginTransaction();
        try {
            $action = $request->action;
            
            if ($action === 'approve') {
                // Aprobar propuesta y crear inversión
                $proposal->update([
                    'status' => InvestmentProposal::STATUS_APPROVED,
                    'company_response' => $request->response_message,
                    'responded_by' => $user->id,
                    'responded_at' => now(),
                ]);
                
                // Crear la inversión basada en los términos propuestos
                $investment = Investment::create([
                    'user_id' => $proposal->investor_id,
                    'invoice_id' => $proposal->invoice_id,
                    'amount' => $proposal->proposed_amount,
                    'expected_return' => $proposal->calculateExpectedReturn(),
                    'investment_date' => now(),
                    'maturity_date' => now()->addDays($proposal->proposed_term_days),
                    'status' => Investment::STATUS_ACTIVE,
                    'return_rate' => $proposal->proposed_interest_rate,
                ]);
                
                // Actualizar estado de la factura
                $proposal->invoice->update(['status' => Invoice::STATUS_FUNDED]);
                
                $message = 'Propuesta aprobada e inversión creada exitosamente';
                
            } elseif ($action === 'reject') {
                $proposal->update([
                    'status' => InvestmentProposal::STATUS_REJECTED,
                    'company_response' => $request->response_message,
                    'responded_by' => $user->id,
                    'responded_at' => now(),
                ]);
                
                $message = 'Propuesta rechazada exitosamente';
                
            } elseif ($action === 'counter_offer') {
                // Marcar propuesta original como contraofertada
                $proposal->update([
                    'status' => InvestmentProposal::STATUS_COUNTER_OFFERED,
                    'company_response' => $request->response_message,
                    'responded_by' => $user->id,
                    'responded_at' => now(),
                ]);
                
                // Crear contraoferta
                $counterOffer = $proposal->createCounterOffer(
                    $request->counter_terms,
                    $request->response_message,
                    $user->id
                );
                
                $message = 'Contraoferta creada exitosamente';
            }
            
            DB::commit();
            
            $proposal->load(['investor', 'invoice.company', 'respondedBy']);
            
            return response()->json([
                'message' => $message,
                'proposal' => $proposal,
                'counter_offer' => $counterOffer ?? null
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al procesar la respuesta',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get proposals for investor dashboard.
     */
    public function investorProposals(Request $request)
    {
        $user = $request->user();
        
        $proposals = InvestmentProposal::with(['invoice.company', 'respondedBy'])
            ->where('investor_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return response()->json($proposals);
    }



    /**
     * Mark expired proposals.
     */
    public function markExpired()
    {
        $expiredCount = InvestmentProposal::expired()->update([
            'status' => InvestmentProposal::STATUS_EXPIRED
        ]);
        
        return response()->json([
            'message' => "Se marcaron {$expiredCount} propuestas como expiradas"
        ]);
    }

    /**
     * Get proposal statistics.
     */
    public function statistics(Request $request)
    {
        $query = InvestmentProposal::query();
        
        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }
        
        $statistics = [
            'total_proposals' => $query->count(),
            'pending_proposals' => $query->where('status', InvestmentProposal::STATUS_PENDING)->count(),
            'approved_proposals' => $query->where('status', InvestmentProposal::STATUS_APPROVED)->count(),
            'rejected_proposals' => $query->where('status', InvestmentProposal::STATUS_REJECTED)->count(),
            'counter_offered_proposals' => $query->where('status', InvestmentProposal::STATUS_COUNTER_OFFERED)->count(),
            'expired_proposals' => $query->where('status', InvestmentProposal::STATUS_EXPIRED)->count(),
            'total_proposed_amount' => $query->sum('proposed_amount'),
            'average_proposed_amount' => $query->avg('proposed_amount'),
            'average_interest_rate' => $query->avg('proposed_interest_rate'),
            'approval_rate' => $query->count() > 0 ? 
                ($query->where('status', InvestmentProposal::STATUS_APPROVED)->count() / $query->count()) * 100 : 0,
        ];
        
        return response()->json($statistics);
    }
}