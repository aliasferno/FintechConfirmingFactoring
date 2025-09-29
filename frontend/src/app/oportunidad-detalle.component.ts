import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { InvestmentService } from './services/investment.service';
import { InvoiceService } from './services/invoice.service';
import { ModalCondicionesInversionComponent } from './components/modal-condiciones-inversion/modal-condiciones-inversion.component';
import { Invoice } from './models/invoice.model';

@Component({
  selector: 'app-oportunidad-detalle',
  standalone: true,
  imports: [CommonModule, ModalCondicionesInversionComponent],
  template: `
    <div class="oportunidad-detalle-container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver a Oportunidades
          </button>
          <div class="header-info">
            <h1>Detalle de Oportunidad de Inversión</h1>
            @if (factura()) {
              <p class="oportunidad-number">Oportunidad #{{ factura()!.id || factura()!.invoice_number }}</p>
            }
          </div>
        </div>
        <div class="header-right">
          @if (factura()) {
            <button class="btn-invest" (click)="investInOpportunity()">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Invertir Ahora
            </button>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando información de la oportunidad de inversión...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-container">
          <div class="error-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3>Error al cargar la oportunidad</h3>
          <p>{{ error() }}</p>
          <button class="btn-retry" (click)="loadOpportunityDetail()">
            Reintentar
          </button>
        </div>
      }

      <!-- Content -->
      @if (factura() && !isLoading() && !error()) {
        <div class="content">
          <!-- Investment Summary Card -->
          <div class="investment-summary">
            <div class="summary-header">
              <h2>Resumen de Inversión</h2>
              <span class="operation-type" [class]="getOperationTypeClass(factura()!.operation_type)">
                {{ getOperationTypeText(factura()!.operation_type) }}
              </span>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Monto de Inversión</span>
                <span class="summary-value amount">{{ formatCurrency(factura()!.amount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Tasa de Interés</span>
                <span class="summary-value rate">{{ formatPercentage(factura()!.interest_rate || factura()!.interestRate || 0) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Plazo</span>
                <span class="summary-value">{{ calculateTerm(factura()!.due_date || factura()!.dueDate) }} días</span>
              </div>
              <div class="summary-item highlight">
                <span class="summary-label">Rendimiento Esperado</span>
                <span class="summary-value return">{{ formatCurrency(calculateExpectedReturn()) }}</span>
              </div>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="details-grid">
            <!-- Company Information -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Información de la Empresa
              </h3>
              <div class="detail-content">
              @if (factura()!.companyName) {
                <div class="detail-row">
                  <span class="detail-label">Empresa:</span>
                  <span class="detail-value">{{ factura()!.companyName }}</span>
                </div>
              }
              <div class="detail-row">
                <span class="detail-label">Cliente:</span>
                <span class="detail-value">{{ factura()!.client_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">RUT/NIT:</span>
                <span class="detail-value">{{ factura()!.client_tax_id }}</span>
              </div>
              @if (factura()!.operation_type === 'confirming') {
                <div class="detail-row">
                  <span class="detail-label">Proveedor:</span>
                  <span class="detail-value">{{ factura()!.supplier_name || 'N/A' }}</span>
                </div>
              }
              @if (factura()!.invoice_number || factura()!.facturaNumber) {
                <div class="detail-row">
                  <span class="detail-label">Número de Factura:</span>
                  <span class="detail-value">{{ factura()!.invoice_number || factura()!.facturaNumber }}</span>
                </div>
              }
            </div>
            </div>

            <!-- Risk Assessment -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Evaluación de Riesgo
              </h3>
              <div class="detail-content">
                @if (factura()!.credit_risk_assessment) {
                  <div class="detail-row">
                    <span class="detail-label">Nivel de Riesgo:</span>
                    <span class="detail-value risk-level" [class]="getRiskLevelClass(factura()!.credit_risk_assessment!)">
                      {{ getCreditRiskText(factura()!.credit_risk_assessment!) }}
                    </span>
                  </div>
                }
                @if (factura()!.riskLevel) {
                  <div class="detail-row">
                    <span class="detail-label">Nivel de Riesgo:</span>
                    <span class="detail-value risk-level" [class]="getRiskLevelClass(factura()!.riskLevel!)">
                      {{ getCreditRiskText(factura()!.riskLevel!) }}
                    </span>
                  </div>
                }
                @if (factura()!.risk_score) {
                  <div class="detail-row">
                    <span class="detail-label">Puntuación de Riesgo:</span>
                    <span class="detail-value">{{ factura()!.risk_score }}/100</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="detail-label">Días hasta Vencimiento:</span>
                  <span class="detail-value" [class]="getDaysUntilDueClass(getDaysUntilDue(factura()!.due_date))">
                    {{ getDaysUntilDue(factura()!.due_date) }} días
                  </span>
                </div>
              </div>
            </div>

            <!-- Financial Details -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                Detalles Financieros
              </h3>
              <div class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">Monto Original:</span>
                  <span class="detail-value amount">{{ formatCurrency(factura()!.amount) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Monto Neto:</span>
                  <span class="detail-value net-amount">{{ formatCurrency(factura()!.net_amount || factura()!.amount) }}</span>
                </div>
                @if (factura()!.operation_type === 'factoring') {
                  <div class="detail-row">
                    <span class="detail-label">Porcentaje de Anticipo:</span>
                    <span class="detail-value">{{ factura()!.advance_percentage || 80 }}%</span>
                  </div>
                }
                @if (factura()!.operation_type === 'confirming') {
                  <div class="detail-row">
                    <span class="detail-label">Solicitud de Anticipo:</span>
                    <span class="detail-value">{{ (factura()!.advance_request || factura()!.advanceRequest) ? 'Sí' : 'No' }}</span>
                  </div>
                }
                @if (factura()!.operation_type === 'confirming') {
                  <div class="detail-row">
                    <span class="detail-label">Comisión de Confirming:</span>
                    <span class="detail-value">{{ (factura()!.confirming_commission || factura()!.confirmingCommission || 0) }}%</span>
                  </div>
                }
                @if (factura()!.operation_type === 'factoring') {
                  <div class="detail-row">
                    <span class="detail-label">Comisión:</span>
                    <span class="detail-value">{{ formatPercentage(factura()!.commission_rate || 0) }}</span>
                  </div>
                }
                @if (factura()!.operation_type === 'confirming' && (factura()!.advance_request || factura()!.advanceRequest)) {
                  <div class="detail-row">
                    <span class="detail-label">Descuento por Pago Anticipado:</span>
                    <span class="detail-value">{{ (factura()!.early_payment_discount || factura()!.earlyPaymentDiscount || 0) }}%</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="detail-label">Fecha de Vencimiento:</span>
                  <span class="detail-value">{{ formatDate(factura()!.due_date) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha Esperada de Cobro:</span>
                  <span class="detail-value">{{ factura()!.expected_collection_date ? formatDate(factura()!.expected_collection_date) : 'No especificada' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha de Emisión:</span>
                  <span class="detail-value">{{ factura()!.issue_date ? formatDate(factura()!.issue_date) : 'No especificada' }}</span>
                </div>
              </div>
            </div>

            <!-- Investment Terms -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Términos de Inversión
              </h3>
              <div class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">Tipo de Operación:</span>
                  <span class="detail-value">{{ getOperationTypeText(factura()!.operation_type) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Estado:</span>
                  <span class="detail-value status" [class]="getStatusClass(factura()!.status)">
                    {{ getStatusText(factura()!.status) }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha de Creación:</span>
                  <span class="detail-value">{{ formatDate(factura()!.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          @if (factura()!.description) {
            <div class="description-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Descripción de la Oportunidad
              </h3>
              <div class="description-content">
                <p class="description-text">{{ factura()!.description }}</p>
              </div>
            </div>
          }

          <!-- Investment Action -->
          <div class="investment-action">
            <div class="action-content">
              <h3>¿Listo para invertir?</h3>
              <p>Esta oportunidad de inversión te permitirá obtener un rendimiento del {{ formatPercentage(factura()!.interest_rate || factura()!.interestRate || 0) }} en {{ calculateTerm(factura()!.due_date || factura()!.dueDate) }} días.</p>
              <button class="btn-invest-large" (click)="investInOpportunity()">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Invertir {{ formatCurrency(factura()!.amount) }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modal de Condiciones de Inversión -->
    @if (showCondicionesModal() && selectedInvoice()) {
      <app-modal-condiciones-inversion
        [isVisible]="showCondicionesModal()"
        [invoice]="selectedInvoice()!"
        (acceptConditions)="onAcceptConditions()"
        (modifyConditions)="onModifyConditions($event)"
        (closeModal)="closeModal()">
      </app-modal-condiciones-inversion>
    }
  `,
  styleUrls: ['./oportunidad-detalle.component.css']
})
export class OportunidadDetalleComponent implements OnInit {
  factura = signal<any>(null);
  isLoading = signal(true);
  error = signal('');
  oportunidadId: string = '';

