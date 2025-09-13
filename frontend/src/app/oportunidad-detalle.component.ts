import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { InvestmentService } from './services/investment.service';

@Component({
  selector: 'app-oportunidad-detalle',
  standalone: true,
  imports: [CommonModule],
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
                <span class="summary-value rate">{{ formatPercentage(factura()!.interest_rate || 0) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Plazo</span>
                <span class="summary-value">{{ calculateTerm(factura()!.due_date) }} días</span>
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
                @if (factura()!.net_amount) {
                  <div class="detail-row">
                    <span class="detail-label">Monto Neto:</span>
                    <span class="detail-value net-amount">{{ formatCurrency(factura()!.net_amount) }}</span>
                  </div>
                }
                @if (factura()!.commission_rate) {
                  <div class="detail-row">
                    <span class="detail-label">Comisión:</span>
                    <span class="detail-value">{{ factura()!.commission_rate }}%</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="detail-label">Fecha de Vencimiento:</span>
                  <span class="detail-value">{{ formatDate(factura()!.due_date) }}</span>
                </div>
                @if (factura()!.expected_collection_date) {
                  <div class="detail-row">
                    <span class="detail-label">Fecha Esperada de Cobro:</span>
                    <span class="detail-value">{{ formatDate(factura()!.expected_collection_date!) }}</span>
                  </div>
                }
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
              <p>Esta oportunidad de inversión te permitirá obtener un rendimiento del {{ formatPercentage(factura()!.interest_rate || 0) }} en {{ calculateTerm(factura()!.due_date) }} días.</p>
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
  `,
  styleUrls: ['./oportunidad-detalle.component.css']
})
export class OportunidadDetalleComponent implements OnInit {
  factura = signal<any | null>(null);
  isLoading = signal(true);
  error = signal('');
  oportunidadId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private investmentService: InvestmentService
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
    // Navegar a crear propuesta de inversión
    this.router.navigate(['/crear-propuesta', this.oportunidadId]);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  calculateTerm(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateExpectedReturn(): number {
    const factura = this.factura();
    if (!factura || !factura.interest_rate) return 0;
    
    const principal = factura.amount;
    const rate = factura.interest_rate / 100;
    const term = this.calculateTerm(factura.due_date) / 365;
    
    return principal * rate * term;
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
      'paid': 'Pagada'
    };
    return statusTexts[status] || status;
  }
}