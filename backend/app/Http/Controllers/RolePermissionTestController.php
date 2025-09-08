<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionTestController extends Controller
{
    /**
     * Get current user's role and permissions.
     */
    public function getUserRoleInfo()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
            ],
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'display_name' => $user->role->display_name,
            ] : null,
            'permissions' => $user->getPermissions()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'resource' => $permission->resource,
                ];
            })
        ]);
    }

    /**
     * Test endpoint that requires 'companies.view' permission.
     */
    public function testCompaniesView()
    {
        return response()->json([
            'message' => 'Tienes acceso para ver empresas',
            'data' => [
                'companies' => [
                    ['id' => 1, 'name' => 'Empresa Test 1'],
                    ['id' => 2, 'name' => 'Empresa Test 2'],
                ]
            ]
        ]);
    }

    /**
     * Test endpoint that requires 'companies.create' permission.
     */
    public function testCompaniesCreate()
    {
        return response()->json([
            'message' => 'Tienes acceso para crear empresas',
            'action' => 'create_company'
        ]);
    }

    /**
     * Test endpoint that requires 'investments.view' permission.
     */
    public function testInvestmentsView()
    {
        return response()->json([
            'message' => 'Tienes acceso para ver inversiones',
            'data' => [
                'investments' => [
                    ['id' => 1, 'amount' => 10000, 'company' => 'Empresa A'],
                    ['id' => 2, 'amount' => 25000, 'company' => 'Empresa B'],
                ]
            ]
        ]);
    }

    /**
     * Test endpoint that requires 'users.manage' permission (admin only).
     */
    public function testUsersManage()
    {
        return response()->json([
            'message' => 'Tienes acceso para gestionar usuarios (solo admin)',
            'action' => 'manage_users'
        ]);
    }

    /**
     * Get all roles and their permissions.
     */
    public function getRolesAndPermissions()
    {
        $roles = Role::with('permissions')->get();
        
        return response()->json([
            'roles' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'permissions' => $role->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'display_name' => $permission->display_name,
                            'resource' => $permission->resource,
                        ];
                    })
                ];
            })
        ]);
    }
}
