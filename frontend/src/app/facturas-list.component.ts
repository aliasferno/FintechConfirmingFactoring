import { Component, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService, Invoice } from './services/invoice.service';
import { AuthService } from './services/auth.service';
import { ConfirmationModalComponent } from './confirmation-modal.component';

@Component({
  selector: 'app-facturas-list',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  template: `
    <div class="facturas-container">
      <!-- Header -->
      <div class="facturas-header">
        <div class="header-left">
          <h2 class="facturas-title">{{ getTitle() }}</h2>
          <p class="facturas-subtitle">{{ getSubtitle() }}</p>
        </div>
        <div class="header-right">
          <button class="btn-primary" (click)="navigateToNuevaFactura()">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Nueva Factura
          </button>
          <button class="btn-secondary" (click)="goBack()">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando facturas...</p>
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
          <h3>Error al cargar facturas</h3>
          <p>{{ error() }}</p>
          <button class="btn-primary" (click)="loadFacturas()">
            Reintentar
          </button>
        </div>
      }

      <!-- Facturas List -->
      @if (!isLoading() && !error()) {
        @if (facturas().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3>No hay facturas</h3>
            <p>{{ getEmptyMessage() }}</p>
            <button class="btn-primary" (click)="navigateToNuevaFactura()">
              Crear Primera Factura
            </button>
          </div>
        } @else {
          <!-- Stats Summary -->
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-label">Total de facturas:</span>
              <span class="stat-value">{{ facturas().length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Monto total:</span>
              <span class="stat-value">{{ formatCurrency(getTotalAmount()) }}</span>
            </div>
          </div>

          <!-- Facturas Grid -->
          <div class="facturas-grid">
            @for (factura of facturas(); track factura.id) {
              <div class="factura-card" [class]="getStatusClass(factura.status)">
                <div class="factura-header">
                  <div class="factura-number">
                    <h3>{{ factura.invoice_number }}</h3>
                    <span class="operation-type" [class]="factura.operation_type">
                      {{ factura.operation_type === 'factoring' ? 'Factoring' : 'Confirming' }}
                    </span>
                  </div>
                  <div class="factura-status">
                    <span class="status-badge" [class]="getStatusClass(factura.status)">
                      {{ getStatusText(factura.status) }}
                    </span>
                  </div>
                </div>

                <div class="factura-details">
                  <div class="detail-row">
                    <span class="detail-label">Cliente:</span>
                    <span class="detail-value">{{ factura.client_name }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">RUT/NIT:</span>
                    <span class="detail-value">{{ factura.client_tax_id }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Monto:</span>
                    <span class="detail-value amount">{{ formatCurrency(factura.amount) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Fecha de emisión:</span>
                    <span class="detail-value">{{ formatDate(factura.issue_date) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Fecha de vencimiento:</span>
                    <span class="detail-value">{{ formatDate(factura.due_date) }}</span>
                  </div>
                  @if (factura.net_amount) {
                    <div class="detail-row">
                      <span class="detail-label">Monto neto:</span>
                      <span class="detail-value net-amount">{{ formatCurrency(factura.net_amount) }}</span>
                    </div>
                  }
                </div>

                <div class="factura-actions">
                  <button class="btn-outline" (click)="viewFactura(factura.id)">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Ver Detalles
                  </button>
                  @if (factura.status === 'pending') {
                    <button class="btn-primary" (click)="editFactura(factura.id)">
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Editar
                    </button>
                  }
                  <button class="btn-danger" (click)="deleteInvoice(factura.id, factura.invoice_number)">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
      
      <!-- Confirmation Modal -->
      @if (showDeleteModal()) {
        <app-confirmation-modal
          [isVisible]="showDeleteModal()"
          [title]="'Eliminar Factura'"
          [message]="'¿Estás seguro de que deseas eliminar la factura ' + selectedInvoiceNumber() + '? Esta acción no se puede deshacer.'"
          [confirmText]="'Eliminar'"
          (confirmed)="confirmDelete()"
          (cancelled)="cancelDelete()">
        </app-confirmation-modal>
      }
    </div>
  `,
  styleUrls: ['./facturas-list.component.css']
})
export class FacturasListComponent implements OnInit {
  @Input() filterType: 'all' | 'pending' | 'approved' | 'funded' | 'rejected' = 'all';
  @Output() closeModal = new EventEmitter<void>();
  
