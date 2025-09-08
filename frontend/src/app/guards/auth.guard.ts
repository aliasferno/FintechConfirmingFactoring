import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      // Verificar si el usuario tiene acceso a la ruta específica
      const currentUser = this.authService.getCurrentUser();
      const userType = currentUser?.user_type;
      const routePath = route.routeConfig?.path;

      // Verificar acceso basado en el tipo de usuario
      if (routePath?.includes('dashboard/empresa') && userType !== 'empresa') {
        this.router.navigate(['/dashboard/inversor']);
        return false;
      }

      if (routePath?.includes('dashboard/inversor') && userType !== 'inversor') {
        this.router.navigate(['/dashboard/empresa']);
        return false;
      }

      return true;
    } else {
      // Redirigir al login si no está autenticado
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  }
}