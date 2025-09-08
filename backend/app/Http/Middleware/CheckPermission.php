<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        // Verificar si el usuario está autenticado
        if (!Auth::check()) {
            return response()->json([
                'message' => 'No autenticado'
            ], 401);
        }

        $user = Auth::user();
        
        // Verificar si el usuario tiene un rol asignado
        if (!$user->role) {
            return response()->json([
                'message' => 'Usuario sin rol asignado'
            ], 403);
        }

        // Verificar si el rol del usuario tiene el permiso requerido
        $hasPermission = $user->role->permissions()->where('name', $permission)->exists();
        
        if (!$hasPermission) {
            return response()->json([
                'message' => 'No tienes permisos para realizar esta acción',
                'required_permission' => $permission
            ], 403);
        }

        return $next($request);
    }
}
