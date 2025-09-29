import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService } from './services/invoice.service';
import { InvestmentService } from './services/investment.service';
import { ModalCondicionesInversionComponent } from './components/modal-condiciones-inversion/modal-condiciones-inversion.component';
import { Invoice } from './models/invoice.model';
import { ReactiveFormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-oportunidades-inversion',
  standalone: true,
  imports: [CommonModule, ModalCondicionesInversionComponent],
  template: `
    <div class="opportunities-container">
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">Oportunidades de Inversión</h1>
          <div class="header-actions">
            <a id="btnVolver" (click)="navigateBack()" class="back-button" style="cursor: pointer;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver
            </a>
          </div>
        </div>
      </header>

      <div class="filters-section">
        <h2 class="section-title">Filtros</h2>
        <div class="filters-container">
          <div class="filter-group">
            <label>Tipo de Operación</label>
            <div class="filter-options">
              <button 
                class="filter-option" 
                [class.active]="selectedOperationType() === 'all'"
                (click)="setOperationType('all')"
              >Todas</button>
              <button 
                class="filter-option" 
                [class.active]="selectedOperationType() === 'factoring'"
                (click)="setOperationType('factoring')"
              >Factoring</button>
              <button 
                class="filter-option" 
                [class.active]="selectedOperationType() === 'confirming'"
                (click)="setOperationType('confirming')"
              >Confirming</button>
            </div>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando oportunidades de inversión...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <p class="error-message">{{ error() }}</p>
          <button class="retry-button" (click)="loadOpportunities()">Reintentar</button>
        </div>
      } @else {
        <div class="opportunities-grid">
          @for (opportunity of filteredOpportunities(); track opportunity.id) {
            <div class="opportunity-card">
              <div class="opportunity-header">
                <h3 class="company-name">{{ opportunity.companyName }}</h3>
                <div class="opportunity-badges">
                  <span class="operation-badge" [class]="opportunity.operationType">
                    {{ opportunity.operationType === 'factoring' ? 'Factoring' : 'Confirming' }}
                  </span>
                  <span class="risk-badge" [class]="getRiskLevelColor(opportunity.riskLevel)">
                    {{ getRiskLevelText(opportunity.riskLevel) }}
                  </span>
                </div>
              </div>
              <div class="opportunity-details">
                <div class="detail-item">
                  <span class="detail-label">Factura:</span>
                  <span class="detail-value">{{ opportunity.facturaNumber }}</span>
                </div>
                @if (opportunity.operationType === 'confirming' && opportunity.supplierName) {
                  <div class="detail-item">
                    <span class="detail-label">Proveedor:</span>
                    <span class="detail-value">{{ opportunity.supplierName }}</span>
                  </div>
                }
                <div class="detail-item">
                  <span class="detail-label">Monto:</span>
                  <span class="detail-value amount">{{ formatCurrency(opportunity.amount) }}</span>
                </div>
                <div class="detail-item">
                  @if (opportunity.operationType === 'confirming') {
                    <span class="detail-label">Comisión de Confirming:</span>
                    <span class="detail-value rate">{{ formatPercentage((opportunity.confirmingCommission || 0) / 100) }}</span>
                  } @else {
                    <span class="detail-label">Tasa:</span>
                    <span class="detail-value rate">{{ formatPercentage(opportunity.interestRate) }}</span>
                  }
                </div>
                @if (opportunity.earlyPaymentDiscount && opportunity.advanceRequest) {
                  <div class="detail-item">
                    <span class="detail-label">Descuento por Pago Anticipado:</span>
                    <span class="detail-value rate">{{ formatPercentage(opportunity.earlyPaymentDiscount / 100) }}</span>
                  </div>
                }
                <div class="detail-item">
                  <span class="detail-label">Plazo:</span>
                  <span class="detail-value">{{ opportunity.term }} días</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Vencimiento:</span>
                  <span class="detail-value">{{ formatDate(opportunity.dueDate) }}</span>
                </div>
                <div class="detail-item expected-return">
                   <span class="detail-label">Rendimiento esperado:</span>
                   <span class="detail-value return">{{ formatCurrency(calculateExpectedReturn(opportunity.amount, opportunity.interestRate, opportunity.term, opportunity.operationType, opportunity.advancePercentage || undefined, opportunity.advanceRequest, opportunity.confirmingCommission || undefined, opportunity.earlyPaymentDiscount || undefined)) }}</span>
                 </div>
              </div>
              <div class="button-group">
                <button class="detail-button" (click)="viewOpportunityDetail(opportunity.id)">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  Ver Detalle
                </button>
                <button class="invest-button" (click)="investInOpportunity(opportunity.id)">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Invertir
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-opportunities">
              <p>No hay oportunidades disponibles con los filtros seleccionados</p>
            </div>
          }
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
        (cancel)="onCancelModal()">
      </app-modal-condiciones-inversion>
    }
  `,
  styles: [`
    .opportunities-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      color: #4a5568;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .back-button:hover {
      background-color: #edf2f7;
      color: #2d3748;
    }

    .back-button svg {
      width: 1rem;
      height: 1rem;
    }

    .filters-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin-top: 0;
      margin-bottom: 1rem;
    }

    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #4a5568;
    }

    .filter-options {
      display: flex;
      gap: 0.5rem;
    }

    .filter-option {
      padding: 0.5rem 1rem;
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      color: #4a5568;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-option:hover {
      background-color: #edf2f7;
    }

    .filter-option.active {
      background-color: #4299e1;
      border-color: #3182ce;
      color: white;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 0;
    }

    .loading-spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid rgba(66, 153, 225, 0.2);
      border-left-color: #4299e1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-container {
      text-align: center;
      padding: 3rem;
      background-color: #fff5f5;
      border-radius: 0.75rem;
      border: 1px solid #fed7d7;
    }

    .error-message {
      color: #c53030;
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .retry-button {
      padding: 0.5rem 1rem;
      background-color: #4299e1;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-button:hover {
      background-color: #3182ce;
    }

    .opportunities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .opportunity-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .opportunity-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: #cbd5e0;
    }

    .opportunity-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .company-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
      flex: 1;
    }

    .opportunity-badges {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .operation-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .operation-badge.factoring {
      background: #e6fffa;
      color: #2c7a7b;
    }

    .operation-badge.confirming {
      background: #ebf4ff;
      color: #2c5282;
    }

    .risk-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .risk-low {
      background: #c6f6d5;
      color: #22543d;
    }

    .risk-medium {
      background: #feebc8;
      color: #c05621;
    }

    .risk-high {
      background: #fed7d7;
      color: #c53030;
    }

    .opportunity-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-item.expected-return {
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
      font-weight: 600;
    }

    .detail-label {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.875rem;
      color: #1a202c;
      font-weight: 600;
    }

    .detail-value.amount {
      color: #4facfe;
    }

    .detail-value.rate {
      color: #43e97b;
    }

    .detail-value.return {
      color: #667eea;
    }

    .button-group {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .detail-button {
      flex: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .detail-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .detail-button svg {
      width: 1rem;
      height: 1rem;
    }

    .invest-button {
      flex: 1;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      border: none;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .invest-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
    }

    .invest-button svg {
      width: 1rem;
      height: 1rem;
    }

    .empty-opportunities {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #a0aec0;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
  `]
})
export class OportunidadesInversionComponent implements OnInit {
  opportunities = signal<InvestmentOpportunity[]>([]);
  filteredOpportunities = signal<InvestmentOpportunity[]>([]);
  selectedOperationType = signal<'all' | 'factoring' | 'confirming'>('all');
  isLoading = signal(true);
  error = signal('');

