import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompanyService } from './services/company.service';
import { AuthService } from './services/auth.service';

interface FinancingRecord {
  id: number;
  invoice_number: string;
  invoice_amount: number;
  amount_invested: number;
  discount_percentage: number;
  commission_percentage: number;
  net_amount_received: number;
  investor_name: string;
  investor_email: string;
  investment_date: string;
  operation_type: string;
  status: string;
  payment_status: string;
  scheduled_payment_date: string;
  executed_payment_date?: string;
}

interface FinancingStats {
  total_investments: number;
  total_amount_financed: number;
  total_commissions_paid: number;
  active_investments: number;
  completed_investments: number;
  pending_payments: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  amount: number;
  date: string;
}

@Component({
  selector: 'app-financiamientos-recibidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financiamientos-recibidos.component.html',
  styleUrls: ['./financiamientos-recibidos.component.css']
})
export class FinanciamientosRecibidosComponent implements OnInit {
  stats = signal<FinancingStats>({
    total_investments: 0,
    total_amount_financed: 0,
    total_commissions_paid: 0,
    active_investments: 0,
    completed_investments: 0,
    pending_payments: 0
  });
  
  financingRecords = signal<FinancingRecord[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  isLoading = signal(true);
  error = signal('');

  constructor(
    private companyService: CompanyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFinancingData();
  }

  private loadFinancingData() {
    this.isLoading.set(true);
    this.error.set('');

    this.companyService.getCompanyFinancingStats().subscribe({
      next: (response) => {
        console.log('Financing data loaded:', response);
        
        // El endpoint devuelve directamente las propiedades, no dentro de un objeto 'stats'
        this.stats.set({
          total_investments: response.totalFinanciamientos || 0,
          total_amount_financed: response.montoTotalFinanciado || 0,
          total_commissions_paid: response.montoTotalComisiones || 0,
          active_investments: response.financiamientosActivos || 0,
          completed_investments: (response.totalFinanciamientos || 0) - (response.financiamientosActivos || 0),
          pending_payments: 0 // Esta información no está disponible en la respuesta actual
        });

        // Mapear los financiamientos a la estructura esperada por el componente
        const mappedFinancingRecords = (response.financiamientos || []).map((financing: any) => ({
          id: financing.id,
          invoice_number: financing.invoice_number,
          invoice_amount: financing.operation_details?.invoice_amount || 0,
          amount_invested: financing.amount,
          discount_percentage: financing.operation_details?.advance_percentage || 0,
          commission_percentage: financing.operation_details?.commission_rate || financing.operation_details?.confirming_commission || 0,
          net_amount_received: financing.amount - (financing.expected_return || 0),
          investor_name: financing.investor_name,
          investor_email: financing.investor_email,
          investment_date: financing.investment_date,
          operation_type: financing.operation_type,
          status: financing.status,
          payment_status: financing.payments && financing.payments.length > 0 ? financing.payments[0].status : 'pending',
          scheduled_payment_date: financing.maturity_date || financing.investment_date,
          executed_payment_date: financing.payments && financing.payments.length > 0 ? financing.payments[0].executed_date : undefined
        }));

        this.financingRecords.set(mappedFinancingRecords);
        this.recentActivities.set(response.recentActivities || []);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading financing data:', error);
        this.error.set('Error al cargar los datos de financiamiento');
        this.isLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'activo':
        return 'status-active';
      case 'completed':
      case 'completado':
        return 'status-completed';
      case 'pending':
      case 'pendiente':
        return 'status-pending';
      default:
        return 'status-default';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return 'payment-paid';
      case 'pending':
      case 'pendiente':
        return 'payment-pending';
      case 'overdue':
      case 'vencido':
        return 'payment-overdue';
      default:
        return 'payment-default';
    }
  }

  navigateBack() {
    this.router.navigate(['/dashboard/empresa']);
  }

  refreshData() {
    this.loadFinancingData();
  }
}