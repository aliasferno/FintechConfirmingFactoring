import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvestmentService, Investment, InvestorStats } from './services/investment.service';

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

@Component({
  selector: 'app-mis-inversiones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mis-inversiones-container">
      <div class="header">
        <h1>Mis Inversiones</h1>
        <p>Gestiona y visualiza todas tus inversiones y su estado</p>
      </div>

      <!-- Estadísticas Generales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>Total Inversiones</h3>
            <p class="stat-value">{{ stats().totalInversiones }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon active">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Inversiones Activas</h3>
            <p class="stat-value">{{ stats().inversionesActivas }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon invested">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Monto Invertido</h3>
            <p class="stat-value">\${{ formatCurrency(stats().montoInvertido) }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon returns">
            <i class="fas fa-trending-up"></i>
          </div>
          <div class="stat-content">
            <h3>Rendimiento Total</h3>
            <p class="stat-value">\${{ formatCurrency(stats().rendimientoTotal) }}</p>
          </div>
        </div>
      </div>

      <!-- Inversiones Activas -->
      <div class="investments-section" *ngIf="activeInvestments().length > 0">
        <h2>Inversiones Activas</h2>
        
        <div class="investments-list">
          <div class="investment-card active" *ngFor="let investment of activeInvestments()">
            <div class="investment-header">
              <div class="investment-icon">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="investment-info">
                <h3>Inversión #{{ investment.id }}</h3>
                <p class="investment-date">{{ formatDate(investment.investment_date) }}</p>
              </div>
              <div class="investment-amount">
                <span class="amount neutral">
                  \${{ formatCurrency(investment.amount) }}
                </span>
              </div>
            </div>
            
            <div class="investment-details">
              <div class="detail-item">
                <span class="label">Empresa:</span>
                <span class="value">{{ investment.invoice?.company?.business_name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Retorno Esperado:</span>
                <span class="value text-success">\${{ formatCurrency(investment.expected_return) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Estado:</span>
                <span class="status-badge active">{{ getStatusLabel(investment.status) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Fecha de Vencimiento:</span>
                <span class="value">{{ formatDate(investment.maturity_date || '') }}</span>
              </div>
            </div>
            
            <div class="investment-actions">
              <button 
                class="btn-details" 
                (click)="openPaymentDetailsModal(investment)">
                <i class="fas fa-info-circle"></i>
                Ver Detalles de Pagos
              </button>
              <button 
                class="btn-cancel" 
                (click)="cancelInvestment(investment.id)"
                [disabled]="cancellingInvestment() === investment.id">
                <i class="fas fa-times"></i>
                {{ cancellingInvestment() === investment.id ? 'Cancelando...' : 'Cancelar Inversión' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Inversiones y Flujo de Negociación -->
      <div class="investments-section">
        <h2>Historial de Inversiones y Negociaciones</h2>
        
        <div class="investments-list" *ngIf="stats().investments && stats().investments.length > 0; else noInvestments">
          <div class="investment-card" *ngFor="let investment of stats().investments" 
               [ngClass]="getInvestmentStatusClass(investment.status)">
            <div class="investment-header">
              <div class="investment-icon">
                <i [class]="getInvestmentIcon(investment.status)"></i>
              </div>
              <div class="investment-info">
                <h3>Inversión #{{ investment.id }}</h3>
                <p class="investment-date">{{ formatDate(investment.investment_date) }}</p>
              </div>
              <div class="investment-amount">
                <span class="amount">
                  \${{ formatCurrency(investment.amount) }}
                </span>
              </div>
            </div>
            
            <div class="investment-details">
              <div class="detail-item">
                <span class="label">Empresa:</span>
                <span class="value">{{ investment.invoice?.company?.business_name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Factura:</span>
                <span class="value">#{{ investment.invoice?.invoice_number || investment.invoice_id }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Estado:</span>
                <span class="value" [ngClass]="getStatusClass(investment.status)">{{ getStatusLabel(investment.status) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Retorno Esperado:</span>
                <span class="value text-success">\${{ formatCurrency(investment.expected_return) }}</span>
              </div>
              <div class="detail-item" *ngIf="investment.actual_return">
                <span class="label">Retorno Real:</span>
                <span class="value text-success">\${{ formatCurrency(investment.actual_return) }}</span>
              </div>
              <div class="detail-item" *ngIf="investment.maturity_date">
                <span class="label">Fecha de Vencimiento:</span>
                <span class="value">{{ formatDate(investment.maturity_date) }}</span>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="investment-actions">
              <button 
                class="btn-details" 
                (click)="openPaymentDetailsModal(investment)">
                <i class="fas fa-info-circle"></i>
                Ver Detalles de Pagos
              </button>
              <button 
                *ngIf="investment.status === 'active'"
                class="btn-cancel" 
                (click)="cancelInvestment(investment.id)"
                [disabled]="cancellingInvestment() === investment.id">
                <i class="fas fa-times"></i>
                {{ cancellingInvestment() === investment.id ? 'Cancelando...' : 'Cancelar Inversión' }}
              </button>
            </div>
          </div>
        </div>

        <ng-template #noInvestments>
          <div class="no-investments">
            <i class="fas fa-chart-line"></i>
            <h3>No tienes inversiones aún</h3>
            <p>Explora las oportunidades de inversión disponibles para comenzar</p>
            <button class="btn-primary" (click)="navigateToOpportunities()">
              Ver Oportunidades
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Acciones Rápidas -->
      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <button class="action-btn" (click)="navigateToOpportunities()">
            <i class="fas fa-search"></i>
            <span>Explorar Oportunidades</span>
          </button>
          <button class="action-btn" (click)="navigateToProposals()">
            <i class="fas fa-file-contract"></i>
            <span>Mis Propuestas</span>
          </button>
          <button class="action-btn" (click)="navigateToPortfolio()">
            <i class="fas fa-chart-pie"></i>
            <span>Ver Portafolio</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Detalles de Pagos -->
    <div class="modal-overlay" *ngIf="showPaymentModal()" (click)="closePaymentModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Detalles de Pagos</h3>
          <button class="close-btn" (click)="closePaymentModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="selectedInvestment()">
          <div class="investment-info">
            <h4>Información de la Inversión</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Empresa:</span>
                <span class="value">{{ selectedInvestment()?.invoice?.company?.business_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">Factura:</span>
                <span class="value">#{{ selectedInvestment()?.invoice?.invoice_number }}</span>
              </div>
              <div class="info-item">
                <span class="label">Monto Invertido:</span>
                <span class="value">\${{ formatCurrency(selectedInvestment()?.amount || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Retorno Esperado:</span>
                <span class="value">\${{ formatCurrency(selectedInvestment()?.expected_return || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="payment-details">
            <h4>Detalles de Pagos</h4>
            
            <div class="payment-section">
              <div class="payment-card provider">
                <div class="payment-header">
                  <i class="fas fa-truck"></i>
                  <h5>Pago al Proveedor</h5>
                </div>
                <div class="payment-amount">
                  \${{ formatCurrency(calculateProviderPayment(selectedInvestment()!)) }}
                </div>
                <div class="payment-description">
                  Monto que se pagará al proveedor dueño de la factura (monto de factura menos descuento por pago anticipado)
                </div>
              </div>

              <div class="payment-card company">
                <div class="payment-header">
                  <i class="fas fa-building"></i>
                  <h5>Pago de la Empresa</h5>
                </div>
                <div class="payment-amount">
                  \${{ formatCurrency(calculateCompanyPayment(selectedInvestment()!)) }}
                </div>
                <div class="payment-description">
                  Monto que la empresa deberá pagar (monto de factura más comisión de confirming)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mis-inversiones-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .header p {
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .stat-icon.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-icon.active { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .stat-icon.invested { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .stat-icon.returns { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

    .stat-content h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .investments-section {
      margin-bottom: 3rem;
    }

    .investments-section h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .investments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .investment-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #3498db;
      transition: all 0.2s ease;
    }

    .investment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }

    .investment-card.completed {
      border-left-color: #27ae60;
    }

    .investment-card.active {
      border-left-color: #f39c12;
    }

    .investment-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .investment-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }

    .investment-info {
      flex: 1;
    }

    .investment-info h3 {
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .investment-date {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .investment-amount {
      text-align: right;
    }

    .amount {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .amount.positive {
      color: #27ae60;
    }

    .amount.negative {
      color: #e74c3c;
    }

    .amount.neutral {
      color: #3498db;
    }

    .investment-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #ecf0f1;
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-item .label {
      color: #7f8c8d;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .detail-item .value {
      color: #2c3e50;
      font-weight: 600;
    }

    .investment-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #ecf0f1;
    }

    .btn-cancel {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #c0392b;
      transform: translateY(-1px);
    }

    .btn-cancel:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-cancel i {
      margin-right: 0.5rem;
    }

    .btn-details {
      background: #3498db;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .btn-details:hover {
      background: #2980b9;
      transform: translateY(-1px);
    }

    .btn-details i {
      margin-right: 0.5rem;
    }

    .status-active {
      color: #f39c12;
      font-weight: 600;
    }

    .status-completed {
      color: #27ae60;
      font-weight: 600;
    }

    .status-cancelled {
      color: #e74c3c;
      font-weight: 600;
    }

    .investment-card.active {
      border-left: 4px solid #f39c12;
    }

    .investment-card.completed {
      border-left: 4px solid #27ae60;
    }

    .investment-card.cancelled {
      border-left: 4px solid #e74c3c;
      opacity: 0.8;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.completed {
      background: #d5f4e6;
      color: #27ae60;
    }

    .status-badge.active {
      background: #fef9e7;
      color: #f39c12;
    }

    .status-badge.pending {
      background: #ebf3fd;
      color: #3498db;
    }

    .status-badge.cancelled {
      background: #f8f9fa;
      color: #6c757d;
    }

    .text-success {
      color: #27ae60 !important;
    }

    .text-muted {
      color: #7f8c8d !important;
    }

    .no-investments {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .no-investments i {
      font-size: 4rem;
      color: #bdc3c7;
      margin-bottom: 1rem;
    }

    .no-investments h3 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .no-investments p {
      color: #7f8c8d;
      margin-bottom: 2rem;
    }

    .quick-actions h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      background: white;
      border: 2px solid #ecf0f1;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      color: #2c3e50;
    }

    .action-btn:hover {
      border-color: #3498db;
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(52, 152, 219, 0.2);
    }

    .action-btn i {
      font-size: 2rem;
      color: #3498db;
    }

    .action-btn span {
      font-weight: 600;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(102, 126, 234, 0.4);
    }

    @media (max-width: 768px) {
      .mis-inversiones-container {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .investment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .investment-amount {
        text-align: left;
        width: 100%;
      }

      .investment-details {
        grid-template-columns: 1fr;
      }

      .investment-actions {
        justify-content: center;
      }
    }

    /* Estilos del Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #ecf0f1;
    }

    .modal-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #7f8c8d;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #ecf0f1;
      color: #2c3e50;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .investment-info {
      margin-bottom: 2rem;
    }

    .investment-info h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .info-item .label {
      color: #7f8c8d;
      font-weight: 500;
    }

    .info-item .value {
      color: #2c3e50;
      font-weight: 600;
    }

    .payment-details h4 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .payment-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .payment-card {
      background: white;
      border: 2px solid #ecf0f1;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .payment-card.provider {
      border-color: #3498db;
      background: linear-gradient(135deg, #f8fbff 0%, #e8f4fd 100%);
    }

    .payment-card.company {
      border-color: #27ae60;
      background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
    }

    .payment-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .payment-header i {
      font-size: 1.5rem;
    }

    .payment-card.provider .payment-header i {
      color: #3498db;
    }

    .payment-card.company .payment-header i {
      color: #27ae60;
    }

    .payment-header h5 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .payment-amount {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .payment-card.provider .payment-amount {
      color: #3498db;
    }

    .payment-card.company .payment-amount {
      color: #27ae60;
    }

    .payment-description {
      color: #7f8c8d;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  `]
})
export class MisInversionesComponent implements OnInit {
  stats = signal<InvestorStats>({
    totalInversiones: 0,
    inversionesActivas: 0,
    montoInvertido: 0,
    rendimientoTotal: 0,
    opportunities: [],
    recentActivities: [],
    investments: []
  });

  cancellingInvestment = signal<number | null>(null);
  showPaymentModal = signal<boolean>(false);
  selectedInvestment = signal<Investment | null>(null);

  constructor(
    private investmentService: InvestmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInvestorStats();
  }

  loadInvestorStats() {
    this.investmentService.getInvestorStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (error) => {
        console.error('Error loading investor stats:', error);
      }
    });
  }

  activeInvestments() {
    return this.stats().investments?.filter(inv => inv.status === 'active') || [];
  }

  cancelInvestment(investmentId: number) {
    if (confirm('¿Estás seguro de que deseas cancelar esta inversión? Esta acción no se puede deshacer.')) {
      this.cancellingInvestment.set(investmentId);
      
      this.investmentService.cancelInvestment(investmentId).subscribe({
        next: (response) => {
          alert('Inversión cancelada exitosamente');
          this.loadInvestorStats(); // Recargar datos
          this.cancellingInvestment.set(null);
        },
        error: (error) => {
          console.error('Error cancelling investment:', error);
          alert(error.error?.message || 'Error al cancelar la inversión');
          this.cancellingInvestment.set(null);
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) {
      return '0.00';
    }
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  getInvestmentStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return '';
    }
  }

  getInvestmentIcon(status: string): string {
    switch (status) {
      case 'active':
        return 'fas fa-clock';
      case 'completed':
        return 'fas fa-check-circle';
      case 'cancelled':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-circle';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  getOperationType(type: string): string {
    switch (type) {
      case 'confirming':
        return 'Confirming';
      case 'factoring':
        return 'Factoring';
      case 'pago_recibido':
        return 'Pago Recibido';
      case 'inversion_realizada':
        return 'Inversión Realizada';
      default:
        return 'Desconocido';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'confirmed':
        return 'active';
      case 'paid':
        return 'completed';
      case 'overdue':
        return 'overdue';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'paid':
        return 'Pagado';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  getRiskClass(risk: string): string {
    switch (risk) {
      case 'low':
        return 'risk-low';
      case 'medium':
        return 'risk-medium';
      case 'high':
        return 'risk-high';
      default:
        return 'risk-default';
    }
  }

  getRiskText(risk: string): string {
    switch (risk) {
      case 'low':
        return 'Bajo';
      case 'medium':
        return 'Medio';
      case 'high':
        return 'Alto';
      default:
        return 'No evaluado';
    }
  }

  getActivityStatusClass(type: string): string {
    switch (type) {
      case 'pago_recibido':
        return 'completed';
      case 'inversion_realizada':
        return 'active';
      default:
        return 'pending';
    }
  }

  getActivityStatusText(type: string): string {
    switch (type) {
      case 'pago_recibido':
        return 'Completado';
      case 'inversion_realizada':
        return 'Activo';
      default:
        return 'Pendiente';
    }
  }

  navigateToOpportunities() {
    this.router.navigate(['/oportunidades-inversion']);
  }

  navigateToProposals() {
    this.router.navigate(['/mis-propuestas']);
  }

  navigateToPortfolio() {
    // Navegar al dashboard del inversor que tiene información del portafolio
    this.router.navigate(['/dashboard/inversor']);
  }

  openPaymentDetailsModal(investment: Investment) {
    this.selectedInvestment.set(investment);
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.selectedInvestment.set(null);
  }

  calculateProviderPayment(investment: Investment): number {
    // El pago al proveedor es el monto de la factura menos el descuento por pago anticipado
    const invoiceAmount = investment.invoice?.amount || 0;
    const earlyPaymentDiscount = investment.invoice?.early_payment_discount || 0;
    const discountAmount = invoiceAmount * (earlyPaymentDiscount / 100);
    return invoiceAmount - discountAmount;
  }

  calculateCompanyPayment(investment: Investment): number {
    // El cobro a la empresa es el monto de la factura más la comisión de confirming
    const invoiceAmount = investment.invoice?.amount || 0;
    const confirmingCommission = investment.invoice?.confirming_commission || 0;
    const commissionAmount = invoiceAmount * (confirmingCommission / 100);
    return invoiceAmount + commissionAmount;
  }
}