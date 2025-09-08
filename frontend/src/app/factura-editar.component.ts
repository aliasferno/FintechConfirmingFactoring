import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService, Invoice } from './services/invoice.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-factura-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="factura-editar-container">
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
            <h1>Editar Factura</h1>
            @if (factura()) {
              <p class="factura-number">{{ factura()!.invoice_number }}</p>
            }
          </div>
        </div>
        <div class="header-right">
          <button 
            class="btn-primary" 
            (click)="saveFactura()" 
            [disabled]="!facturaForm.valid || isSaving()"
          >
            @if (isSaving()) {
              <div class="spinner"></div>
            } @else {
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            }
            {{ isSaving() ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando factura...</p>
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
          <h3>Error</h3>
          <p>{{ error() }}</p>
          <button class="btn-primary" (click)="loadFactura()">
            Reintentar
          </button>
        </div>
      }

      <!-- Edit Form -->
      @if (!isLoading() && !error() && factura()) {
        <form [formGroup]="facturaForm" (ngSubmit)="saveFactura()" class="edit-form">
          <!-- Basic Information -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Información Básica
            </h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="invoice_number">Número de Factura *</label>
                <input 
                  type="text" 
                  id="invoice_number" 
                  formControlName="invoice_number"
                  class="form-control"
                  [class.error]="facturaForm.get('invoice_number')?.invalid && facturaForm.get('invoice_number')?.touched"
                >
                @if (facturaForm.get('invoice_number')?.invalid && facturaForm.get('invoice_number')?.touched) {
                  <span class="error-message">El número de factura es requerido</span>
                }
              </div>

              <div class="form-group">
                <label for="operation_type">Tipo de Operación *</label>
                <select 
                  id="operation_type" 
                  formControlName="operation_type"
                  class="form-control"
                  [class.error]="facturaForm.get('operation_type')?.invalid && facturaForm.get('operation_type')?.touched"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="factoring">Factoring</option>
                  <option value="confirming">Confirming</option>
                </select>
                @if (facturaForm.get('operation_type')?.invalid && facturaForm.get('operation_type')?.touched) {
                  <span class="error-message">El tipo de operación es requerido</span>
                }
              </div>
            </div>
          </div>

          <!-- Client Information -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Información del Cliente
            </h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="client_name">Nombre del Cliente *</label>
                <input 
                  type="text" 
                  id="client_name" 
                  formControlName="client_name"
                  class="form-control"
                  [class.error]="facturaForm.get('client_name')?.invalid && facturaForm.get('client_name')?.touched"
                >
                @if (facturaForm.get('client_name')?.invalid && facturaForm.get('client_name')?.touched) {
                  <span class="error-message">El nombre del cliente es requerido</span>
                }
              </div>

              <div class="form-group">
                <label for="client_tax_id">RUT/NIT del Cliente *</label>
                <input 
                  type="text" 
                  id="client_tax_id" 
                  formControlName="client_tax_id"
                  class="form-control"
                  [class.error]="facturaForm.get('client_tax_id')?.invalid && facturaForm.get('client_tax_id')?.touched"
                >
                @if (facturaForm.get('client_tax_id')?.invalid && facturaForm.get('client_tax_id')?.touched) {
                  <span class="error-message">El RUT/NIT del cliente es requerido</span>
                }
              </div>
            </div>
          </div>

          <!-- Financial Information -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
              Información Financiera
            </h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="amount">Monto *</label>
                <input 
                  type="number" 
                  id="amount" 
                  formControlName="amount"
                  class="form-control"
                  min="0"
                  step="0.01"
                  [class.error]="facturaForm.get('amount')?.invalid && facturaForm.get('amount')?.touched"
                >
                @if (facturaForm.get('amount')?.invalid && facturaForm.get('amount')?.touched) {
                  <span class="error-message">El monto es requerido y debe ser mayor a 0</span>
                }
              </div>

              <div class="form-group">
                <label for="discount_rate">Tasa de Descuento (%)</label>
                <input 
                  type="number" 
                  id="discount_rate" 
                  formControlName="discount_rate"
                  class="form-control"
                  min="0"
                  max="100"
                  step="0.01"
                >
              </div>
            </div>
          </div>

          <!-- Factoring Specific Information -->
          @if (facturaForm.get('operation_type')?.value === 'factoring') {
            <div class="form-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Información de Factoring
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="advance_percentage">Porcentaje de Anticipo (%)</label>
                  <input 
                    type="number" 
                    id="advance_percentage" 
                    formControlName="advance_percentage"
                    class="form-control"
                    min="0"
                    max="100"
                    step="0.01"
                  >
                </div>

                <div class="form-group">
                  <label for="commission_rate">Tasa de Comisión (%)</label>
                  <input 
                    type="number" 
                    id="commission_rate" 
                    formControlName="commission_rate"
                    class="form-control"
                    min="0"
                    max="100"
                    step="0.01"
                  >
                </div>

                <div class="form-group">
                  <label for="expected_collection_date">Fecha Esperada de Cobro</label>
                  <input 
                    type="date" 
                    id="expected_collection_date" 
                    formControlName="expected_collection_date"
                    class="form-control"
                  >
                </div>

                <div class="form-group">
                  <label for="credit_risk_assessment">Evaluación de Riesgo Crediticio</label>
                  <select 
                    id="credit_risk_assessment" 
                    formControlName="credit_risk_assessment"
                    class="form-control"
                  >
                    <option value="">Seleccionar evaluación</option>
                    <option value="low">Bajo</option>
                    <option value="medium">Medio</option>
                    <option value="high">Alto</option>
                  </select>
                </div>
              </div>
            </div>
          }

          <!-- Confirming Specific Information -->
          @if (facturaForm.get('operation_type')?.value === 'confirming') {
            <div class="form-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Información de Confirming
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="supplier_name">Nombre del Proveedor</label>
                  <input 
                    type="text" 
                    id="supplier_name" 
                    formControlName="supplier_name"
                    class="form-control"
                  >
                </div>

                <div class="form-group">
                  <label for="supplier_tax_id">RUT/NIT del Proveedor</label>
                  <input 
                    type="text" 
                    id="supplier_tax_id" 
                    formControlName="supplier_tax_id"
                    class="form-control"
                  >
                </div>

                <div class="form-group">
                  <label for="payment_terms">Términos de Pago (días)</label>
                  <input 
                    type="number" 
                    id="payment_terms" 
                    formControlName="payment_terms"
                    class="form-control"
                    min="0"
                  >
                </div>

                <div class="form-group">
                  <label for="early_payment_discount">Descuento por Pago Anticipado (%)</label>
                  <input 
                    type="number" 
                    id="early_payment_discount" 
                    formControlName="early_payment_discount"
                    class="form-control"
                    min="0"
                    max="100"
                    step="0.01"
                  >
                </div>

                <div class="form-group">
                  <label for="confirmation_deadline">Fecha Límite de Confirmación</label>
                  <input 
                    type="date" 
                    id="confirmation_deadline" 
                    formControlName="confirmation_deadline"
                    class="form-control"
                  >
                </div>
              </div>
            </div>
          }

          <!-- Dates -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Fechas
            </h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="issue_date">Fecha de Emisión *</label>
                <input 
                  type="date" 
                  id="issue_date" 
                  formControlName="issue_date"
                  class="form-control"
                  [class.error]="facturaForm.get('issue_date')?.invalid && facturaForm.get('issue_date')?.touched"
                >
                @if (facturaForm.get('issue_date')?.invalid && facturaForm.get('issue_date')?.touched) {
                  <span class="error-message">La fecha de emisión es requerida</span>
                }
              </div>

              <div class="form-group">
                <label for="due_date">Fecha de Vencimiento *</label>
                <input 
                  type="date" 
                  id="due_date" 
                  formControlName="due_date"
                  class="form-control"
                  [class.error]="facturaForm.get('due_date')?.invalid && facturaForm.get('due_date')?.touched"
                >
                @if (facturaForm.get('due_date')?.invalid && facturaForm.get('due_date')?.touched) {
                  <span class="error-message">La fecha de vencimiento es requerida</span>
                }
              </div>
            </div>
          </div>

          <!-- Status Information -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Estado
            </h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="status">Estado *</label>
                <select 
                  id="status" 
                  formControlName="status"
                  class="form-control"
                  [class.error]="facturaForm.get('status')?.invalid && facturaForm.get('status')?.touched"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="paid">Pagada</option>
                </select>
                @if (facturaForm.get('status')?.invalid && facturaForm.get('status')?.touched) {
                  <span class="error-message">El estado es requerido</span>
                }
              </div>

              <div class="form-group">
                <label for="verification_status">Estado de Verificación *</label>
                <select 
                  id="verification_status" 
                  formControlName="verification_status"
                  class="form-control"
                  [class.error]="facturaForm.get('verification_status')?.invalid && facturaForm.get('verification_status')?.touched"
                >
                  <option value="pending">Pendiente</option>
                  <option value="verified">Verificada</option>
                  <option value="rejected">Rechazada</option>
                </select>
                @if (facturaForm.get('verification_status')?.invalid && facturaForm.get('verification_status')?.touched) {
                  <span class="error-message">El estado de verificación es requerido</span>
                }
              </div>
            </div>
          </div>

          <!-- Document Upload -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
              </svg>
              Documento
            </h3>
            
            <div class="form-group">
              <label for="document">Documento de la Factura</label>
              <input 
                type="file" 
                id="document" 
                (change)="onFileSelected($event)"
                class="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
              >
              @if (factura()?.document_path) {
                <div class="current-document">
                   <span class="document-info">Documento actual: {{ getDocumentName(factura()!.document_path!) }}</span>
                   <button type="button" class="btn-link" (click)="downloadDocument()">Descargar</button>
                 </div>
              }
            </div>
          </div>

          <!-- Description -->
          <div class="form-section">
            <h3 class="section-title">
              <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
              </svg>
              Descripción
            </h3>
            
            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea 
                id="description" 
                formControlName="description"
                class="form-control"
                rows="4"
                placeholder="Descripción opcional de la factura..."
              ></textarea>
            </div>
          </div>

          <!-- Audit Information -->
          @if (factura()) {
            <div class="form-section">
              <h3 class="section-title">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Información de Auditoría
              </h3>
              
              <div class="audit-info">
                <div class="audit-item">
                   <span class="audit-label">Empresa:</span>
                   <span class="audit-value">{{ factura()!.company?.business_name || 'N/A' }}</span>
                 </div>
                <div class="audit-item">
                  <span class="audit-label">Creada:</span>
                  <span class="audit-value">{{ formatDate(factura()!.created_at) }}</span>
                </div>
                <div class="audit-item">
                  <span class="audit-label">Última modificación:</span>
                  <span class="audit-value">{{ formatDate(factura()!.updated_at) }}</span>
                </div>
                @if (factura()!.risk_score !== undefined && factura()!.risk_score !== null) {
                  <div class="audit-item">
                    <span class="audit-label">Puntuación de riesgo:</span>
                    <span class="audit-value">{{ factura()!.risk_score }}/100</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              [disabled]="!facturaForm.valid || isSaving()"
            >
              @if (isSaving()) {
                <div class="spinner"></div>
                Guardando...
              } @else {
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Guardar Cambios
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styleUrls: ['./factura-editar.component.css']
})
export class FacturaEditarComponent implements OnInit {
  factura = signal<Invoice | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal('');
  facturaId: number = 0;
  facturaForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private authService: AuthService
  ) {
    this.facturaForm = this.fb.group({
      invoice_number: ['', [Validators.required]],
      operation_type: ['', [Validators.required]],
      client_name: ['', [Validators.required]],
      client_tax_id: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      discount_rate: [0],
      issue_date: ['', [Validators.required]],
      due_date: ['', [Validators.required]],
      status: ['pending'],
      verification_status: ['pending'],
      description: [''],
      // Factoring specific fields
      advance_percentage: [null],
      commission_rate: [null],
      expected_collection_date: [''],
      credit_risk_assessment: [''],
      // Confirming specific fields
      supplier_name: [''],
      supplier_tax_id: [''],
      payment_terms: [null],
      early_payment_discount: [null],
      confirmation_deadline: ['']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.facturaId = +params['id'];
      this.loadFactura();
    });
    
    // Subscribe to operation_type changes to update validations
    this.facturaForm.get('operation_type')?.valueChanges.subscribe(operationType => {
      this.updateValidationsBasedOnOperationType(operationType);
    });
  }

  loadFactura() {
    if (!this.facturaId) return;
    
    this.isLoading.set(true);
    this.error.set('');

    this.invoiceService.getInvoice(this.facturaId).subscribe({
      next: (factura) => {
        this.factura.set(factura);
        this.populateForm(factura);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading factura:', error);
        this.error.set('Error al cargar la factura. Por favor, inténtelo de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  populateForm(factura: Invoice) {
    this.facturaForm.patchValue({
      invoice_number: factura.invoice_number,
      operation_type: factura.operation_type,
      client_name: factura.client_name,
      client_tax_id: factura.client_tax_id,
      amount: factura.amount,
      discount_rate: factura.discount_rate || 0,
      issue_date: this.formatDateForInput(factura.issue_date),
      due_date: this.formatDateForInput(factura.due_date),
      status: factura.status,
      verification_status: factura.verification_status,
      description: factura.description || '',
      // Factoring specific fields
      advance_percentage: factura.advance_percentage || null,
      commission_rate: factura.commission_rate || null,
      expected_collection_date: factura.expected_collection_date ? this.formatDateForInput(factura.expected_collection_date) : '',
      credit_risk_assessment: factura.credit_risk_assessment || '',
      // Confirming specific fields
      supplier_name: factura.supplier_name || '',
      supplier_tax_id: factura.supplier_tax_id || '',
      payment_terms: factura.payment_terms || null,
      early_payment_discount: factura.early_payment_discount || null,
      confirmation_deadline: factura.confirmation_deadline ? this.formatDateForInput(factura.confirmation_deadline) : ''
    });
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  saveFactura() {
    if (!this.facturaForm.valid || !this.facturaId) {
      this.facturaForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set('');

    const formData = new FormData();
    const formValue = this.facturaForm.value;

    // Add form fields to FormData
    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== null && formValue[key] !== undefined && formValue[key] !== '') {
        formData.append(key, formValue[key]);
      }
    });

    // Add method override for Laravel
    formData.append('_method', 'PUT');

    // Add file if selected
    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }

    this.invoiceService.updateInvoice(this.facturaId, formData).subscribe({
      next: (response) => {
        console.log('Factura updated successfully:', response);
        // Actualizar la factura local con los nuevos datos
        if (response.invoice) {
          this.factura.set(response.invoice);
        }
        this.router.navigate(['/facturas/detalle', this.facturaId]);
      },
      error: (error) => {
        console.error('Error updating factura:', error);
        let errorMessage = 'Error al actualizar la factura. Por favor, inténtelo de nuevo.';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && error.error.errors) {
          // Manejar errores de validación de Laravel
          const validationErrors = Object.values(error.error.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
        
        this.error.set(errorMessage);
        this.isSaving.set(false);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  getDocumentName(documentPath: string): string {
    return documentPath.split('/').pop() || 'documento';
  }

  downloadDocument() {
    if (this.factura()?.document_path) {
      this.invoiceService.downloadDocument(this.facturaId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.getDocumentName(this.factura()!.document_path!);
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading document:', error);
          this.error.set('Error al descargar el documento');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  updateValidationsBasedOnOperationType(operationType: string) {
    // Clear all specific field validations first
    const factoringFields = ['advance_percentage', 'commission_rate', 'expected_collection_date', 'credit_risk_assessment'];
    const confirmingFields = ['supplier_name', 'supplier_tax_id', 'payment_terms', 'early_payment_discount', 'confirmation_deadline'];
    
    [...factoringFields, ...confirmingFields].forEach(field => {
      this.facturaForm.get(field)?.clearValidators();
      this.facturaForm.get(field)?.updateValueAndValidity();
    });
    
    // Add specific validations based on operation type
    if (operationType === 'factoring') {
      this.facturaForm.get('advance_percentage')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.facturaForm.get('commission_rate')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.facturaForm.get('expected_collection_date')?.setValidators([Validators.required]);
      this.facturaForm.get('credit_risk_assessment')?.setValidators([Validators.required]);
    } else if (operationType === 'confirming') {
      this.facturaForm.get('supplier_name')?.setValidators([Validators.required]);
      this.facturaForm.get('supplier_tax_id')?.setValidators([Validators.required]);
      this.facturaForm.get('payment_terms')?.setValidators([Validators.required, Validators.min(1)]);
      this.facturaForm.get('confirmation_deadline')?.setValidators([Validators.required]);
    }
    
    // Update validity for all fields
    [...factoringFields, ...confirmingFields].forEach(field => {
      this.facturaForm.get(field)?.updateValueAndValidity();
    });
  }

  goBack() {
    if (this.facturaId) {
      this.router.navigate(['/facturas/detalle', this.facturaId]);
    } else {
      this.router.navigate(['/facturas']);
    }
  }
}