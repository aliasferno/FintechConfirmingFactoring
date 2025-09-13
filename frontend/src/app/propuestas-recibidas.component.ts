import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvestmentProposalService, InvestmentProposal } from './services/investment-proposal.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-propuestas-recibidas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="propuestas-recibidas-container">
      <!-- Header -->
      <div class="header">
        <h1>Propuestas Recibidas</h1>
        <p class="subtitle">Gestiona las propuestas de inversión recibidas para tus facturas</p>
      </div>

      <!-- Success Message -->
      <div class="alert alert-success" *ngIf="successMessage()">
        <i class="fas fa-check-circle"></i>
        {{ successMessage() }}
      </div>

      <!-- Error Message -->
      <div class="alert alert-error" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage() }}
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label for="statusFilter">Estado:</label>
            <select 
              id="statusFilter" 
              [(ngModel)]="selectedStatus" 
              (change)="onFilterChange()"
              class="form-select"
            >
              <option value="">Todos los estados</option>
              <option value="sent">Enviadas</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="expired">Expiradas</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Buscar:</label>
            <input 
              id="searchInput"
              type="text" 
              [(ngModel)]="searchTerm" 
              (input)="onSearchChange()"
              placeholder="Buscar por número de factura o inversor..."
              class="form-input"
            >
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon pending">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics().pending }}</h3>
            <p>Pendientes</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon approved">
            <i class="fas fa-check"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics().approved }}</h3>
            <p>Aprobadas</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rejected">
            <i class="fas fa-times"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics().rejected }}</h3>
            <p>Rechazadas</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-list"></i>
          </div>
          <div class="stat-content">
            <h3>{{ statistics().total }}</h3>
            <p>Total</p>
          </div>
        </div>
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
        <p *ngIf="!searchTerm && !selectedStatus">Aún no has recibido propuestas de inversión.</p>
        <p *ngIf="searchTerm || selectedStatus">No se encontraron propuestas con los filtros aplicados.</p>
      </div>

      <!-- Proposals List -->
      <div class="proposals-grid" *ngIf="!isLoading() && filteredProposals().length > 0">
        <div class="proposal-card" *ngFor="let proposal of paginatedProposals()">
          <!-- Card Header -->
          <div class="card-header">
            <div class="proposal-info">
              <h3>Propuesta #{{ proposal.id }}</h3>
              <span class="status-badge" [ngClass]="getStatusClass(proposal.status)">
                {{ getStatusText(proposal.status) }}
              </span>
            </div>
            <div class="proposal-date">
              <small>{{ formatDate(proposal.sent_at || proposal.created_at) }}</small>
            </div>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <!-- Invoice Info -->
            <div class="invoice-info">
              <h4>Factura: {{ proposal.invoice?.invoice_number }}</h4>
              <p class="client-name">Cliente: {{ proposal.invoice?.client_name }}</p>
              <p class="invoice-amount">Monto: {{ formatCurrency(proposal.invoice?.amount) }}</p>
            </div>

            <!-- Investor Info -->
            <div class="investor-info">
              <h4>Inversor</h4>
              <p>{{ proposal.investor?.name || 'Inversor #' + proposal.investor_id }}</p>
              <p class="investor-email">{{ proposal.investor?.email }}</p>
            </div>

            <!-- Proposal Details -->
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

            <!-- Comments -->
            <div class="comments-section" *ngIf="proposal.investor_comments">
              <h4>Comentarios del Inversor:</h4>
              <p>{{ proposal.investor_comments }}</p>
            </div>

            <!-- Negotiation Terms -->
            <div class="terms-section" *ngIf="proposal.negotiation_terms">
              <h4>Términos de Negociación:</h4>
              <p>{{ proposal.negotiation_terms }}</p>
            </div>

            <!-- Response Section -->
            <div class="response-section" *ngIf="proposal.status === 'sent' || proposal.status === 'pending'">
              <div class="response-form">
                <div class="form-group">
                  <label for="responseNotes-{{ proposal.id }}">Notas de respuesta (opcional):</label>
                  <textarea 
                    id="responseNotes-{{ proposal.id }}"
                    [(ngModel)]="responseNotes[proposal.id]"
                    placeholder="Agrega comentarios sobre tu decisión..."
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Approval/Rejection Details -->
            <div class="response-details" *ngIf="proposal.status === 'approved' || proposal.status === 'rejected'">
              <div class="response-info">
                <h4 *ngIf="proposal.status === 'approved'">Propuesta Aprobada</h4>
                <h4 *ngIf="proposal.status === 'rejected'">Propuesta Rechazada</h4>
                
                <div class="response-date">
                  <span class="label">Fecha de respuesta:</span>
                  <span class="value">{{ formatDate(proposal.approved_at || proposal.rejected_at || '') }}</span>
                </div>
                
                <div class="response-notes" *ngIf="proposal.approval_notes || proposal.rejection_reason">
                  <span class="label">Notas:</span>
                  <p>{{ proposal.approval_notes || proposal.rejection_reason }}</p>
                </div>
              </div>
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
              (click)="approveProposal(proposal)"
              *ngIf="canApprove(proposal)"
              [disabled]="isProcessing()"
            >
              <i class="fas fa-check"></i>
              Aprobar
            </button>
            
            <button 
              class="btn btn-danger btn-sm" 
              (click)="rejectProposal(proposal)"
              *ngIf="canReject(proposal)"
              [disabled]="isProcessing()"
            >
              <i class="fas fa-times"></i>
              Rechazar
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" *ngIf="!isLoading() && filteredProposals().length > 0">
        <div class="pagination-info">
          <span>Mostrando {{ getStartIndex() + 1 }} - {{ getEndIndex() }} de {{ filteredProposals().length }} propuestas</span>
        </div>
        
        <div class="pagination-controls">
          <button 
            class="btn btn-outline btn-sm" 
            (click)="previousPage()" 
            [disabled]="currentPage() === 1"
          >
            <i class="fas fa-chevron-left"></i>
            Anterior
          </button>
          
          <span class="page-info">Página {{ currentPage() }} de {{ totalPages() }}</span>
          
          <button 
            class="btn btn-outline btn-sm" 
            (click)="nextPage()" 
            [disabled]="currentPage() === totalPages()"
          >
            Siguiente
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .propuestas-recibidas-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 600;
      color: #2c3e50;
    }

    .form-select, .form-input {
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-select:focus, .form-input:focus {
      outline: none;
      border-color: #3498db;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .stat-icon.pending { background-color: #f39c12; }
    .stat-icon.approved { background-color: #27ae60; }
    .stat-icon.rejected { background-color: #e74c3c; }
    .stat-icon.total { background-color: #3498db; }

    .stat-content h3 {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .loading-container {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .proposals-grid {
      display: grid;
      gap: 1.5rem;
    }

    .proposal-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .proposal-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .proposal-info h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-draft { background-color: #f8f9fa; color: #6c757d; }
    .status-sent { background-color: #cce5ff; color: #0066cc; }
    .status-pending { background-color: #fff3cd; color: #856404; }
    .status-approved { background-color: #d4edda; color: #155724; }
    .status-rejected { background-color: #f8d7da; color: #721c24; }
    .status-expired { background-color: #e2e3e5; color: #383d41; }

    .proposal-date {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .card-content {
      padding: 1.5rem;
    }

    .invoice-info, .investor-info {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .invoice-info h4, .investor-info h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .client-name, .investor-email {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .invoice-amount {
      font-weight: 600;
      color: #27ae60;
    }

    .proposal-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #2c3e50;
    }

    .value {
      font-weight: 500;
    }

    .value.amount, .value.expected-return {
      color: #27ae60;
      font-weight: 600;
    }

    .value.rate {
      color: #3498db;
      font-weight: 600;
    }

    .comments-section, .terms-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .comments-section h4, .terms-section h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .response-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #e3f2fd;
      border-radius: 8px;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      resize: vertical;
      transition: border-color 0.3s ease;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #3498db;
    }

    .response-details {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border-radius: 8px;
    }

    .response-details h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .response-date {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .response-notes {
      margin-top: 1rem;
    }

    .response-notes .label {
      display: block;
      margin-bottom: 0.5rem;
    }

    .card-actions {
      padding: 1rem 1.5rem;
      background-color: #f8f9fa;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-outline {
      background-color: transparent;
      color: #6c757d;
      border: 1px solid #dee2e6;
    }

    .btn-outline:hover:not(:disabled) {
      background-color: #e9ecef;
      color: #495057;
    }

    .btn-success {
      background-color: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #218838;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
    }

    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .pagination-info {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .page-info {
      color: #2c3e50;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .propuestas-recibidas-container {
        padding: 1rem;
      }

      .filters-row {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .proposal-details {
        grid-template-columns: 1fr;
      }

      .card-actions {
        flex-direction: column;
      }

      .pagination-container {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class PropuestasRecibidasComponent implements OnInit {
  proposals = signal<InvestmentProposal[]>([]);
  filteredProposals = signal<InvestmentProposal[]>([]);
  isLoading = signal(false);
  isProcessing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  // Filters
  selectedStatus = '';
  searchTerm = '';
  
  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;
  
  // Statistics
  statistics = signal({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // Response notes for each proposal
  responseNotes: { [key: number]: string } = {};

  constructor(
    private proposalService: InvestmentProposalService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProposals();
  }

  loadProposals() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.proposalService.getCompanyProposals().subscribe({
      next: (response) => {
        const proposalsData = response.data || response;
        this.proposals.set(proposalsData);
        this.applyFilters();
        this.calculateStatistics();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading proposals:', error);
        this.errorMessage.set('Error al cargar las propuestas. Por favor, intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  calculateStatistics() {
    const proposals = this.proposals();
    this.statistics.set({
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'sent' || p.status === 'pending').length,
      approved: proposals.filter(p => p.status === 'approved').length,
      rejected: proposals.filter(p => p.status === 'rejected').length
    });
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
    let filtered = this.proposals();

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(proposal => proposal.status === this.selectedStatus);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.invoice?.invoice_number?.toLowerCase().includes(term) ||
        proposal.investor?.name?.toLowerCase().includes(term) ||
        proposal.investor?.email?.toLowerCase().includes(term)
      );
    }

    this.filteredProposals.set(filtered);
  }

  // Pagination methods
  paginatedProposals = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProposals().slice(startIndex, endIndex);
  });

  totalPages = computed(() => Math.ceil(this.filteredProposals().length / this.itemsPerPage));

  getStartIndex(): number {
    return (this.currentPage() - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    const endIndex = this.currentPage() * this.itemsPerPage;
    return Math.min(endIndex, this.filteredProposals().length);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  // Proposal actions
  approveProposal(proposal: InvestmentProposal) {
    if (!this.canApprove(proposal)) return;
    
    this.isProcessing.set(true);
    this.errorMessage.set('');
    
    const approvalNotes = this.responseNotes[proposal.id] || '';
    
    this.proposalService.approveProposal(proposal.id, approvalNotes).subscribe({
      next: (response) => {
        this.successMessage.set('Propuesta aprobada exitosamente');
        this.loadProposals();
        this.isProcessing.set(false);
        
        // Clear the response notes
        delete this.responseNotes[proposal.id];
        
        // Clear success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (error) => {
        console.error('Error approving proposal:', error);
        this.errorMessage.set('Error al aprobar la propuesta. Por favor, intenta de nuevo.');
        this.isProcessing.set(false);
      }
    });
  }

  rejectProposal(proposal: InvestmentProposal) {
    if (!this.canReject(proposal)) return;
    
    const rejectionReason = this.responseNotes[proposal.id];
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      this.errorMessage.set('Por favor, proporciona una razón para el rechazo.');
      return;
    }
    
    this.isProcessing.set(true);
    this.errorMessage.set('');
    
    this.proposalService.rejectProposal(proposal.id, rejectionReason).subscribe({
      next: (response) => {
        this.successMessage.set('Propuesta rechazada exitosamente');
        this.loadProposals();
        this.isProcessing.set(false);
        
        // Clear the response notes
        delete this.responseNotes[proposal.id];
        
        // Clear success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (error) => {
        console.error('Error rejecting proposal:', error);
        this.errorMessage.set('Error al rechazar la propuesta. Por favor, intenta de nuevo.');
        this.isProcessing.set(false);
      }
    });
  }

  viewProposalDetails(proposal: InvestmentProposal) {
    this.router.navigate(['/propuesta-detalle', proposal.id]);
  }

  viewInvoice(invoiceId: number) {
    this.router.navigate(['/factura-detalle', invoiceId]);
  }

  // Helper methods
  canApprove(proposal: InvestmentProposal): boolean {
    return proposal.status === 'sent' || proposal.status === 'pending';
  }

  canReject(proposal: InvestmentProposal): boolean {
    return proposal.status === 'sent' || proposal.status === 'pending';
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'draft': 'status-draft',
      'sent': 'status-sent',
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'expired': 'status-expired'
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
      'expired': 'Expirada'
    };
    return statusTexts[status] || 'Desconocido';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  calculateExpectedReturn(proposal: InvestmentProposal): number {
    // Para factoring, usar advance_percentage y factoring_commission
    if (proposal.advance_percentage && proposal.factoring_commission) {
      const invoiceAmount = proposal.invoice?.amount || 0;
      const advanceAmount = invoiceAmount * (proposal.advance_percentage / 100);
      const commission = advanceAmount * (proposal.factoring_commission / 100);
      return commission;
    }
    
    // Para confirming, usar confirming_commission
    if (proposal.confirming_commission) {
      const invoiceAmount = proposal.invoice?.amount || 0;
      const commission = invoiceAmount * (proposal.confirming_commission / 100);
      return commission;
    }
    
    return 0;
  }
}