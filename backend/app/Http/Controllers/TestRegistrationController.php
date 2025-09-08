<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class TestRegistrationController extends Controller
{
    /**
     * Test company registration with automatic role assignment.
     */
    public function testCompanyRegistration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find empresa role
        $empresaRole = Role::where('name', Role::EMPRESA)->first();
        if (!$empresaRole) {
            return response()->json([
                'message' => 'Empresa role not found'
            ], 500);
        }

        // Create user with empresa role
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_type' => 'empresa',
            'phone' => $request->phone,
            'role_id' => $empresaRole->id
        ]);

        // Send email verification
        $user->sendEmailVerificationNotification();

        // Generate token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Company user registered successfully. Email verification sent.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'role' => $user->role->display_name,
                'verification_status' => $user->verification_status
            ],
            'token' => $token,
            'permissions' => $user->getPermissions()->pluck('name'),
            'email_verification_sent' => true
        ], 201);
    }

    /**
     * Test investor registration with automatic role assignment.
     */
    public function testInvestorRegistration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find inversor role
        $inversorRole = Role::where('name', Role::INVERSOR)->first();
        if (!$inversorRole) {
            return response()->json([
                'message' => 'Inversor role not found'
            ], 500);
        }

        // Create user with inversor role
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_type' => 'inversor',
            'phone' => $request->phone,
            'role_id' => $inversorRole->id
        ]);

        // Send email verification
        $user->sendEmailVerificationNotification();

        // Generate token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Investor user registered successfully. Email verification sent.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'role' => $user->role->display_name,
                'verification_status' => $user->verification_status
            ],
            'token' => $token,
            'permissions' => $user->getPermissions()->pluck('name'),
            'email_verification_sent' => true
        ], 201);
    }
}