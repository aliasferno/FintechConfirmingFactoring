import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener los roles requeridos de la ruta
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No se requieren roles específicos
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.some((userRole: any) => userRole.name === role)
    );

    if (!hasRequiredRole) {
      // Redirigir a una página de acceso denegado o dashboard apropiado
      if (user.user_type === 'empresa') {
        this.router.navigate(['/dashboard/empresa']);
      } else {
        this.router.navigate(['/dashboard/inversor']);
      }
      return false;
    }

    return true;
  }
}