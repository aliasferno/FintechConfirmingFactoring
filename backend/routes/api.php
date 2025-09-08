<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\InvestmentController;
use App\Http\Controllers\RolePermissionTestController;
use App\Http\Controllers\TestEmailVerificationController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/login', [UserController::class, 'login']);
Route::post('/check-email-profiles', [UserController::class, 'checkEmailProfiles']);
Route::get('/test-route', function() { return response()->json(['message' => 'Test route works']); });
Route::post('/test-post', function() { return response()->json(['message' => 'Test POST route works']); });
Route::post('/register', [UserController::class, 'store']);



// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', [UserController::class, 'profile']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::apiResource('users', UserController::class);
    
    // Company routes
    Route::get('/companies/good-credit', [CompanyController::class, 'goodCredit']);
    Route::get('/companies/profile', [CompanyController::class, 'profile']);
    Route::put('/companies/{id}/verification-status', [CompanyController::class, 'updateVerificationStatus']);
    Route::apiResource('companies', CompanyController::class);
    
    // Invoice routes
    Route::get('/invoices/stats', [InvoiceController::class, 'stats']);
    Route::get('/invoices/available-for-investment', [InvoiceController::class, 'availableForInvestment']);
    Route::put('/invoices/{id}/verification-status', [InvoiceController::class, 'updateVerificationStatus']);
    Route::get('/invoices/by-company/{companyId}', [InvoiceController::class, 'byCompany']);
    
    // Factoring specific routes
    Route::prefix('invoices/factoring')->group(function () {
        Route::get('/', [InvoiceController::class, 'getFactoringInvoices']);
        Route::post('/', [InvoiceController::class, 'createFactoringInvoice']);
        Route::get('/{id}', [InvoiceController::class, 'getFactoringInvoice']);
        Route::put('/{id}', [InvoiceController::class, 'updateFactoringInvoice']);
        Route::post('/validate-client', [InvoiceController::class, 'validateFactoringClient']);
        Route::post('/credit-evaluation', [InvoiceController::class, 'evaluateFactoringCredit']);
    });
    
    // Confirming specific routes
    Route::prefix('invoices/confirming')->group(function () {
        Route::get('/', [InvoiceController::class, 'getConfirmingInvoices']);
        Route::post('/', [InvoiceController::class, 'createConfirmingInvoice']);
        Route::get('/{id}', [InvoiceController::class, 'getConfirmingInvoice']);
        Route::put('/{id}', [InvoiceController::class, 'updateConfirmingInvoice']);
        Route::post('/validate-supplier', [InvoiceController::class, 'validateConfirmingSupplier']);
        Route::post('/conformity-check', [InvoiceController::class, 'checkConfirmingConformity']);
    });
    
    Route::apiResource('invoices', InvoiceController::class);
    
    // Investor routes
    Route::get('/investors/{id}/portfolio', [InvestorController::class, 'portfolio']);
    Route::get('/investors/{id}/opportunities', [InvestorController::class, 'opportunities']);
    Route::put('/investors/{id}/verification-status', [InvestorController::class, 'updateVerificationStatus']);
    Route::get('/investors/profile', [InvestorController::class, 'profile']);
    Route::apiResource('investors', InvestorController::class);
    
    // Investment routes
    Route::get('/investments/investor-stats', [InvestmentController::class, 'investorStats']);
    Route::get('/investments/statistics', [InvestmentController::class, 'statistics']);
    Route::get('/investments/opportunities', [InvestmentController::class, 'opportunities']);
    Route::put('/investments/{id}/process-return', [InvestmentController::class, 'processReturn']);
    Route::apiResource('investments', InvestmentController::class);
    
    // Role and Permission Test Routes
    Route::prefix('test-permissions')->group(function () {
        // Get user role info (no specific permission required)
        Route::get('/user-info', [RolePermissionTestController::class, 'getUserRoleInfo']);
        
        // Get all roles and permissions (no specific permission required)
        Route::get('/roles-permissions', [RolePermissionTestController::class, 'getRolesAndPermissions']);
        
        // Test endpoints with specific permissions
        Route::get('/companies-view', [RolePermissionTestController::class, 'testCompaniesView'])
            ->middleware('permission:view_companies');
            
        Route::get('/companies-create', [RolePermissionTestController::class, 'testCompaniesCreate'])
            ->middleware('permission:create_company');
            
        Route::get('/investments-view', [RolePermissionTestController::class, 'testInvestmentsView'])
            ->middleware('permission:view_investments');
            
        Route::get('/users-manage', [RolePermissionTestController::class, 'testUsersManage'])
            ->middleware('permission:manage_users');
    });
});

// Email verification routes
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    
    return response()->json([
        'message' => 'Email verificado exitosamente',
        'verified' => true
    ]);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    
    return response()->json([
        'message' => 'Enlace de verificación enviado'
    ]);
})->middleware(['auth:sanctum', 'throttle:6,1'])->name('verification.send');

// Test registration routes (for frontend integration testing)
Route::post('/test-registration/company', [App\Http\Controllers\TestRegistrationController::class, 'testCompanyRegistration']);
Route::post('/test-registration/investor', [App\Http\Controllers\TestRegistrationController::class, 'testInvestorRegistration']);

// Test email verification routes
Route::post('/test-verification/manual-verify', [TestEmailVerificationController::class, 'manualVerify']);
Route::post('/test-verification/check-status', [TestEmailVerificationController::class, 'checkVerificationStatus']);
Route::post('/test-verification/resend', [TestEmailVerificationController::class, 'resendVerification']);

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'service' => 'Fintech Confirming Factoring API'
    ]);
});