import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { CompanyService } from './services/company.service';
import { InvoiceService } from './services/invoice.service';
import { FacturasListComponent } from './facturas-list.component';

interface DashboardStats {
  totalFacturas: number;
  facturasPendientes: number;
  montoTotal: number;
  montoDisponible: number;
}

interface RecentActivity {
  id: string;
  type: 'factura_creada' | 'factura_aprobada' | 'pago_recibido';
  description: string;
  amount?: number;
  date: Date;
}

@Component({
  selector: 'app-dashboard-empresa',
  standalone: true,
  imports: [CommonModule, FacturasListComponent],
  templateUrl: './dashboard-empresa.component.html',
  styleUrls: ['./dashboard-empresa.component.css']
})
export class DashboardEmpresaComponent implements OnInit {
  user = signal<User | null>(null);
  stats = signal<DashboardStats>({
    totalFacturas: 0,
    facturasPendientes: 0,
    montoTotal: 0,
    montoDisponible: 0
  });
  recentActivities = signal<RecentActivity[]>([]);
  isLoading = signal(true);
  error = signal('');
  showFacturasList = signal(false);
  facturasListType = signal<'all' | 'pending'>('all');

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private invoiceService: InvoiceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadDashboardData();
  }

  private loadUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.set(currentUser);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private loadDashboardData() {
    this.isLoading.set(true);
    this.error.set('');
    
    this.invoiceService.getInvoiceStats().subscribe({
      next: (data) => {
        this.stats.set({
          totalFacturas: data.totalFacturas,
          facturasPendientes: data.facturasPendientes,
          montoTotal: data.montoTotal,
          montoDisponible: data.montoDisponible
        });

        // Convert recent activities from API response
        if (data.recentActivities) {
          const activities = data.recentActivities.map((activity: any) => ({
            id: activity.id.toString(),
            type: activity.type as 'factura_creada' | 'factura_aprobada' | 'pago_recibido',
            description: activity.description,
            amount: activity.amount,
            date: new Date(activity.date)
          }));
          this.recentActivities.set(activities);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error.set('Error al cargar los datos del dashboard');
        this.isLoading.set(false);
        
        // Set default values on error
        this.stats.set({
          totalFacturas: 0,
          facturasPendientes: 0,
          montoTotal: 0,
          montoDisponible: 0
        });
        this.recentActivities.set([]);
      }
    });
  }

  navigateToFacturas() {
    this.router.navigate(['/facturas']);
  }

  showTotalFacturas() {
    this.facturasListType.set('all');
    this.showFacturasList.set(true);
  }

  showFacturasPendientes() {
    this.facturasListType.set('pending');
    this.showFacturasList.set(true);
  }

  hideFacturasList() {
    this.showFacturasList.set(false);
  }

  navigateToNuevaFactura() {
    this.router.navigate(['/facturas/nueva']);
  }

  navigateToFinanciamiento() {
    this.router.navigate(['/financiamiento']);
  }

  navigateToReportes() {
    this.router.navigate(['/reportes']);
  }

  navigateToProfile() {
    this.router.navigate(['/perfil']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Aún así redirigir al usuario
        this.router.navigate(['/']);
      }
    });
  }

  formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '$0';
    }
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numericAmount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'factura_creada':
        return '📄';
      case 'factura_aprobada':
        return '✅';
      case 'pago_recibido':
        return '💰';
      default:
        return '📋';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'factura_creada':
        return 'text-blue-600';
      case 'factura_aprobada':
        return 'text-green-600';
      case 'pago_recibido':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }
}