<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index()
    {
        $users = User::with(['company', 'investor'])->paginate(15);
        return response()->json($users);
    }

    /**
     * Register a new user.
     */
    public function store(Request $request)
    {
        \Log::info('Registro de usuario - Datos recibidos:', $request->all());
        
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'user_type' => 'required|in:empresa,inversor,admin',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'identification_number' => 'nullable|string|max:50|unique:users',
        ]);

        if ($validator->fails()) {
            \Log::error('Validación fallida en registro:', $validator->errors()->toArray());
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Verificar si ya existe un usuario con el mismo email y user_type
        $existingUser = User::where('email', $request->email)
                           ->where('user_type', $request->user_type)
                           ->first();
        
        if ($existingUser) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['email' => ['Ya existe un usuario con este email y tipo de perfil.']]
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Obtener el rol correspondiente al user_type
        $role = null;
        switch ($request->user_type) {
            case 'empresa':
                $role = \App\Models\Role::where('name', 'empresa')->first();
                break;
            case 'inversor':
                $role = \App\Models\Role::where('name', 'inversor')->first();
                break;
            case 'admin':
                $role = \App\Models\Role::where('name', 'admin')->first();
                break;
        }

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_type' => $request->user_type,
            'role_id' => $role ? $role->id : null,
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth,
            'identification_number' => $request->identification_number,
        ]);

        // El rol ya se asignó mediante role_id en la creación del usuario

        // Send email verification notification
        $user->sendEmailVerificationNotification();

        // Generar token de autenticación para el usuario recién registrado
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario creado exitosamente. Se ha enviado un email de verificación.',
            'user' => $user->load(['company', 'investor']),
            'token' => $token,
            'email_verification_sent' => true
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified user.
     */
    public function show(string $id)
    {
        $user = User::with(['company', 'investor', 'investments'])->find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($user);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, string $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255',
            'password' => 'sometimes|required|string|min:8|confirmed',
            'user_type' => 'sometimes|required|in:empresa,inversor,admin',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'identification_number' => 'nullable|string|max:50|unique:users,identification_number,' . $id,
            'verification_status' => 'sometimes|required|in:pending,verified,rejected',
        ]);

        // Si se está actualizando el email, verificar que no exista con el mismo user_type
        if ($request->has('email')) {
            $existingUser = User::where('email', $request->email)
                               ->where('user_type', $request->user_type ?? $user->user_type)
                               ->where('id', '!=', $id)
                               ->first();
            
            if ($existingUser) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => ['email' => ['Ya existe un usuario con este email y tipo de perfil.']]
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $updateData = $request->only([
            'name', 'email', 'user_type', 'phone', 'date_of_birth', 
            'identification_number', 'verification_status'
        ]);

        if ($request->has('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load(['company', 'investor'])
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(string $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }



    /**
     * Login user.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'user_type' => 'sometimes|required|in:empresa,inversor,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Preparar credenciales para autenticación
        $credentials = $request->only('email', 'password');
        
        // Si se proporciona user_type, incluirlo en las credenciales
        if ($request->has('user_type')) {
            $credentials['user_type'] = $request->user_type;
        }

        // Verificar credenciales
        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'user' => $user->load(['company', 'investor']),
            'token' => $token
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }

    /**
     * Get current authenticated user.
     */
    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load(['company', 'investor', 'investments'])
        ]);
    }

    /**
     * Check available user types for an email.
     */
    public function checkEmailProfiles(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $users = User::where('email', $request->email)
                    ->select('user_type', 'name')
                    ->get();

        if ($users->isEmpty()) {
            return response()->json([
                'message' => 'No user found with this email',
                'profiles' => []
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'message' => 'Profiles found',
            'profiles' => $users->map(function($user) {
                return [
                    'user_type' => $user->user_type,
                    'name' => $user->name
                ];
            })
        ]);
    }
}
