<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request)
    {
        $query = Invoice::with(['company.user', 'investments']);
        
        // Filter by company if user is a company
        $user = auth()->user();
        if ($user && $user->hasRole('empresa') && $user->company) {
            $query->where('company_id', $user->company->id);
        }
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by verification status if provided
        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }
        
        // Filter by operation type if provided
        if ($request->has('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }
        
        // Filter approved invoices
        if ($request->has('approved') && $request->approved) {
            $query->approved();
        }
        
        // Filter funded invoices
        if ($request->has('funded') && $request->funded) {
            $query->funded();
        }
        
        // Filter expired invoices
        if ($request->has('expired') && $request->expired) {
            $query->where('status', 'expired');
        }
        
        // Exclude expired invoices
        if ($request->has('exclude_expired') && $request->exclude_expired) {
            $query->where(function($q) {
                $q->where('due_date', '>=', now())
                  ->orWhereNotIn('status', ['pending', 'approved']);
            });
        }
        
        $invoices = $query->orderBy('created_at', 'desc')->paginate(15);
        
        // Convert monetary values to float for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
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
        
        return response()->json($invoices);
    }

    /**
     * Get factoring invoices
     */
    public function getFactoringInvoices(Request $request)
    {
        $query = Invoice::with(['company.user', 'investments'])
            ->where('operation_type', 'factoring');

        // Filter by company if user is a company
        $user = auth()->user();
        if ($user && $user->hasRole('empresa') && $user->company) {
            $query->where('company_id', $user->company->id);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by verification status if provided
        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(15);

        // Convert monetary values to float for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
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

        return response()->json($invoices);
    }

    /**
     * Get confirming invoices
     */
    public function getConfirmingInvoices(Request $request)
    {
        $query = Invoice::with(['company.user', 'investments'])
            ->where('operation_type', 'confirming');

        // Filter by company if user is a company
        $user = auth()->user();
        if ($user && $user->hasRole('empresa') && $user->company) {
            $query->where('company_id', $user->company->id);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by verification status if provided
        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(15);

        // Convert monetary values to float for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
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

        return response()->json($invoices);
    }

    /**
     * Create a factoring invoice
     */
    public function createFactoringInvoice(Request $request)
    {
        \Log::info('createFactoringInvoice called', [
            'user_id' => auth()->id(),
            'user_authenticated' => auth()->check(),
            'request_method' => $request->method(),
            'request_headers' => $request->headers->all(),
            'request_data_keys' => array_keys($request->all())
        ]);

        $rules = [
            'invoice_number' => 'required|string|max:255|unique:invoices',
            'amount' => 'required|numeric|min:0',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after:issue_date',
            'client_name' => 'required|string|max:255',
            'client_tax_id' => 'required|string|max:20',
            'description' => 'nullable|string',
            'invoice_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            // Factoring specific fields
            'advance_percentage' => 'required|numeric|min:10|max:90',
            'commission_rate' => 'required|numeric|min:0.1|max:10',
            'expected_collection_date' => 'required|date|after:due_date',
            'credit_risk_assessment' => 'required|in:low,medium,high',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            \Log::error('Factoring invoice validation failed', [
                'request_data' => $request->all(),
                'request_files' => $request->files->all(),
                'validation_errors' => $validator->errors()->toArray(),
                'validation_rules' => $rules
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();
        if (!$user || !$user->hasRole('empresa') || !$user->company) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $invoiceData = $request->except(['invoice_file']);
        $invoiceData['company_id'] = $user->company->id;
        $invoiceData['operation_type'] = 'factoring';
        $invoiceData['status'] = 'pending';
        $invoiceData['verification_status'] = 'pending';

        // Calculate net amount based on discount rate
        if ($request->has('discount_rate')) {
            $invoiceData['net_amount'] = $invoiceData['amount'] * (1 - $request->discount_rate / 100);
        } else {
            $invoiceData['net_amount'] = $invoiceData['amount'];
        }

        // Handle file upload
        if ($request->hasFile('invoice_file')) {
            $file = $request->file('invoice_file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('invoices', $filename, 'public');
            $invoiceData['invoice_file_path'] = $path;
        }

        $invoice = Invoice::create($invoiceData);

        return response()->json([
            'message' => 'Factoring invoice created successfully',
            'invoice' => $invoice->load(['company.user'])
        ], 201);
    }

    /**
     * Create a confirming invoice
     */
    public function createConfirmingInvoice(Request $request)
    {
        $rules = [
            'invoice_number' => 'required|string|max:255|unique:invoices',
            'amount' => 'required|numeric|min:0',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after:issue_date',
            'client_name' => 'required|string|max:255',
            'client_tax_id' => 'required|string|max:20',
            'description' => 'nullable|string',
            'invoice_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            // Confirming specific fields
            'supplier_name' => 'required|string|max:255',
            'supplier_tax_id' => 'required|string|max:20',
            'payment_terms' => 'required|string|max:255',
            'early_payment_discount' => 'nullable|numeric|min:0|max:20',
            'confirmation_deadline' => 'required|date|after:issue_date|before:due_date',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();
        if (!$user->hasRole('empresa') || !$user->company) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $invoiceData = $request->except(['invoice_file']);
        $invoiceData['company_id'] = $user->company->id;
        $invoiceData['operation_type'] = 'confirming';
        $invoiceData['status'] = 'pending';
        $invoiceData['verification_status'] = 'pending';

        // Calculate net amount based on discount rate
        if ($request->has('discount_rate')) {
            $invoiceData['net_amount'] = $invoiceData['amount'] * (1 - $request->discount_rate / 100);
        } else {
            $invoiceData['net_amount'] = $invoiceData['amount'];
        }

        // Handle file upload
        if ($request->hasFile('invoice_file')) {
            $file = $request->file('invoice_file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('invoices', $filename, 'public');
            $invoiceData['invoice_file_path'] = $path;
        }

        $invoice = Invoice::create($invoiceData);

        return response()->json([
             'message' => 'Confirming invoice created successfully',
             'invoice' => $invoice->load(['company.user'])
         ], 201);
     }

     /**
      * Get a specific factoring invoice
      */
     public function getFactoringInvoice($id)
     {
         $invoice = Invoice::with(['company.user', 'investments'])
             ->where('operation_type', 'factoring')
             ->findOrFail($id);

         $user = auth()->user();
         if ($user->hasRole('empresa') && $user->company && $invoice->company_id !== $user->company->id) {
             return response()->json(['message' => 'Unauthorized'], 403);
         }

         // Convert monetary values to float
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

         return response()->json($invoice);
     }

     /**
      * Get a specific confirming invoice
      */
     public function getConfirmingInvoice($id)
     {
         $invoice = Invoice::with(['company.user', 'investments'])
             ->where('operation_type', 'confirming')
             ->findOrFail($id);

         $user = auth()->user();
         if ($user->hasRole('empresa') && $user->company && $invoice->company_id !== $user->company->id) {
             return response()->json(['message' => 'Unauthorized'], 403);
         }

         // Convert monetary values to float
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

         return response()->json($invoice);
     }

     /**
      * Update a factoring invoice
      */
     public function updateFactoringInvoice(Request $request, $id)
     {
         $invoice = Invoice::where('operation_type', 'factoring')->findOrFail($id);

         $user = auth()->user();
         if ($user->hasRole('empresa') && $user->company && $invoice->company_id !== $user->company->id) {
             return response()->json(['message' => 'Unauthorized'], 403);
         }

         $rules = [
             'invoice_number' => 'sometimes|string|max:255|unique:invoices,invoice_number,' . $id,
             'amount' => 'sometimes|numeric|min:0',
             'due_date' => 'sometimes|date|after:today',
             'client_name' => 'sometimes|string|max:255',
             'client_tax_id' => 'sometimes|string|max:20',
             'description' => 'nullable|string',
             'invoice_file' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:10240',
             // Factoring specific fields
             'advance_percentage' => 'sometimes|numeric|min:10|max:90',
             'commission_rate' => 'sometimes|numeric|min:0.1|max:10',
             'expected_collection_date' => 'sometimes|date|after:due_date',
             'credit_risk_assessment' => 'sometimes|in:low,medium,high',
         ];

         $validator = Validator::make($request->all(), $rules);

         if ($validator->fails()) {
             return response()->json([
                 'message' => 'Validation failed',
                 'errors' => $validator->errors()
             ], 422);
         }

         $updateData = $request->except(['invoice_file']);

         // Calculate net amount if amount or discount_rate changed
         if ($request->has('amount') || $request->has('discount_rate')) {
             $amount = $request->has('amount') ? $request->amount : $invoice->amount;
             $discountRate = $request->has('discount_rate') ? $request->discount_rate : ($invoice->discount_rate ?? 0);
             $updateData['net_amount'] = $amount * (1 - $discountRate / 100);
         }

         // Handle file upload
         if ($request->hasFile('invoice_file')) {
             // Delete old file if exists
             if ($invoice->invoice_file_path) {
                 Storage::disk('public')->delete($invoice->invoice_file_path);
             }

             $file = $request->file('invoice_file');
             $filename = time() . '_' . $file->getClientOriginalName();
             $path = $file->storeAs('invoices', $filename, 'public');
             $updateData['invoice_file_path'] = $path;
         }

         $invoice->update($updateData);

         return response()->json([
             'message' => 'Factoring invoice updated successfully',
             'invoice' => $invoice->fresh(['company.user', 'investments'])
         ]);
     }

     /**
      * Update a confirming invoice
      */
     public function updateConfirmingInvoice(Request $request, $id)
     {
         $invoice = Invoice::where('operation_type', 'confirming')->findOrFail($id);

         $user = auth()->user();
         if ($user->hasRole('empresa') && $user->company && $invoice->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

         $rules = [
             'invoice_number' => 'sometimes|string|max:255|unique:invoices,invoice_number,' . $id,
             'amount' => 'sometimes|numeric|min:0',
             'due_date' => 'sometimes|date|after:today',
             'client_name' => 'sometimes|string|max:255',
             'client_tax_id' => 'sometimes|string|max:20',
             'description' => 'nullable|string',
             'invoice_file' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:10240',
             // Confirming specific fields
             'supplier_name' => 'sometimes|string|max:255',
             'supplier_tax_id' => 'sometimes|string|max:20',
             'payment_terms' => 'sometimes|string|max:255',
             'early_payment_discount' => 'nullable|numeric|min:0|max:20',
             'confirmation_deadline' => 'sometimes|date|after:today|before:due_date',
         ];

         $validator = Validator::make($request->all(), $rules);

         if ($validator->fails()) {
             return response()->json([
                 'message' => 'Validation failed',
                 'errors' => $validator->errors()
             ], 422);
         }

         $updateData = $request->except(['invoice_file']);

         // Calculate net amount if amount or discount_rate changed
         if ($request->has('amount') || $request->has('discount_rate')) {
             $amount = $request->has('amount') ? $request->amount : $invoice->amount;
             $discountRate = $request->has('discount_rate') ? $request->discount_rate : ($invoice->discount_rate ?? 0);
             $updateData['net_amount'] = $amount * (1 - $discountRate / 100);
         }

         // Handle file upload
         if ($request->hasFile('invoice_file')) {
             // Delete old file if exists
             if ($invoice->invoice_file_path) {
                 Storage::disk('public')->delete($invoice->invoice_file_path);
             }

             $file = $request->file('invoice_file');
             $filename = time() . '_' . $file->getClientOriginalName();
             $path = $file->storeAs('invoices', $filename, 'public');
             $updateData['invoice_file_path'] = $path;
         }

         $invoice->update($updateData);

         return response()->json([
             'message' => 'Confirming invoice updated successfully',
             'invoice' => $invoice->fresh(['company.user', 'investments'])
         ]);
     }

     /**
      * Store a newly created invoice.
      */
    public function store(Request $request)
    {
        // Get the authenticated user
        $user = auth()->user();
        
        // Check if user is a company and has a company profile
        if (!$user || !$user->hasRole('empresa') || !$user->company) {
            return response()->json([
                'message' => 'User must be a company with a valid company profile'
            ], Response::HTTP_FORBIDDEN);
        }

        // Base validation rules
        $rules = [
            'invoice_number' => 'required|string|max:255|unique:invoices',
            'client_name' => 'required|string|max:255',
            'client_tax_id' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after:issue_date',
            'operation_type' => 'required|in:confirming,factoring',
            'description' => 'nullable|string|max:1000',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB max
        ];
        
        // Add operation-specific validation rules
        if ($request->operation_type === 'factoring') {
            $rules = array_merge($rules, [
                'advance_percentage' => 'required|numeric|min:10|max:90',
                'commission_rate' => 'required|numeric|min:0.1|max:10',
                'expected_collection_date' => 'required|date|after:due_date',
                'credit_risk_assessment' => 'required|in:low,medium,high',
            ]);
        } elseif ($request->operation_type === 'confirming') {
            $rules = array_merge($rules, [
                'supplier_name' => 'required|string|max:255',
                'supplier_tax_id' => 'required|string|max:255',
                'payment_terms' => 'required|string|max:255',
                'early_payment_discount' => 'nullable|numeric|min:0|max:100',
                'confirmation_deadline' => 'required|date|after:issue_date',
            ]);
        }
        
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $invoiceData = $request->except('document');
        
        // Set the company_id from the authenticated user's company
        $invoiceData['company_id'] = $user->company->id;
        
        // Handle file upload
        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $path = $file->store('invoices', 'public');
            $invoiceData['document_path'] = $path;
        }

        $invoice = Invoice::create($invoiceData);

        return response()->json([
            'message' => 'Invoice created successfully',
            'invoice' => $invoice->load(['company.user', 'investments'])
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified invoice.
     */
    public function show(string $id)
    {
        $invoice = Invoice::with(['company.user', 'investments'])->find($id);
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Convert monetary values to float
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

        return response()->json($invoice);
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, string $id)
    {
        $invoice = Invoice::find($id);
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Base validation rules for update
        $rules = [
            'invoice_number' => 'sometimes|required|string|max:255|unique:invoices,invoice_number,' . $id,
            'client_name' => 'sometimes|required|string|max:255',
            'client_tax_id' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'issue_date' => 'sometimes|required|date',
            'due_date' => 'sometimes|required|date|after:issue_date',
            'status' => 'sometimes|required|in:pending,approved,funded,paid,rejected',
            'risk_score' => 'sometimes|nullable|integer|min:0|max:100',
            'discount_rate' => 'sometimes|nullable|numeric|min:0|max:1',
            'verification_status' => 'sometimes|required|in:pending,verified,rejected',
            'operation_type' => 'sometimes|required|in:confirming,factoring',
            'description' => 'sometimes|nullable|string|max:1000',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
        
        // Add operation-specific validation rules for update
        $operationType = $request->operation_type ?? $invoice->operation_type;
        if ($operationType === 'factoring') {
            $rules = array_merge($rules, [
                'advance_percentage' => 'sometimes|required|numeric|min:0|max:100',
                'commission_rate' => 'sometimes|required|numeric|min:0|max:1',
                'expected_collection_date' => 'sometimes|required|date|after:due_date',
                'credit_risk_assessment' => 'sometimes|required|in:low,medium,high',
            ]);
        } elseif ($operationType === 'confirming') {
            $rules = array_merge($rules, [
                'supplier_name' => 'sometimes|required|string|max:255',
                'supplier_tax_id' => 'sometimes|required|string|max:255',
                'payment_terms' => 'sometimes|required|string|max:255',
                'early_payment_discount' => 'sometimes|nullable|numeric|min:0|max:100',
                'confirmation_deadline' => 'sometimes|required|date|after:issue_date',
            ]);
        }
        
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $updateData = $request->except('document');
        
        // Handle file upload
        if ($request->hasFile('document')) {
            // Delete old file if exists
            if ($invoice->document_path) {
                Storage::disk('public')->delete($invoice->document_path);
            }
            
            $file = $request->file('document');
            $path = $file->store('invoices', 'public');
            $updateData['document_path'] = $path;
        }
        
        // Calculate net amount if discount rate is provided
        if (isset($updateData['discount_rate']) && isset($updateData['amount'])) {
            $updateData['net_amount'] = $updateData['amount'] * (1 - $updateData['discount_rate']);
        } elseif (isset($updateData['discount_rate'])) {
            $updateData['net_amount'] = $invoice->amount * (1 - $updateData['discount_rate']);
        } elseif (isset($updateData['amount']) && $invoice->discount_rate) {
            $updateData['net_amount'] = $updateData['amount'] * (1 - $invoice->discount_rate);
        }

        $invoice->update($updateData);

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice->load(['company.user', 'investments'])
        ]);
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy(string $id)
    {
        $invoice = Invoice::find($id);
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Delete associated file
        if ($invoice->document_path) {
            Storage::disk('public')->delete($invoice->document_path);
        }

        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully'
        ]);
    }

    /**
     * Get approved invoices available for investment.
     */
    public function availableForInvestment()
    {
        $invoices = Invoice::approved()
            ->with(['company.user'])
            ->whereHas('company', function ($query) {
                $query->where('verification_status', 'verified');
            })
            ->paginate(15);
        
        // Convert monetary values to float for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
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
        
        return response()->json($invoices);
    }

    /**
     * Update verification status.
     */
    public function updateVerificationStatus(Request $request, string $id)
    {
        $invoice = Invoice::find($id);
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => 'required|in:pending,verified,rejected',
            'risk_score' => 'nullable|integer|min:0|max:100',
            'discount_rate' => 'nullable|numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $updateData = $request->only(['verification_status', 'risk_score', 'discount_rate']);
        
        // Calculate net amount if discount rate is provided
        if (isset($updateData['discount_rate'])) {
            $updateData['net_amount'] = $invoice->amount * (1 - $updateData['discount_rate']);
        }
        
        // Update status to approved if verified
        if ($updateData['verification_status'] === 'verified') {
            $updateData['status'] = 'approved';
        }

        $invoice->update($updateData);

        return response()->json([
            'message' => 'Verification status updated successfully',
            'invoice' => $invoice
        ]);
    }

    /**
     * Get invoices by company.
     */
    public function byCompany(Request $request, string $companyId)
    {
        $invoices = Invoice::where('company_id', $companyId)
            ->with(['investments'])
            ->paginate(15);
        
        // Convert monetary values to float for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
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
        
        return response()->json($invoices);
    }

    /**
     * Get invoice statistics for dashboard.
     */
    public function stats(Request $request)
    {
        $user = auth()->user();
        
        // If user is a company, get stats for their invoices only
        if ($user && $user->hasRole('empresa') && $user->company) {
            $companyId = $user->company->id;
            
            $totalFacturas = Invoice::where('company_id', $companyId)->count();
            $facturasPendientes = Invoice::where('company_id', $companyId)
                ->where('status', 'pending')
                ->count();
            $facturasCaducadas = Invoice::where('company_id', $companyId)
                ->where('status', 'expired')
                ->count();
            $montoTotal = (float) Invoice::where('company_id', $companyId)
                ->sum('amount');
            $montoDisponible = (float) Invoice::where('company_id', $companyId)
                ->where('status', 'approved')
                ->sum('net_amount');
            
            // Get recent activities (last 10 invoices)
            $recentInvoices = Invoice::where('company_id', $companyId)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
            
            $recentActivities = $recentInvoices->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'type' => 'factura_creada',
                    'description' => "Factura #{$invoice->invoice_number} creada",
                    'amount' => (float) $invoice->amount,
                    'date' => $invoice->created_at
                ];
            });
            
            return response()->json([
                'totalFacturas' => $totalFacturas,
                'facturasPendientes' => $facturasPendientes,
                'facturasCaducadas' => $facturasCaducadas,
                'montoTotal' => $montoTotal,
                'montoDisponible' => $montoDisponible ?: 0,
                'recentActivities' => $recentActivities,
                'facturasPorTipo' => [
                    'confirming' => Invoice::where('company_id', $companyId)
                        ->where('operation_type', 'confirming')
                        ->count(),
                    'factoring' => Invoice::where('company_id', $companyId)
                        ->where('operation_type', 'factoring')
                        ->count()
                ]
            ]);
        }
        
        // For admin users or general stats
        $totalFacturas = Invoice::count();
        $facturasPendientes = Invoice::where('status', 'pending')->count();
        $facturasCaducadas = Invoice::where('status', 'expired')->count();
        $montoTotal = (float) Invoice::sum('amount');
        $montoDisponible = (float) Invoice::where('status', 'approved')->sum('net_amount');
        
        // Get recent activities (last 10 invoices)
        $recentInvoices = Invoice::orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        $recentActivities = $recentInvoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'type' => $invoice->operation_type,
                'description' => "Factura #{$invoice->invoice_number} - {$invoice->client_name}",
                'amount' => (float) $invoice->amount,
                'date' => $invoice->created_at
            ];
        });
        
        return response()->json([
            'totalFacturas' => $totalFacturas,
            'facturasPendientes' => $facturasPendientes,
            'facturasCaducadas' => $facturasCaducadas,
            'montoTotal' => $montoTotal,
            'montoDisponible' => $montoDisponible ?: 0,
            'recentActivities' => $recentActivities,
            'facturasPorTipo' => [
                'confirming' => Invoice::where('operation_type', 'confirming')->count(),
                'factoring' => Invoice::where('operation_type', 'factoring')->count()
            ]
        ]);
    }

    /**
     * Update expired invoices by calling the Artisan command
     */
    public function updateExpiredInvoices()
    {
        try {
            // Execute the Artisan command
            \Illuminate\Support\Facades\Artisan::call('invoices:update-expired');
            
            // Get the count of updated invoices
            $expiredCount = Invoice::where('status', Invoice::STATUS_EXPIRED)
                ->where('updated_at', '>=', now()->subMinute())
                ->count();
            
            return response()->json([
                'message' => 'Expired invoices updated successfully',
                'updated_count' => $expiredCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating expired invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Public method to get all invoices for investment opportunities (no authentication required).
     */
    public function publicIndex(Request $request)
    {
        $query = Invoice::approved()
            ->with(['company.user'])
            ->whereHas('company', function ($query) {
                $query->where('verification_status', 'verified');
            });
        
        // Filter by operation type if provided
        if ($request->has('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }
        
        $invoices = $query->paginate(15);
        
        // Convert monetary values to float for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
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
        
        return response()->json($invoices);
    }

    /**
     * Public method to get a specific invoice for investment opportunities (no authentication required).
     */
    public function publicShow(string $id)
    {
        $invoice = Invoice::approved()
            ->with(['company.user'])
            ->whereHas('company', function ($query) {
                $query->where('verification_status', 'verified');
            })
            ->find($id);
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found or not available for investment'
            ], Response::HTTP_NOT_FOUND);
        }
        
        // Convert monetary values to float
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
        
        return response()->json($invoice);
    }

    /**
     * Approve an invoice
     */
    public function approve(string $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        // Check if user has permission to approve this invoice
        $user = auth()->user();
        if ($user->hasRole('empresa') && $user->company && $invoice->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Update invoice status to approved and verification status to verified
        $invoice->update([
            'status' => 'approved',
            'verification_status' => 'verified'
        ]);
        
        return response()->json([
            'message' => 'Invoice approved successfully',
            'invoice' => $invoice->fresh(['company.user', 'investments'])
        ]);
    }
}