  facturas = signal<Invoice[]>([]);
  isLoading = signal(true);
  error = signal('');
  
  // Modal state
  showDeleteModal = signal(false);
  selectedInvoiceId = signal<number | null>(null);
  selectedInvoiceNumber = signal<string>('');

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFacturas();
  }

  loadFacturas() {
    this.isLoading.set(true);
    this.error.set('');

    // Build query parameters based on filter type
    const params: any = {};
    if (this.filterType === 'pending') {
      params.status = 'pending';
    } else if (this.filterType === 'approved') {
      params.status = 'approved';
    } else if (this.filterType === 'funded') {
      params.status = 'funded';
    } else if (this.filterType === 'rejected') {
      params.status = 'rejected';
    }

    this.invoiceService.getInvoices(params).subscribe({
      next: (response) => {
        this.facturas.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading facturas:', error);
        this.error.set('Error al cargar las facturas. Por favor, intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  getTitle(): string {
    switch (this.filterType) {
      case 'pending':
        return 'Facturas Pendientes';
      case 'approved':
        return 'Facturas Aprobadas';
      case 'funded':
        return 'Facturas Financiadas';
      case 'rejected':
        return 'Facturas Rechazadas';
      default:
        return 'Todas las Facturas';
    }
  }

  getSubtitle(): string {
    switch (this.filterType) {
      case 'pending':
        return 'Facturas en proceso de revisión';
      case 'approved':
        return 'Facturas aprobadas para financiamiento';
      case 'funded':
        return 'Facturas que han sido financiadas';
      case 'rejected':
        return 'Facturas que no fueron aprobadas';
      default:
        return 'Gestiona todas tus facturas desde aquí';
    }
  }

  getEmptyMessage(): string {
    switch (this.filterType) {
      case 'pending':
        return 'No tienes facturas pendientes en este momento.';
      case 'approved':
        return 'No tienes facturas aprobadas en este momento.';
      case 'funded':
        return 'No tienes facturas financiadas en este momento.';
      case 'rejected':
        return 'No tienes facturas rechazadas.';
      default:
        return 'Aún no has creado ninguna factura. ¡Comienza creando tu primera factura!';
    }
  }

  getTotalAmount(): number {
    return this.facturas().reduce((total, factura) => {
      const amount = typeof factura.amount === 'string' ? parseFloat(factura.amount) : factura.amount;
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'funded':
        return 'status-funded';
      case 'paid':
        return 'status-paid';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'funded':
        return 'Financiada';
      case 'paid':
        return 'Pagada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  }

  formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '$0';
    }
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericAmount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  navigateToNuevaFactura() {
    this.router.navigate(['/facturas/nueva']);
  }

  viewFactura(id: number) {
    this.router.navigate(['/facturas/detalle', id]);
  }

  editFactura(id: number) {
    this.router.navigate(['/facturas/editar', id]);
  }

  deleteInvoice(id: number, invoiceNumber: string) {
    this.selectedInvoiceId.set(id);
    this.selectedInvoiceNumber.set(invoiceNumber);
    this.showDeleteModal.set(true);
  }
  
  confirmDelete() {
    const id = this.selectedInvoiceId();
    if (id) {
      this.invoiceService.deleteInvoice(id).subscribe({
        next: () => {
          console.log('Factura eliminada exitosamente');
          this.showDeleteModal.set(false);
          this.selectedInvoiceId.set(null);
          this.selectedInvoiceNumber.set('');
          // Recargar la lista de facturas
          this.loadFacturas();
        },
        error: (error) => {
          console.error('Error al eliminar la factura:', error);
          this.showDeleteModal.set(false);
          alert('Error al eliminar la factura. Por favor, inténtalo de nuevo.');
        }
      });
    }
  }
  
  cancelDelete() {
    this.showDeleteModal.set(false);
    this.selectedInvoiceId.set(null);
    this.selectedInvoiceNumber.set('');
  }

  goBack() {
    this.closeModal.emit();
  }
}