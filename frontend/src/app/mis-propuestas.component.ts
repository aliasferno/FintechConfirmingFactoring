import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvestmentProposalService, InvestmentProposal, ProposalResponse } from './services/investment-proposal.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-mis-propuestas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mis-propuestas-container">
      <div class="header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver
          </button>
          <div class="header-content">
            <h1>Mis Propuestas de Inversión</h1>
            <p class="subtitle">Gestiona y da seguimiento a tus propuestas de inversión</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="goToOpportunities()">
            <i class="fas fa-plus"></i>
            Nueva Propuesta
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div class="alert alert-success" *ngIf="successMessage()">
        <i class="fas fa-check-circle"></i>
        {{ successMessage() }}
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters">
          <div class="filter-group">
            <label for="statusFilter">Estado:</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="onFilterChange()" class="form-control">
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="expired">Expirada</option>
              <option value="withdrawn">Retirada</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="sortBy">Ordenar por:</label>
            <select id="sortBy" [(ngModel)]="sortBy" (change)="onFilterChange()" class="form-control">
              <option value="created_at">Fecha de creación</option>
              <option value="proposed_amount">Monto propuesto</option>
              <option value="proposed_interest_rate">Tasa de interés</option>
              <option value="created_at">Fecha de creación</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="sortOrder">Orden:</label>
            <select id="sortOrder" [(ngModel)]="sortOrder" (change)="onFilterChange()" class="form-control">
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
        
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Buscar por empresa o número de factura..."
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()"
            class="form-control"
          >
          <i class="fas fa-search search-icon"></i>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-section" *ngIf="statistics()">
        <div class="stat-card">
          <div class="stat-icon pending">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics()?.pending || 0 }}</h3>
            <p>Pendientes</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon approved">
            <i class="fas fa-check"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics()?.approved || 0 }}</h3>
            <p>Aprobadas</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rejected">
            <i class="fas fa-times"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics()?.rejected || 0 }}</h3>
            <p>Rechazadas</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>{{ formatCurrency(statistics()?.total_proposed_amount || 0) }}</h3>
            <p>Total en Propuestas</p>
          </div>
        </div>
      </div>

      <!-- Proposals List -->
      <div class="proposals-section">
        <div class="proposals-header">
          <h2>Propuestas ({{ filteredProposals().length }})</h2>
          <button class="btn btn-outline" (click)="refreshProposals()" [disabled]="isLoading()">
            <i class="fas fa-sync-alt" [class.spinning]="isLoading()"></i>
            Actualizar
          </button>
        </div>

        <!-- Loading State -->
        <div class="loading-container" *ngIf="isLoading()">
          <div class="spinner"></div>
          <p>Cargando propuestas...</p>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!isLoading() && filteredProposals().length === 0">
          <div class="empty-icon">
            <i class="fas fa-inbox"></i>
          </div>
          <h3>No hay propuestas</h3>
          <p *ngIf="searchTerm || selectedStatus">
            No se encontraron propuestas con los filtros aplicados.
          </p>
          <p *ngIf="!searchTerm && !selectedStatus">
            Aún no has creado ninguna propuesta de inversión.
          </p>
          <button class="btn btn-primary" (click)="goToOpportunities()">
            <i class="fas fa-plus"></i>
            Crear Primera Propuesta
          </button>
        </div>

        <!-- Proposals Grid -->
        <div class="proposals-grid" *ngIf="!isLoading() && filteredProposals().length > 0">
          <div class="proposal-card" *ngFor="let proposal of filteredProposals()" [class]="getProposalCardClass(proposal)">
            
            <!-- Card Header -->
            <div class="card-header">
              <div class="proposal-info">
                <h3>{{ proposal.invoice?.company?.business_name || 'Empresa no disponible' }}</h3>
                <p class="invoice-number">Factura: {{ proposal.invoice?.invoice_number || 'N/A' }}</p>
              </div>
              <div class="status-badge" [class]="getStatusClass(proposal.status)">
                {{ getStatusText(proposal.status) }}
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <div class="proposal-details">
                <!-- Factoring Details -->
                <div *ngIf="proposal.advance_percentage" class="detail-row">
                  <span class="label">Porcentaje de Anticipo:</span>
                  <span class="value rate">{{ proposal.advance_percentage }}%</span>
                </div>
                
                <div *ngIf="proposal.factoring_commission" class="detail-row">
                  <span class="label">Comisión de Factoring:</span>
                  <span class="value rate">{{ proposal.factoring_commission }}%</span>
                </div>
                
                <div *ngIf="proposal.risk_assessment" class="detail-row">
                  <span class="label">Evaluación de Riesgo:</span>
                  <span class="value">{{ proposal.risk_assessment }}</span>
                </div>
                
                <!-- Confirming Details -->
                <div *ngIf="proposal.payment_terms" class="detail-row">
                  <span class="label">Términos de Pago:</span>
                  <span class="value">{{ proposal.payment_terms }}</span>
                </div>
                
                <div *ngIf="proposal.confirming_commission" class="detail-row">
                  <span class="label">Comisión de Confirming:</span>
                  <span class="value rate">{{ proposal.confirming_commission }}%</span>
                </div>
                
                <div *ngIf="proposal.early_payment_discount" class="detail-row">
                  <span class="label">Descuento por Pago Anticipado:</span>
                  <span class="value rate">{{ proposal.early_payment_discount }}%</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Comisión Estimada:</span>
                  <span class="value expected-return">{{ formatCurrency(calculateExpectedReturn(proposal)) }}</span>
                </div>
              </div>

              <!-- Timeline -->
              <div class="timeline">
                <div class="timeline-item">
                  <span class="label">Creada:</span>
                  <span class="value">{{ formatDate(proposal.created_at) }}</span>
                </div>
                
                <div class="timeline-item" *ngIf="proposal.status === 'expired'">
                  <span class="label">Estado:</span>
                  <span class="value expired">
                    Expirada
                  </span>
                </div>
                
                <div class="timeline-item" *ngIf="proposal.responded_at">
                  <span class="label">Respondida:</span>
                  <span class="value">{{ formatDate(proposal.responded_at) }}</span>
                </div>
              </div>

              <!-- Company Response -->
              <div class="company-response" *ngIf="proposal.company_response">
                <h4>Respuesta de la Empresa:</h4>
                <p>{{ proposal.company_response }}</p>
              </div>

              <!-- Investor Comments -->
              <div class="investor-comments" *ngIf="proposal.investor_comments">
                <h4>Tus Comentarios:</h4>
                <p>{{ proposal.investor_comments }}</p>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button 
                class="btn btn-outline btn-sm" 
                (click)="viewProposalDetails(proposal)"
              >
                <i class="fas fa-eye"></i>
                Ver Detalles
              </button>
              
              <button 
                class="btn btn-outline btn-sm" 
                (click)="viewInvoice(proposal.invoice_id)"
                *ngIf="proposal.invoice_id"
              >
                <i class="fas fa-file-invoice"></i>
                Ver Factura
              </button>
              
              <button 
                class="btn btn-success btn-sm" 
                (click)="sendProposal(proposal)"
                *ngIf="canSend(proposal)"
                [disabled]="isSending()"
              >
                <i class="fas fa-paper-plane"></i>
                Enviar
              </button>
              
              <button 
                class="btn btn-warning btn-sm" 
                (click)="withdrawProposal(proposal)"
                *ngIf="canWithdraw(proposal)"
                [disabled]="isWithdrawing()"
              >
                <i class="fas fa-undo"></i>
                Retirar
              </button>
              
              <button 
                class="btn btn-primary btn-sm" 
                (click)="duplicateProposal(proposal)"
                *ngIf="canDuplicate(proposal)"
              >
                <i class="fas fa-copy"></i>
                Duplicar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-section" *ngIf="totalPages() > 1">
        <button 
          class="btn btn-outline" 
          (click)="goToPage(currentPage() - 1)"
          [disabled]="currentPage() <= 1"
        >
          <i class="fas fa-chevron-left"></i>
          Anterior
        </button>
        
        <span class="page-info">
          Página {{ currentPage() }} de {{ totalPages() }}
        </span>
        
        <button 
          class="btn btn-outline" 
          (click)="goToPage(currentPage() + 1)"
          [disabled]="currentPage() >= totalPages()"
        >
          Siguiente
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./mis-propuestas.component.css']
})
export class MisPropuestasComponent implements OnInit {
  proposals = signal<InvestmentProposal[]>([]);
  filteredProposals = signal<InvestmentProposal[]>([]);
  statistics = signal<any>(null);
  isLoading = signal(true);
  isWithdrawing = signal(false);
  isSending = signal(false);
  successMessage = signal('');
  