  // Modal state
  showCondicionesModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private investmentService: InvestmentService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.oportunidadId = params['id'];
      if (this.oportunidadId) {
        this.loadOpportunityDetail();
      }
    });
  }

  loadOpportunityDetail() {
    this.isLoading.set(true);
    this.error.set('');

    this.investmentService.getInvestmentOpportunity(parseInt(this.oportunidadId)).subscribe({
      next: (opportunity) => {
        console.log('Oportunidad cargada:', opportunity);
        this.factura.set(opportunity);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar la oportunidad:', error);
        this.error.set('No se pudo cargar la información de la oportunidad. Error: ' + (error.error?.message || error.message));
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/oportunidades']);
  }

  investInOpportunity() {
    console.log('🔵 investInOpportunity llamado con ID:', this.oportunidadId);
    console.log('🔵 Tipo de oportunidadId:', typeof this.oportunidadId);
    console.log('🔵 Estado inicial showCondicionesModal:', this.showCondicionesModal());
    console.log('🔵 Estado inicial selectedInvoice:', this.selectedInvoice());
    
    // Buscar la factura completa por ID usando el endpoint público
    console.log('🔵 Llamando a invoiceService.getPublicInvoice...');
    this.invoiceService.getPublicInvoice(parseInt(this.oportunidadId)).subscribe({
      next: (invoice: Invoice) => {
        console.log('✅ Factura obtenida desde endpoint público:', invoice);
        this.selectedInvoice.set(invoice);
        console.log('✅ selectedInvoice actualizado:', this.selectedInvoice());
        this.showCondicionesModal.set(true);
        console.log('✅ showCondicionesModal establecido a true:', this.showCondicionesModal());
        
        // Verificar después de un pequeño delay
        setTimeout(() => {
          console.log('🔍 Verificación después de 100ms:');
          console.log('🔍 showCondicionesModal:', this.showCondicionesModal());
          console.log('🔍 selectedInvoice:', this.selectedInvoice());
          console.log('🔍 Condición del @if:', this.showCondicionesModal() && this.selectedInvoice());
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error al obtener la factura:', error);
        this.error.set('Error al cargar la información de la factura');
      }
    });
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    // Usar UTC para evitar problemas de zona horaria
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  calculateTerm(dueDate: string): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateExpectedReturn(): number {
    const factura = this.factura();
    if (!factura) return 0;
    
    // Usar la misma lógica que el dashboard y el modal para consistencia
    if (factura.operation_type === 'factoring') {
      // Para factoring: comisión sobre el monto de adelanto
      const advancePercentage = factura.advance_percentage || 80; // 80% por defecto
      const advanceAmount = factura.amount * (advancePercentage / 100);
      const commissionRate = factura.commission_rate || 0;
      // commission_rate ya está en decimal, convertir a decimal si viene como porcentaje
      const rate = commissionRate > 1 ? commissionRate / 100 : commissionRate;
      return advanceAmount * rate;
    } else if (factura.operation_type === 'confirming') {
      // Para confirming: usar confirming_commission si está disponible, sino usar commission_rate como fallback
      const commissionRate = factura.confirming_commission || factura.commission_rate || 0;
      // Convertir a decimal si viene como porcentaje
      const rate = commissionRate > 1 ? commissionRate / 100 : commissionRate;
      let totalReturn = factura.amount * rate;
      
      // Si advance_request es true, agregar el descuento por pago anticipado
      if (factura.advance_request === true && factura.early_payment_discount) {
        const earlyPaymentDiscount = factura.early_payment_discount > 1 ? 
          factura.early_payment_discount / 100 : factura.early_payment_discount;
        const earlyPaymentBonus = factura.amount * earlyPaymentDiscount;
        totalReturn += earlyPaymentBonus;
      }
      
      return totalReturn;
    } else {
      // Fallback al cálculo anterior para compatibilidad
      const interestRate = factura.interest_rate || factura.interestRate || 0;
      const rate = interestRate > 1 ? interestRate / 100 : interestRate;
      const dueDate = factura.due_date || factura.dueDate;
      const term = this.calculateTerm(dueDate) / 365; // Convertir días a años
      return factura.amount * rate * term;
    }
  }

  getDaysUntilDue(dueDate: string): number {
    return this.calculateTerm(dueDate);
  }

  // CSS class methods
  getOperationTypeClass(operationType: string): string {
    return `operation-${operationType}`;
  }

  getOperationTypeText(operationType: string): string {
    return operationType === 'factoring' ? 'Factoring' : 'Confirming';
  }

  getRiskLevelClass(riskLevel: string): string {
    return `risk-${riskLevel.toLowerCase()}`;
  }

  getCreditRiskText(riskLevel: string): string {
    const riskTexts: { [key: string]: string } = {
      'low': 'Bajo Riesgo',
      'medium': 'Riesgo Medio',
      'high': 'Alto Riesgo'
    };
    return riskTexts[riskLevel.toLowerCase()] || riskLevel;
  }

  getDaysUntilDueClass(days: number): string {
    if (days < 0) return 'overdue';
    if (days <= 7) return 'due-soon';
    if (days <= 30) return 'due-normal';
    return 'due-far';
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'active': 'Activa',
      'completed': 'Completada'
    };
    return statusTexts[status.toLowerCase()] || status;
  }

  // Modal methods
  closeModal() {
    this.showCondicionesModal.set(false);
    this.selectedInvoice.set(null);
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

  createDirectInvestment(invoice: Invoice) {
    const investmentData = {
      invoice_id: invoice.id,
      amount: invoice.amount,
      accepted_conditions: true,
      investment_type: 'direct'
    };

    this.investmentService.createInvestment(investmentData).subscribe({
      next: (response: any) => {
        console.log('✅ Inversión creada exitosamente:', response);
        
        // *** NUEVO: Mostrar información de pagos si es confirming con adelanto ***
        if (response.payments && response.payments.length > 0) {
          console.log('Pagos creados para operación de confirming:', response.payments);
          
          // Mostrar mensaje específico para confirming con información de pagos
          const paymentInfo = response.payments.map((payment: any) => {
            const typeLabel = payment.type === 'supplier_payment' ? 'Pago al proveedor' : 'Cobro a la empresa';
            const statusLabel = payment.status === 'pending' ? 'Pendiente' : payment.status;
            return `${typeLabel}: $${payment.amount.toLocaleString()} (${statusLabel})`;
          }).join(', ');
          
          this.router.navigate(['/dashboard/inversor'], { 
            queryParams: { 
              message: `Inversión de confirming creada exitosamente. ${paymentInfo}`,
              type: 'confirming_success'
            }
          });
        } else {
          // Mensaje estándar para inversiones directas
          this.router.navigate(['/dashboard/inversor'], { 
            queryParams: { message: 'Inversión creada exitosamente' }
          });
        }
      },
      error: (error: any) => {
        console.error('❌ Error al crear la inversión:', error);
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al crear la inversión. Por favor, intenta de nuevo.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        this.error.set(errorMessage);
      }
    });
  }

  extractOriginalConditions(invoice: Invoice): any {
    return {
      amount: invoice.amount,
      discount_rate: invoice.discount_rate || 0,
      due_date: invoice.due_date,
      // Agregar más condiciones según sea necesario
    };
  }
}