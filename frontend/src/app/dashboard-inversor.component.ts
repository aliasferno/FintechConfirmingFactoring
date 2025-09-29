import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { InvestorService } from './services/investor.service';
import { InvestmentService, InvestorStats } from './services/investment.service';
import { ModalCondicionesInversionComponent } from './components/modal-condiciones-inversion/modal-condiciones-inversion.component';
import { InvoiceService } from './services/invoice.service';
import { Invoice } from './models/invoice.model';

interface InvestmentStats {
  totalInversiones: number;
  inversionesActivas: number;
  montoInvertido: number;
  rendimientoTotal: number;
}

interface InvestmentOpportunity {
  id: string;
  companyName: string;
  facturaNumber: string;
  amount: number;
  interestRate: number;
  term: number; // días
  riskLevel: 'bajo' | 'medio' | 'alto';
  dueDate: Date;
  operationType: 'factoring' | 'confirming';
  supplierName?: string; // Nombre del proveedor para facturas de confirming
  advancePercentage?: number | null; // Porcentaje de adelanto para factoring
  advanceRequest?: boolean; // Si se solicita pago anticipado
  earlyPaymentDiscount?: number | null; // Porcentaje de descuento por pago anticipado
  confirmingCommission?: number | null; // Comisión de confirming
}

interface RecentInvestment {
  id: string;
  type: 'inversion_realizada' | 'pago_recibido' | 'oportunidad_nueva';
  description: string;
  amount?: number;
  date: Date;
}

@Component({
  selector: 'app-dashboard-inversor',
  standalone: true,
  imports: [CommonModule, ModalCondicionesInversionComponent],
  templateUrl: './dashboard-inversor.component.html',
  styleUrls: ['./dashboard-inversor.component.css']
})
export class DashboardInversorComponent implements OnInit {
  user = signal<User | null>(null);
  stats = signal<InvestmentStats>({
    totalInversiones: 0,
    inversionesActivas: 0,
    montoInvertido: 0,
    rendimientoTotal: 0
  });
  opportunities = signal<InvestmentOpportunity[]>([]);
  recentActivities = signal<RecentInvestment[]>([]);
  isLoading = signal(true);
  error = signal('');
  