  // Filters
  selectedStatus = '';
  searchTerm = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  
  // Pagination
  currentPage = signal(1);
  itemsPerPage = 12;
  totalPages = signal(1);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proposalService: InvestmentProposalService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check for success message from query params
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.successMessage.set(params['success']);
        // Clear message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);
      }
    });

    this.loadProposals();
  }

  loadProposals() {
    this.isLoading.set(true);
    
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user:', currentUser);
    if (!currentUser?.id) {
      console.log('No current user found');
      this.isLoading.set(false);
      return;
    }

    console.log('Loading proposals for user:', currentUser.id);
    this.proposalService.getInvestorProposals().subscribe({
      next: (response: any) => {
        console.log('Proposals response:', response);
        // El backend devuelve un objeto paginado, extraer los datos
        const proposalsData = response.data || response;
        console.log('Proposals data:', proposalsData);
        this.proposals.set(proposalsData);
        this.applyFilters();
        this.loadStatistics(); // Calcular estadísticas después de cargar propuestas
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading proposals:', error);
        console.error('Error details:', error.error);
        this.isLoading.set(false);
      }
    });
  }

  loadStatistics() {
    // Calcular estadísticas localmente desde las propuestas cargadas
    const proposals = this.proposals();
    const stats = {
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'pending' || p.status === 'sent').length,
      approved: proposals.filter(p => p.status === 'approved').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      draft: proposals.filter(p => p.status === 'draft').length
    };
    this.statistics.set(stats);
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.applyFilters();
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.proposals()];

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.invoice?.company?.business_name?.toLowerCase().includes(term) ||
        p.invoice?.invoice_number?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'invoice_amount':
          aValue = a.invoice?.amount || 0;
          bValue = b.invoice?.amount || 0;
          break;
        case 'commission':
          aValue = a.factoring_commission || a.confirming_commission || 0;
          bValue = b.factoring_commission || b.confirming_commission || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Update pagination
    this.totalPages.set(Math.ceil(filtered.length / this.itemsPerPage));
    
    // Apply pagination
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    this.filteredProposals.set(filtered.slice(startIndex, endIndex));
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applyFilters();
    }
  }

  refreshProposals() {
    this.loadProposals();
    this.loadStatistics();
  }

  withdrawProposal(proposal: InvestmentProposal) {
    if (!confirm('¿Estás seguro de que deseas retirar esta propuesta?')) {
      return;
    }

    this.isWithdrawing.set(true);
    
    this.proposalService.respondToProposal(proposal.id, {
      action: 'reject',
      response_message: 'Propuesta retirada por el inversor'
    }).subscribe({
      next: () => {
        this.successMessage.set('Propuesta retirada exitosamente');
        this.refreshProposals();
        this.isWithdrawing.set(false);
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (error) => {
        console.error('Error withdrawing proposal:', error);
        this.isWithdrawing.set(false);
      }
    });
  }

  duplicateProposal(proposal: InvestmentProposal) {
    // Navigate to create proposal with pre-filled data
    const queryParams: any = {
      duplicate: proposal.id
    };
    
    // Agregar parámetros según el tipo de operación
    if (proposal.advance_percentage) {
      queryParams.advance_percentage = proposal.advance_percentage;
    }
    if (proposal.factoring_commission) {
      queryParams.factoring_commission = proposal.factoring_commission;
    }
    if (proposal.risk_assessment) {
      queryParams.risk_assessment = proposal.risk_assessment;
    }
    if (proposal.payment_terms) {
      queryParams.payment_terms = proposal.payment_terms;
    }
    if (proposal.confirming_commission) {
      queryParams.confirming_commission = proposal.confirming_commission;
    }
    if (proposal.early_payment_discount) {
      queryParams.early_payment_discount = proposal.early_payment_discount;
    }
    
    this.router.navigate(['/crear-propuesta', proposal.invoice_id], {
      queryParams
    });
  }

  viewProposalDetails(proposal: InvestmentProposal) {
    this.router.navigate(['/propuesta-detalle', proposal.id]);
  }

  viewInvoice(invoiceId: number) {
    this.router.navigate(['/factura-detalle', invoiceId]);
  }

  goToOpportunities() {
    this.router.navigate(['/oportunidades-inversion']);
  }

  goBack() {
    this.router.navigate(['/dashboard-inversor']);
  }

  sendProposal(proposal: InvestmentProposal) {
    if (!confirm('¿Estás seguro de que deseas enviar esta propuesta a la empresa?')) {
      return;
    }

    this.isSending.set(true);
    
    this.proposalService.sendProposal(proposal.id).subscribe({
      next: (response) => {
        this.successMessage.set('Propuesta enviada exitosamente a la empresa');
        this.refreshProposals();
        this.isSending.set(false);
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (error) => {
        console.error('Error sending proposal:', error);
        this.isSending.set(false);
        alert('Error al enviar la propuesta. Por favor, inténtalo de nuevo.');
      }
    });
  }

  canSend(proposal: InvestmentProposal): boolean {
    return proposal.status === 'draft';
  }

  canWithdraw(proposal: InvestmentProposal): boolean {
    return ['sent', 'pending'].includes(proposal.status) && proposal.status !== 'expired';
  }

  canDuplicate(proposal: InvestmentProposal): boolean {
    return ['rejected', 'expired'].includes(proposal.status);
  }

  isExpired(proposal: InvestmentProposal): boolean {
    return proposal.status === 'expired';
  }

  getDaysLeft(proposal: InvestmentProposal): number {
    // Ya no calculamos días restantes basados en fecha de expiración
    // Las propuestas se marcan como expiradas por status
    return proposal.status === 'expired' ? 0 : 30; // Valor por defecto
  }

  calculateExpectedReturn(proposal: InvestmentProposal): number {
    // Calcular comisión basada en el tipo de operación
    if (proposal.factoring_commission && proposal.advance_percentage) {
      // Factoring: comisión sobre el monto de anticipo
      const invoiceAmount = proposal.invoice?.amount || 0;
      const advanceAmount = invoiceAmount * (proposal.advance_percentage / 100);
      return advanceAmount * (proposal.factoring_commission / 100);
    } else if (proposal.confirming_commission) {
      // Confirming: comisión sobre el monto total
      const invoiceAmount = proposal.invoice?.amount || 0;
      return invoiceAmount * (proposal.confirming_commission / 100);
    }
    return 0;
  }

  getProposalCardClass(proposal: InvestmentProposal): string {
    const baseClass = 'proposal-card';
    const statusClass = `status-${proposal.status}`;
    const expiredClass = this.isExpired(proposal) ? 'expired' : '';
    return [baseClass, statusClass, expiredClass].filter(Boolean).join(' ');
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'draft': 'status-draft',
      'sent': 'status-sent',
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'expired': 'status-expired',
      'withdrawn': 'status-withdrawn'
    };
    return statusClasses[status] || 'status-unknown';
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'draft': 'Borrador',
      'sent': 'Enviada',
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'expired': 'Expirada',
      'withdrawn': 'Retirada'
    };
    return statusTexts[status] || 'Desconocido';
  }

  formatCurrency(amount: number): string {
    return this.proposalService.formatCurrency(amount);
  }

  formatPercentage(rate: number): string {
    return this.proposalService.formatPercentage(rate);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}