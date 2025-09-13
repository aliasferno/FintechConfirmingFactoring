import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService, Invoice } from './services/invoice.service';
import { AuthService } from './services/auth.service';
import { InvestmentService } from './services/investment.service';

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
}

@Component({
  selector: 'app-oportunidades-inversion',
  standalone: true,
  imports: [CommonModule],
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
                <div class="detail-item">
                  <span class="detail-label">Monto:</span>
                  <span class="detail-value amount">{{ formatCurrency(opportunity.amount) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tasa:</span>
                  <span class="detail-value rate">{{ formatPercentage(opportunity.interestRate) }}</span>
                </div>
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
                  <span class="detail-value return">{{ formatCurrency(calculateExpectedReturn(opportunity.amount, opportunity.interestRate, opportunity.term)) }}</span>
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

  constructor(
    private router: Router,
    private authService: AuthService,
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
            operationType: invoice.operation_type as 'factoring' | 'confirming'
          };
        });

        console.log('Oportunidades mapeadas desde BD (solo aprobadas):', mappedOpportunities);
        this.opportunities.set(mappedOpportunities);
        
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar oportunidades de inversión:', error);
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

  calculateExpectedReturn(amount: number, interestRate: number, term: number): number {
    // Cálculo simple: monto * tasa * (días / 365)
    return amount * (interestRate / 100) * (term / 365);
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
    // Navegar a crear propuesta de inversión con el ID de la oportunidad
    this.router.navigate(['/crear-propuesta', opportunityId]);
  }

  navigateBack() {
    this.router.navigate(['/dashboard/inversor']);
  }
}