  // Modal state
  showCondicionesModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);

  constructor(
    private router: Router,
    private authService: AuthService,
    private investorService: InvestorService,
    private investmentService: InvestmentService,
    private invoiceService: InvoiceService
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
    
    console.log('Dashboard - Iniciando carga de datos...');
    
    // Cargar estadísticas del inversor y oportunidades por separado
    Promise.all([
      this.investmentService.getInvestorStats().toPromise(),
      this.investmentService.getInvestmentOpportunities().toPromise()
    ]).then(([statsData, opportunitiesData]) => {
      console.log('Dashboard - Datos recibidos:', { statsData, opportunitiesData });
      
      // Verificar que los datos no sean undefined
      if (!statsData || !opportunitiesData) {
        throw new Error('Datos no disponibles');
      }

      console.log('Dashboard - Número de oportunidades recibidas:', opportunitiesData.length);

      // Establecer estadísticas
      this.stats.set({
        totalInversiones: statsData.totalInversiones,
        inversionesActivas: statsData.inversionesActivas,
        montoInvertido: statsData.montoInvertido,
        rendimientoTotal: statsData.rendimientoTotal
      });

      // Mapear oportunidades usando la misma lógica que oportunidades-inversion.component.ts
      const mappedOpportunities = opportunitiesData.map(invoice => {
        // Determinar la tasa de interés basada en el tipo de operación
        let interestRate = 0;
        if (invoice.operation_type === 'factoring' && invoice.commission_rate) {
          // commission_rate ya está en formato decimal (1.5000 = 1.5%)
          interestRate = parseFloat(invoice.commission_rate.toString()) / 100;
        } else if (invoice.operation_type === 'confirming' && invoice.early_payment_discount) {
          // early_payment_discount ya está en formato decimal (1.00 = 1%)
          interestRate = parseFloat(invoice.early_payment_discount.toString()) / 100;
        } else if (invoice.discount_rate) {
          // discount_rate como fallback
          interestRate = parseFloat(invoice.discount_rate.toString()) / 100;
        }
        
        console.log(`Dashboard - Factura ${invoice.invoice_number}: operation_type=${invoice.operation_type}, commission_rate=${invoice.commission_rate}, early_payment_discount=${invoice.early_payment_discount}, interestRate final=${interestRate}`);
        
        return {
          id: invoice.id.toString(),
          companyName: invoice.company?.business_name || 'Empresa',
          facturaNumber: invoice.invoice_number,
          amount: invoice.amount,
          interestRate: interestRate,
          term: this.calculateTermInDays(new Date(invoice.due_date)),
          riskLevel: this.mapRiskLevel(invoice.risk_score || 50),
          dueDate: new Date(invoice.due_date),
          operationType: invoice.operation_type as 'factoring' | 'confirming',
          supplierName: invoice.supplier_name || undefined,
          advancePercentage: invoice.advance_percentage || null,
          advanceRequest: invoice.advance_request === true,
          earlyPaymentDiscount: invoice.early_payment_discount ? parseFloat(invoice.early_payment_discount.toString()) : null,
          confirmingCommission: invoice.confirming_commission ? parseFloat(invoice.confirming_commission.toString()) : null
        };
      });

      console.log('Dashboard - Oportunidades mapeadas desde BD:', mappedOpportunities);
      console.log('Dashboard - Estableciendo oportunidades en el signal...');
      this.opportunities.set(mappedOpportunities);
      console.log('Dashboard - Oportunidades establecidas. Total:', this.opportunities().length);

      // Mapear actividades recientes del backend al formato del frontend
      const mappedActivities = (statsData.recentActivities || []).map(activity => ({
        id: activity.id.toString(),
        type: this.mapActivityType(activity.type),
        description: activity.description,
        amount: activity.amount,
        date: new Date(activity.date)
      }));
      this.recentActivities.set(mappedActivities);

      this.isLoading.set(false);
      console.log('Dashboard - Carga de datos completada exitosamente');
    }).catch((error) => {
      console.error('Dashboard - Error al cargar datos del dashboard:', error);
      this.error.set('Error al cargar los datos del dashboard');
      this.isLoading.set(false);
      
      // Establecer valores por defecto en caso de error
      this.stats.set({
        totalInversiones: 0,
        inversionesActivas: 0,
        montoInvertido: 0,
        rendimientoTotal: 0
      });
      this.opportunities.set([]);
      this.recentActivities.set([]);
    });
  }

  navigateToOportunidades() {
    this.router.navigate(['/oportunidades']);
  }

  navigateToInversiones() {
    this.router.navigate(['/inversiones']);
  }

  navigateToPortafolio() {
    this.router.navigate(['/portafolio']);
  }

  navigateToReportes() {
    this.router.navigate(['/reportes']);
  }

  navigateToProfile() {
    this.router.navigate(['/perfil']);
  }

  navigateToMisPropuestas() {
    this.router.navigate(['/mis-propuestas']);
  }

  viewOpportunityDetail(opportunityId: string) {
    console.log('Ver detalle de oportunidad:', opportunityId);
    // Navegar a la página de detalle de la oportunidad
    this.router.navigate(['/oportunidad-detalle', opportunityId]);
  }

  investInOpportunity(opportunityId: string) {
    // Buscar la factura completa por ID usando el endpoint público
    this.invoiceService.getPublicInvoice(parseInt(opportunityId)).subscribe({
      next: (invoice: Invoice) => {
        console.log('Factura obtenida desde endpoint público:', invoice);
        this.selectedInvoice.set(invoice);
        this.showCondicionesModal.set(true);
      },
      error: (error: any) => {
        console.error('Error al obtener detalles de la factura:', error);
        // Fallback: navegar directamente a crear propuesta
        this.router.navigate(['/crear-propuesta', opportunityId]);
      }
    });
  }

  onAcceptConditions() {
    const invoice = this.selectedInvoice();
    if (invoice) {
      // Crear inversión directa con las condiciones originales
      this.createDirectInvestment(invoice);
    }
    this.closeModal();
  }

  onModifyConditions(modifications: any) {
    const invoice = this.selectedInvoice();
    if (invoice) {
      // Navegar a crear propuesta con las modificaciones
      this.router.navigate(['/crear-propuesta', invoice.id], {
        state: { modifications: modifications }
      });
    }
    this.closeModal();
  }

  onCancelModal() {
    this.closeModal();
  }

  private closeModal() {
    this.showCondicionesModal.set(false);
    this.selectedInvoice.set(null);
  }

  private createDirectInvestment(invoice: Invoice) {
    // Implementar lógica para crear inversión directa
    console.log('Creando inversión directa para factura:', invoice.id);
    
    const investmentData = {
      invoice_id: invoice.id,
      amount: invoice.amount,
      accepted_conditions: true,
      investment_type: 'direct'
    };

    this.investmentService.createInvestment(investmentData).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        
        // Cerrar modal
        this.closeModal();
        
        // Recargar datos del dashboard para mostrar la nueva inversión
        this.loadDashboardData();
        
        if (response.payments && response.payments.length > 0) {
          // Mostrar mensaje específico para confirming con información de pagos
          const paymentInfo = response.payments.map((payment: any) => {
            const typeLabel = payment.type === 'supplier_payment' ? 'Pago al proveedor' : 'Cobro a la empresa';
            const statusLabel = payment.status === 'pending' ? 'Pendiente' : payment.status;
            return `${typeLabel}: $${payment.amount.toLocaleString()} (${statusLabel})`;
          }).join(', ');
          
          // Mostrar mensaje de éxito con información de pagos
          alert(`¡Inversión de confirming creada exitosamente!\n\nDetalles de pagos:\n${paymentInfo}`);
        } else {
          // Mensaje estándar para inversiones directas
          alert('¡Inversión creada exitosamente!');
        }
      },
      error: (error: any) => {
        console.error('Error al crear inversión:', error);
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al crear la inversión. Por favor, intenta de nuevo.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        alert(`Error: ${errorMessage}`);
      }
    });
  }

  createProposal(opportunityId: string) {
    console.log('Crear propuesta para oportunidad:', opportunityId);
    this.router.navigate(['/crear-propuesta', opportunityId]);
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

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return new Intl.NumberFormat('es-MX', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(0);
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'bajo':
        return 'risk-low';
      case 'medio':
        return 'risk-medium';
      case 'alto':
        return 'risk-high';
      default:
        return 'risk-medium';
    }
  }

  getRiskLevelText(riskLevel: string): string {
    switch (riskLevel) {
      case 'bajo':
        return 'Riesgo Bajo';
      case 'medio':
        return 'Riesgo Medio';
      case 'alto':
        return 'Riesgo Alto';
      default:
        return 'Riesgo Medio';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'inversion_realizada':
        return '💰';
      case 'pago_recibido':
        return '✅';
      case 'oportunidad_nueva':
        return '🔔';
      default:
        return '📊';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'inversion_realizada':
        return 'text-blue-600';
      case 'pago_recibido':
        return 'text-green-600';
      case 'oportunidad_nueva':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }

  calculateExpectedReturn(amount: number, interestRate: number, term: number, operationType?: 'factoring' | 'confirming', advancePercentage?: number, advanceRequest?: boolean, confirmingCommission?: number, earlyPaymentDiscount?: number): number {
    // Usar la misma lógica que el modal para consistencia
    if (operationType === 'factoring') {
      // Para factoring: comisión sobre el monto de adelanto
      const advanceAmount = amount * ((advancePercentage || 80) / 100); // 80% por defecto
      return advanceAmount * interestRate; // interestRate ya está en decimal
    } else if (operationType === 'confirming') {
      // Para confirming: usar confirming_commission si está disponible, sino usar interestRate como fallback
      const commissionRate = confirmingCommission !== undefined ? confirmingCommission : (interestRate * 100);
      // confirming_commission ya viene como porcentaje, no necesita conversión adicional
      let totalReturn = amount * (commissionRate / 100);
      
      // Si advance_request es true, agregar el descuento por pago anticipado
      if (advanceRequest && earlyPaymentDiscount) {
        const earlyPaymentBonus = amount * (earlyPaymentDiscount / 100); // earlyPaymentDiscount está en porcentaje
        totalReturn += earlyPaymentBonus;
      }
      
      return totalReturn;
    } else {
      // Fallback al cálculo anterior para compatibilidad
      return amount * interestRate * (term / 365);
    }
  }

  private mapRiskLevel(riskScore: number): 'bajo' | 'medio' | 'alto' {
    if (riskScore <= 30) return 'bajo';
    if (riskScore <= 70) return 'medio';
    return 'alto';
  }

  private calculateTermInDays(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private mapActivityType(backendType: string): 'inversion_realizada' | 'pago_recibido' | 'oportunidad_nueva' {
    switch (backendType.toLowerCase()) {
      case 'investment':
        return 'inversion_realizada';
      case 'payment':
        return 'pago_recibido';
      case 'opportunity':
        return 'oportunidad_nueva';
      default:
        return 'inversion_realizada';
    }
  }
}