  // Modal state
  showCondicionesModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);

  constructor(
    private router: Router,
    private invoiceService: InvoiceService,
    private investmentService: InvestmentService
  ) {}

  ngOnInit() {
    this.loadOpportunities();
  }

  loadOpportunities() {
    this.isLoading.set(true);
    this.error.set('');

    // Obtener oportunidades de inversión (solo facturas aprobadas)
    this.investmentService.getInvestmentOpportunities().subscribe({
      next: (allInvoices: Invoice[]) => {
        // Mapear las facturas aprobadas a oportunidades de inversión
        const mappedOpportunities = allInvoices.map(invoice => {
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
          
          console.log(`Factura ${invoice.invoice_number}: operation_type=${invoice.operation_type}, commission_rate=${invoice.commission_rate}, early_payment_discount=${invoice.early_payment_discount}, interestRate final=${interestRate}`);
          
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
            supplierName: invoice.supplier_name || undefined, // Añadir nombre del proveedor para confirming
            advancePercentage: invoice.advance_percentage || null, // Añadir porcentaje de adelanto para factoring
            advanceRequest: invoice.advance_request === true, // Convertir a boolean
            earlyPaymentDiscount: invoice.early_payment_discount ? parseFloat(invoice.early_payment_discount.toString()) : null, // Añadir descuento por pago anticipado
            confirmingCommission: invoice.confirming_commission ? parseFloat(invoice.confirming_commission.toString()) : null // Añadir comisión de confirming
          };
        });

        console.log('Oportunidades mapeadas desde BD (solo aprobadas):', mappedOpportunities);
        this.opportunities.set(mappedOpportunities);
        
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error al cargar oportunidades:', error);
        this.error.set('Error al cargar las oportunidades de inversión');
        this.isLoading.set(false);
      }
    });
  }
  


  setOperationType(type: 'all' | 'factoring' | 'confirming') {
    this.selectedOperationType.set(type);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.opportunities();
    
    // Filtrar por tipo de operación
    const operationType = this.selectedOperationType();
    if (operationType !== 'all') {
      filtered = filtered.filter(opp => opp.operationType === operationType);
    }
    
    this.filteredOpportunities.set(filtered);
  }

  calculateTermInDays(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  mapRiskLevel(riskScore: number): 'bajo' | 'medio' | 'alto' {
    if (riskScore <= 30) return 'bajo';
    if (riskScore <= 70) return 'medio';
    return 'alto';
  }

  getRiskLevelText(riskLevel: 'bajo' | 'medio' | 'alto'): string {
    switch (riskLevel) {
      case 'bajo': return 'Riesgo Bajo';
      case 'medio': return 'Riesgo Medio';
      case 'alto': return 'Riesgo Alto';
      default: return 'Desconocido';
    }
  }

  getRiskLevelColor(riskLevel: 'bajo' | 'medio' | 'alto'): string {
    switch (riskLevel) {
      case 'bajo': return 'risk-low';
      case 'medio': return 'risk-medium';
      case 'alto': return 'risk-high';
      default: return '';
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  viewOpportunityDetail(opportunityId: string) {
    console.log('Ver detalle de oportunidad:', opportunityId);
    // Navegar a la página de detalle de la oportunidad
    this.router.navigate(['/oportunidad-detalle', opportunityId]);
  }

  investInOpportunity(opportunityId: string) {
    console.log('🔵 investInOpportunity llamado con ID:', opportunityId);
    console.log('🔵 Tipo de opportunityId:', typeof opportunityId);
    console.log('🔵 Estado inicial showCondicionesModal:', this.showCondicionesModal());
    console.log('🔵 Estado inicial selectedInvoice:', this.selectedInvoice());
    
    // Buscar la factura completa por ID usando el endpoint público
    console.log('🔵 Llamando a invoiceService.getPublicInvoice...');
    this.invoiceService.getPublicInvoice(parseInt(opportunityId)).subscribe({
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
          
          // Verificar si el elemento del modal existe en el DOM
          const modalElement = document.querySelector('app-modal-condiciones-inversion');
          console.log('🔍 Elemento modal en DOM:', modalElement);
          
          if (modalElement) {
            const modalOverlay = modalElement.querySelector('.modal-overlay');
            console.log('🔍 Modal overlay encontrado:', modalOverlay);
            if (modalOverlay) {
              const computedStyle = window.getComputedStyle(modalOverlay);
              console.log('🔍 Display del modal:', computedStyle.display);
              console.log('🔍 Visibility del modal:', computedStyle.visibility);
              console.log('🔍 Z-index del modal:', computedStyle.zIndex);
              console.log('🔍 Position del modal:', computedStyle.position);
            }
          } else {
            console.log('❌ No se encontró el elemento modal en el DOM');
          }
        }, 100);
      },
      error: (error: any) => {
        console.error('❌ Error al obtener detalles de la factura:', error);
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
        console.log('Inversión creada exitosamente:', response);
        
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
        console.error('Error al crear inversión:', error);
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al crear la inversión. Por favor, intenta de nuevo.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        this.router.navigate(['/dashboard/inversor'], { 
          queryParams: { 
            error: errorMessage,
            type: 'investment_error'
          }
        });
      }
    });
  }

  createProposalWithModifications(invoice: Invoice, modifications: any) {
    // Navegar a crear propuesta con las modificaciones
    this.router.navigate(['/crear-propuesta', invoice.id], {
      state: { 
        modifications: modifications,
        originalInvoice: invoice 
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

  navigateBack() {
    this.router.navigate(['/dashboard/inversor']);
  }
}