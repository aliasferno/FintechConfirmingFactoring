<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestEmailVerificationController extends Controller
{
    /**
     * Manually verify a user's email for testing purposes.
     */
    public function manualVerify(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id'
        ]);

        $user = User::find($request->user_id);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Mark email as verified
        $user->email_verified_at = Carbon::now();
        $user->verification_status = 'verified';
        $user->save();

        return response()->json([
            'message' => 'Email verificado exitosamente',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'verification_status' => $user->verification_status,
                'email_verified_at' => $user->email_verified_at,
                'is_verified' => $user->isVerified()
            ]
        ]);
    }

    /**
     * Check verification status of a user.
     */
    public function checkVerificationStatus(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id'
        ]);

        $user = User::find($request->user_id);
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'verification_status' => $user->verification_status,
                'email_verified_at' => $user->email_verified_at,
                'is_verified' => $user->isVerified(),
                'has_verified_email' => $user->hasVerifiedEmail()
            ]
        ]);
    }

    /**
     * Resend verification email.
     */
    public function resendVerification(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id'
        ]);

        $user = User::find($request->user_id);
        
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'El email ya está verificado'
            ], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Email de verificación reenviado exitosamente',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'verification_status' => $user->verification_status
            ]
        ]);
    }
}