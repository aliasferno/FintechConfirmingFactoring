import { Routes } from '@angular/router';
import { RegisterComponent } from './register.component';
import { LoginComponent } from './login.component';
import { DashboardEmpresaComponent } from './dashboard-empresa.component';
import { DashboardInversorComponent } from './dashboard-inversor.component';
import { NuevaFacturaComponent } from './nueva-factura.component';
import { FacturasListComponent } from './facturas-list.component';
import { FacturaDetalleComponent } from './factura-detalle.component';
import { FacturaEditarComponent } from './factura-editar.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'dashboard/empresa',
    component: DashboardEmpresaComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/inversor',
    component: DashboardInversorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'facturas/nueva',
    component: NuevaFacturaComponent,
    canActivate: [AuthGuard]
  },
  { path: 'facturas', component: FacturasListComponent, canActivate: [AuthGuard] },
  { path: 'facturas/detalle/:id', component: FacturaDetalleComponent, canActivate: [AuthGuard] },
  { path: 'facturas/editar/:id', component: FacturaEditarComponent, canActivate: [AuthGuard] },
  { 
    path: 'dashboard', 
    redirectTo: '/dashboard/empresa', 
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];