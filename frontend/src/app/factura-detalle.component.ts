import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService, Invoice } from './services/invoice.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-factura-detalle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="factura-detalle-container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver
          </button>
          <div class="header-info">
            <h1>Detalles de Factura</h1>
            @if (factura()) {
              <p class="factura-number">{{ factura()!.invoice_number }}</p>
            }
          </div>
        </div>
        <div class="header-right">
          @if (factura() && factura()!.verification_status === 'pending') {
            <button class="btn-primary" (click)="editFactura()">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Editar Factura
            </button>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando detalles de la factura...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-container">
          <div class="error-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3>Error al cargar la factura</h3>
          <p>{{ error() }}</p>
          <button class="btn-primary" (click)="loadFactura()">
            Reintentar
          </button>
        </div>
      }

      <!-- Factura Details -->
      @if (!isLoading() && !error() && factura()) {
        <div class="factura-content">
          <!-- Status Card -->
          <div class="status-card" [class]="getStatusClass(factura()!.verification_status)">
            <div class="status-info">
              <h3>Estado de la Factura</h3>
              <div class="status-badges">
                <span class="status-badge verification" [class]="getStatusClass(factura()!.verification_status)">
                  {{ getVerificationStatusText(factura()!.verification_status) }}
                </span>
                <span class="status-badge operation" [class]="factura()!.operation_type">
                  {{ factura()!.operation_type === 'factoring' ? 'Factoring' : 'Confirming' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Main Details -->
          <div class="details-grid">
            <!-- Client Information -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Información del Cliente
              </h3>
              <div class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">Nombre:</span>
                  <span class="detail-value">{{ factura()!.client_name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">RUT/NIT:</span>
                  <span class="detail-value">{{ factura()!.client_tax_id }}</span>
                </div>
              </div>
            </div>

            <!-- Financial Information -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                Información Financiera
              </h3>
              <div class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">Monto Original:</span>
                  <span class="detail-value amount">{{ formatCurrency(factura()!.amount) }}</span>
                </div>
                @if (factura()!.discount_rate) {
                  <div class="detail-row">
                    <span class="detail-label">Tasa de Descuento:</span>
                    <span class="detail-value">{{ factura()!.discount_rate }}%</span>
                  </div>
                }
                @if (factura()!.net_amount) {
                  <div class="detail-row">
                    <span class="detail-label">Monto Neto:</span>
                    <span class="detail-value net-amount">{{ formatCurrency(factura()!.net_amount!) }}</span>
                  </div>
                }
                @if (factura()!.risk_score) {
                  <div class="detail-row">
                    <span class="detail-label">Puntuación de Riesgo:</span>
                    <span class="detail-value risk-score" [class]="getRiskScoreClass(factura()!.risk_score!)">{{ factura()!.risk_score }}/100</span>
                  </div>
                }
              </div>
            </div>

            <!-- Factoring Specific Information -->
            @if (factura()!.operation_type === 'factoring') {
              <div class="detail-section">
                <h3 class="section-title">
                  <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  Información de Factoring
                </h3>
                <div class="detail-content">
                  @if (factura()!.advance_percentage) {
                    <div class="detail-row">
                      <span class="detail-label">Porcentaje de Adelanto:</span>
                      <span class="detail-value">{{ factura()!.advance_percentage }}%</span>
                    </div>
                  }
                  @if (factura()!.commission_rate) {
                    <div class="detail-row">
                      <span class="detail-label">Tasa de Comisión:</span>
                      <span class="detail-value">{{ factura()!.commission_rate }}%</span>
                    </div>
                  }
                  @if (factura()!.expected_collection_date) {
                    <div class="detail-row">
                      <span class="detail-label">Fecha Esperada de Cobro:</span>
                      <span class="detail-value">{{ formatDate(factura()!.expected_collection_date!) }}</span>
                    </div>
                  }
                  @if (factura()!.credit_risk_assessment) {
                    <div class="detail-row">
                      <span class="detail-label">Evaluación de Riesgo Crediticio:</span>
                      <span class="detail-value risk-assessment" [class]="getRiskAssessmentClass(factura()!.credit_risk_assessment!)">{{ getCreditRiskText(factura()!.credit_risk_assessment!) }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Confirming Specific Information -->
            @if (factura()!.operation_type === 'confirming') {
              <div class="detail-section">
                <h3 class="section-title">
                  <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Información de Confirming
                </h3>
                <div class="detail-content">
                  @if (factura()!.supplier_name) {
                    <div class="detail-row">
                      <span class="detail-label">Nombre del Proveedor:</span>
                      <span class="detail-value">{{ factura()!.supplier_name }}</span>
                    </div>
                  }
                  @if (factura()!.supplier_tax_id) {
                    <div class="detail-row">
                      <span class="detail-label">RUT/NIT del Proveedor:</span>
                      <span class="detail-value">{{ factura()!.supplier_tax_id }}</span>
                    </div>
                  }
                  @if (factura()!.payment_terms) {
                    <div class="detail-row">
                      <span class="detail-label">Términos de Pago:</span>
                      <span class="detail-value">{{ factura()!.payment_terms }}</span>
                    </div>
                  }
                  @if (factura()!.early_payment_discount) {
                    <div class="detail-row">
                      <span class="detail-label">Descuento por Pago Anticipado:</span>
                      <span class="detail-value">{{ factura()!.early_payment_discount }}%</span>
                    </div>
                  }
                  @if (factura()!.confirmation_deadline) {
                    <div class="detail-row">
                      <span class="detail-label">Fecha Límite de Confirmación:</span>
                      <span class="detail-value">{{ formatDate(factura()!.confirmation_deadline!) }}</span>
                    </div>
                  }
                  @if (factura()!.confirming_type) {
                    <div class="detail-row">
                      <span class="detail-label">Tipo de Confirming:</span>
                      <span class="detail-value">{{ getConfirmingTypeLabel(factura()!.confirming_type!) }}</span>
                    </div>
                  }
                  @if (factura()!.confirming_commission) {
                    <div class="detail-row">
                      <span class="detail-label">Comisión de Confirming:</span>
                      <span class="detail-value">{{ factura()!.confirming_commission }}%</span>
                    </div>
                  }
                  @if (factura()!.guarantee_type !== null && factura()!.guarantee_type !== undefined) {
                    <div class="detail-row">
                      <span class="detail-label">Tipo de Garantía:</span>
                      <span class="detail-value">{{ getGuaranteeTypeLabel(factura()!.guarantee_type!) }}</span>
                    </div>
                  }
                  @if (factura()!.payment_guarantee !== null && factura()!.payment_guarantee !== undefined) {
                    <div class="detail-row">
                      <span class="detail-label">Garantía de Pago:</span>
                      <span class="detail-value">{{ getGuaranteeTypeLabel(factura()!.payment_guarantee!) }}</span>
                    </div>
                  }
                  @if (factura()!.supplier_notification !== undefined) {
                    <div class="detail-row">
                      <span class="detail-label">Notificación al Proveedor:</span>
                      <span class="detail-value">{{ factura()!.supplier_notification ? 'Sí' : 'No' }}</span>
                    </div>
                  }
                  @if (factura()!.advance_request !== undefined) {
                    <div class="detail-row">
                      <span class="detail-label">Solicitud de Anticipo:</span>
                      <span class="detail-value">{{ factura()!.advance_request ? 'Sí' : 'No' }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Dates Information -->
            <div class="detail-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Fechas Importantes
              </h3>
              <div class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">Fecha de Emisión:</span>
                  <span class="detail-value">{{ formatDate(factura()!.issue_date) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha de Vencimiento:</span>
                  <span class="detail-value">{{ formatDate(factura()!.due_date) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Días hasta Vencimiento:</span>
                  <span class="detail-value" [class]="getDaysUntilDueClass(getDaysUntilDue(factura()!.due_date))">{{ getDaysUntilDue(factura()!.due_date) }} días</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha de Creación:</span>
                  <span class="detail-value">{{ formatDate(factura()!.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            @if (factura()!.description) {
              <div class="detail-section full-width">
                <h3 class="section-title">
                  <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Descripción
                </h3>
                <div class="detail-content">
                  <p class="description-text">{{ factura()!.description }}</p>
                </div>
              </div>
            }

            <!-- Document -->
            @if (factura()!.document_path) {
              <div class="detail-section full-width">
                <h3 class="section-title">
                  <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Documento Adjunto
                </h3>
                <div class="detail-content">
                  <button class="btn-document" (click)="downloadDocument()">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Descargar Documento
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./factura-detalle.component.css']
})
export class FacturaDetalleComponent implements OnInit {
  factura = signal<Invoice | null>(null);
  isLoading = signal(true);
  error = signal('');
  facturaId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.facturaId = +params['id'];
      this.loadFactura();
    });
  }

  loadFactura() {
    this.isLoading.set(true);
    this.error.set('');

    this.invoiceService.getInvoice(this.facturaId).subscribe({
      next: (response) => {
        console.log('Factura cargada:', response);
        console.log('Operation type:', response.operation_type);
        console.log('Confirming type:', response.confirming_type);
        console.log('Confirming commission:', response.confirming_commission);
        this.factura.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading factura:', error);
        this.error.set(error.error?.message || 'Error al cargar los detalles de la factura');
        this.isLoading.set(false);
      }
    });
  }

  editFactura() {
    if (this.factura()) {
      this.router.navigate(['/facturas/editar', this.facturaId]);
    }
  }

  downloadDocument() {
    if (this.factura() && this.factura()!.document_path) {
      this.invoiceService.downloadDocument(this.facturaId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `factura-${this.factura()!.invoice_number}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading document:', error);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/facturas']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'verified':
      case 'approved':
        return 'status-approved';
      case 'funded':
        return 'status-funded';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getVerificationStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'verified':
        return 'Verificada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Desconocido';
    }
  }

  getRiskScoreClass(score: number): string {
    if (score <= 30) return 'risk-low';
    if (score <= 70) return 'risk-medium';
    return 'risk-high';
  }

  getRiskAssessmentClass(assessment: string): string {
    switch (assessment) {
      case 'low':
        return 'risk-low';
      case 'medium':
        return 'risk-medium';
      case 'high':
        return 'risk-high';
      default:
        return 'risk-medium';
    }
  }

  getCreditRiskText(assessment: string): string {
    switch (assessment) {
      case 'low':
        return 'Bajo Riesgo';
      case 'medium':
        return 'Riesgo Medio';
      case 'high':
        return 'Alto Riesgo';
      default:
        return 'No Evaluado';
    }
  }

  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilDueClass(days: number): string {
    if (days < 0) return 'overdue';
    if (days <= 7) return 'due-soon';
    if (days <= 30) return 'due-normal';
    return 'due-far';
  }

  formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '$0.00';
    }
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getConfirmingTypeLabel(type: string): string {
    switch (type) {
      case 'confirmed':
        return 'Confirmado';
      case 'reverse':
        return 'Reverso';
      case 'simple':
        return 'Simple';
      case 'irrevocable':
        return 'Irrevocable';
      default:
        return type;
    }
  }

  getGuaranteeTypeLabel(type: string): string {
    switch (type) {
      case 'none':
        return 'Sin Garantía';
      case 'bank_guarantee':
        return 'Garantía Bancaria';
      case 'insurance':
        return 'Seguro';
      case 'collateral':
        return 'Colateral';
      default:
        return type;
    }
  }
}