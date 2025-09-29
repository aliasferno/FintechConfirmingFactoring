<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index()
    {
        $companies = Company::with(['user', 'invoices'])
            ->verified()
            ->paginate(15);
        
        return response()->json($companies);
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request)
    {
        // Log incoming request data for debugging
        \Log::info('Company registration request received:', $request->all());
        \Log::info('Authorization header:', ['auth' => $request->header('Authorization')]);
        \Log::info('Current user:', ['user' => auth()->user()]);
        
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',
            'business_name' => 'required|string|max:255',
            'tax_id' => 'required|string|max:50|unique:companies',
            'business_type' => 'required|in:Manufactura,Servicios,Comercio,Construcción,Tecnología,Salud,Educación,Transporte,Agricultura,Otros',
            'address' => 'required|string|max:500',
            'phone' => 'required|string|max:20',
            'monthly_revenue' => 'required|numeric|min:0',
            'years_in_business' => 'required|integer|min:0'
        ]);
        
        \Log::info('Validated company data:', $validatedData);

        // Set verification_status to 'verified' by default
        $validatedData['verification_status'] = 'verified';

        try {
            $company = Company::create($validatedData);
            \Log::info('Company created successfully:', ['company_id' => $company->id]);
        } catch (\Exception $e) {
            \Log::error('Error creating company:', ['error' => $e->getMessage(), 'data' => $validatedData]);
            return response()->json([
                'message' => 'Error creating company: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return response()->json([
            'message' => 'Company created successfully',
            'company' => $company->load(['user', 'invoices'])
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified company.
     */
    public function show(string $id)
    {
        $company = Company::with(['user', 'invoices'])->find($id);
        
        if (!$company) {
            return response()->json([
                'message' => 'Company not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($company);
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, string $id)
    {
        $company = Company::find($id);
        
        if (!$company) {
            return response()->json([
                'message' => 'Company not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'business_name' => 'sometimes|required|string|max:255',
            'tax_id' => 'sometimes|required|string|max:50|unique:companies,tax_id,' . $id,
            'business_type' => 'sometimes|required|in:Manufactura,Servicios,Comercio,Construcción,Tecnología,Salud,Educación,Transporte,Agricultura,Otros',
            'address' => 'sometimes|required|string|max:500',
            'phone' => 'sometimes|required|string|max:20',
            'monthly_revenue' => 'sometimes|required|numeric|min:0',
            'years_in_business' => 'sometimes|required|integer|min:0',
            'verification_status' => 'sometimes|required|in:pending,verified,rejected',
            'credit_score' => 'sometimes|nullable|integer|min:300|max:850',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $company->update($request->all());

        return response()->json([
            'message' => 'Company updated successfully',
            'company' => $company->load(['user', 'invoices'])
        ]);
    }

    /**
     * Remove the specified company.
     */
    public function destroy(string $id)
    {
        $company = Company::find($id);
        
        if (!$company) {
            return response()->json([
                'message' => 'Company not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $company->delete();

        return response()->json([
            'message' => 'Company deleted successfully'
        ]);
    }

    /**
     * Get companies with good credit.
     */
    public function goodCredit()
    {
        $companies = Company::goodCredit()
            ->with(['user', 'invoices'])
            ->paginate(15);
        
        return response()->json($companies);
    }

    /**
     * Get current user's company profile.
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $company = $user->company;
        
        if (!$company) {
            return response()->json([
                'message' => 'Company profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'company' => $company->load(['invoices'])
        ]);
    }

    /**
     * Update verification status.
     */
    public function updateVerificationStatus(Request $request, string $id)
    {
        $company = Company::find($id);
        
        if (!$company) {
            return response()->json([
                'message' => 'Company not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => 'required|in:pending,verified,rejected',
            'credit_score' => 'nullable|integer|min:300|max:850',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $company->update($request->only(['verification_status', 'credit_score']));

        return response()->json([
            'message' => 'Verification status updated successfully',
            'company' => $company
        ]);
    }
}
