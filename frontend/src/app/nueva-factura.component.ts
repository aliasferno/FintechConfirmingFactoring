import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { InvoiceService } from './services/invoice.service';
import { InvoiceValidationService } from './services/invoice-validation.service';

export interface InvoiceRequest {
  company_id: number;
  invoice_number: string;
  client_name: string;
  client_tax_id: string;
  amount: number;
  issue_date: string;
  due_date: string;
  operation_type: 'confirming' | 'factoring';
  description?: string;
  document?: File;
  // Campos específicos para factoring
  advance_percentage?: number;
  commission_rate?: number;
  expected_collection_date?: string;
  credit_risk_assessment?: 'low' | 'medium' | 'high';
  // Campos específicos para confirming
  supplier_name?: string;
  supplier_tax_id?: string;
  payment_terms?: string;
  early_payment_discount?: number;
  confirmation_deadline?: string;
  confirming_type?: 'confirmed' | 'reverse';
  confirming_commission?: number;
  guarantee_type?: 'bank_guarantee' | 'insurance' | 'collateral' | 'surety_bond' | 'none';
  payment_guarantee?: string;
  supplier_notification?: boolean;
  advance_request?: boolean;
}

@Component({
  selector: 'app-nueva-factura',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="nueva-factura-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <button class="back-button" (click)="goBack()">
            <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Volver
          </button>
          <div class="header-title">
            <h1>Nueva Factura</h1>
            <p>Ingresa los datos de tu factura para {{ selectedOperationType() === 'confirming' ? 'confirming' : 'factoring' }}</p>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="page-main">
        <div class="form-container">
          <!-- Operation Type Selection -->
          <div class="operation-type-section">
            <h2 class="section-title">Tipo de Operación</h2>
            <div class="operation-type-grid">
              <button 
                type="button"
                class="operation-type-card"
                [class.selected]="selectedOperationType() === 'factoring'"
                (click)="selectOperationType('factoring')">
                <div class="operation-icon factoring">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3>Factoring</h3>
                <p>Vende tu factura y recibe el dinero de inmediato</p>
              </button>
              
              <button 
                type="button"
                class="operation-type-card"
                [class.selected]="selectedOperationType() === 'confirming'"
                (click)="selectOperationType('confirming')">
                <div class="operation-icon confirming">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3>Confirming</h3>
                <p>Confirma el pago de tu factura con garantía</p>
              </button>
            </div>
          </div>

          <!-- Invoice Form -->
          <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()" class="invoice-form">
            <!-- Basic Information -->
            <div class="form-section">
              <h2 class="section-title">Información Básica</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label for="invoice_number">Número de Factura *</label>
                  <input 
                    type="text" 
                    id="invoice_number" 
                    formControlName="invoice_number"
                    placeholder="Ej: FAC-2024-001"
                    [class.error]="invoiceForm.get('invoice_number')?.invalid && invoiceForm.get('invoice_number')?.touched">
                  @if (invoiceForm.get('invoice_number')?.invalid && invoiceForm.get('invoice_number')?.touched) {
                    <span class="error-message">El número de factura es requerido</span>
                  }
                </div>

                <div class="form-group">
                  <label for="amount">Monto *</label>
                  <input 
                    type="number" 
                    id="amount" 
                    formControlName="amount"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    [class.error]="invoiceForm.get('amount')?.invalid && invoiceForm.get('amount')?.touched">
                  @if (invoiceForm.get('amount')?.invalid && invoiceForm.get('amount')?.touched) {
                    <span class="error-message">El monto es requerido y debe ser mayor a 0</span>
                  }
                </div>
              </div>
            </div>

            <!-- Client Information -->
            <div class="form-section">
              <h2 class="section-title">Información del Cliente</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label for="client_name">Nombre del Cliente *</label>
                  <input 
                    type="text" 
                    id="client_name" 
                    formControlName="client_name"
                    placeholder="Nombre de la empresa o persona"
                    [class.error]="invoiceForm.get('client_name')?.invalid && invoiceForm.get('client_name')?.touched">
                  @if (invoiceForm.get('client_name')?.invalid && invoiceForm.get('client_name')?.touched) {
                    <span class="error-message">El nombre del cliente es requerido</span>
                  }
                </div>

                <div class="form-group">
                  <label for="client_tax_id">RUC/DNI del Cliente *</label>
                  <input 
                    type="text" 
                    id="client_tax_id" 
                    formControlName="client_tax_id"
                    placeholder="20123456789"
                    [class.error]="invoiceForm.get('client_tax_id')?.invalid && invoiceForm.get('client_tax_id')?.touched">
                  @if (invoiceForm.get('client_tax_id')?.invalid && invoiceForm.get('client_tax_id')?.touched) {
                    <span class="error-message">El RUC/DNI del cliente es requerido</span>
                  }
                </div>
              </div>
            </div>

            <!-- Dates -->
            <div class="form-section">
              <h2 class="section-title">Fechas</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label for="issue_date">Fecha de Emisión *</label>
                  <input 
                    type="date" 
                    id="issue_date" 
                    formControlName="issue_date"
                    [class.error]="invoiceForm.get('issue_date')?.invalid && invoiceForm.get('issue_date')?.touched">
                  @if (invoiceForm.get('issue_date')?.invalid && invoiceForm.get('issue_date')?.touched) {
                    <span class="error-message">La fecha de emisión es requerida</span>
                  }
                </div>

                <div class="form-group">
                  <label for="due_date">Fecha de Vencimiento *</label>
                  <input 
                    type="date" 
                    id="due_date" 
                    formControlName="due_date"
                    [class.error]="invoiceForm.get('due_date')?.invalid && invoiceForm.get('due_date')?.touched">
                  @if (invoiceForm.get('due_date')?.invalid && invoiceForm.get('due_date')?.touched) {
                    <span class="error-message">La fecha de vencimiento es requerida y debe ser posterior a la fecha de emisión</span>
                  }
                </div>
              </div>
            </div>

            <!-- Campos específicos para Factoring -->
            @if (selectedOperationType() === 'factoring') {
              <div class="form-section factoring-section">
                <h2 class="section-title">Información de Factoring</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="advance_percentage">Porcentaje de Adelanto (%) *</label>
                    <input 
                      type="number" 
                      id="advance_percentage" 
                      formControlName="advance_percentage"
                      placeholder="70"
                      min="1"
                      max="90"
                      [class.error]="invoiceForm.get('advance_percentage')?.invalid && invoiceForm.get('advance_percentage')?.touched">
                    @if (invoiceForm.get('advance_percentage')?.invalid && invoiceForm.get('advance_percentage')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('advance_percentage') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="commission_rate">Tasa de Comisión (%) *</label>
                    <input 
                      type="number" 
                      id="commission_rate" 
                      formControlName="commission_rate"
                      placeholder="2.5"
                      step="0.1"
                      min="0.1"
                      max="10"
                      [class.error]="invoiceForm.get('commission_rate')?.invalid && invoiceForm.get('commission_rate')?.touched">
                    @if (invoiceForm.get('commission_rate')?.invalid && invoiceForm.get('commission_rate')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('commission_rate') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="expected_collection_date">Fecha Esperada de Cobro *</label>
                    <input 
                      type="date" 
                      id="expected_collection_date" 
                      formControlName="expected_collection_date"
                      [class.error]="invoiceForm.get('expected_collection_date')?.invalid && invoiceForm.get('expected_collection_date')?.touched">
                    @if (invoiceForm.get('expected_collection_date')?.invalid && invoiceForm.get('expected_collection_date')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('expected_collection_date') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="credit_risk_assessment">Evaluación de Riesgo Crediticio *</label>
                    <select 
                      id="credit_risk_assessment" 
                      formControlName="credit_risk_assessment"
                      [class.error]="invoiceForm.get('credit_risk_assessment')?.invalid && invoiceForm.get('credit_risk_assessment')?.touched">
                      <option value="">Seleccionar riesgo</option>
                      <option value="low">Bajo</option>
                      <option value="medium">Medio</option>
                      <option value="high">Alto</option>
                    </select>
                    @if (invoiceForm.get('credit_risk_assessment')?.invalid && invoiceForm.get('credit_risk_assessment')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('credit_risk_assessment') }}</span>
                  }
                  </div>
                </div>
              </div>
            }

            <!-- Campos específicos para Confirming -->
            @if (selectedOperationType() === 'confirming') {
              <div class="form-section confirming-section">
                <h2 class="section-title">Información de Confirming</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="supplier_name">Nombre del Proveedor *</label>
                    <input 
                      type="text" 
                      id="supplier_name" 
                      formControlName="supplier_name"
                      placeholder="Nombre de la empresa proveedora"
                      [class.error]="invoiceForm.get('supplier_name')?.invalid && invoiceForm.get('supplier_name')?.touched">
                    @if (invoiceForm.get('supplier_name')?.invalid && invoiceForm.get('supplier_name')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('supplier_name') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="supplier_tax_id">RUC del Proveedor *</label>
                    <input 
                      type="text" 
                      id="supplier_tax_id" 
                      formControlName="supplier_tax_id"
                      placeholder="20123456789"
                      [class.error]="invoiceForm.get('supplier_tax_id')?.invalid && invoiceForm.get('supplier_tax_id')?.touched">
                    @if (invoiceForm.get('supplier_tax_id')?.invalid && invoiceForm.get('supplier_tax_id')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('supplier_tax_id') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="payment_terms">Términos de Pago (días) *</label>
                    <input 
                      type="number" 
                      id="payment_terms" 
                      formControlName="payment_terms"
                      placeholder="30"
                      min="1"
                      max="365"
                      [class.error]="invoiceForm.get('payment_terms')?.invalid && invoiceForm.get('payment_terms')?.touched">
                    @if (invoiceForm.get('payment_terms')?.invalid && invoiceForm.get('payment_terms')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('payment_terms') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="early_payment_discount">Descuento por Pago Anticipado (%)</label>
                    <input 
                      type="number" 
                      id="early_payment_discount" 
                      formControlName="early_payment_discount"
                      placeholder="2.0"
                      step="0.1"
                      min="0"
                      max="20">
                  </div>

                  <div class="form-group">
                    <label for="confirmation_deadline">Fecha Límite de Confirmación *</label>
                    <input 
                      type="date" 
                      id="confirmation_deadline" 
                      formControlName="confirmation_deadline"
                      [class.error]="invoiceForm.get('confirmation_deadline')?.invalid && invoiceForm.get('confirmation_deadline')?.touched">
                    @if (invoiceForm.get('confirmation_deadline')?.invalid && invoiceForm.get('confirmation_deadline')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('confirmation_deadline') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="confirming_type">Tipo de Confirming *</label>
                    <select 
                      id="confirming_type" 
                      formControlName="confirming_type"
                      [class.error]="invoiceForm.get('confirming_type')?.invalid && invoiceForm.get('confirming_type')?.touched">
                      <option value="">Seleccionar tipo</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="reverse">Reverso</option>
                    </select>
                    @if (invoiceForm.get('confirming_type')?.invalid && invoiceForm.get('confirming_type')?.touched) {
                    <span class="error-message">{{ getFieldErrorMessage('confirming_type') }}</span>
                  }
                  </div>

                  <div class="form-group">
                    <label for="confirming_commission">Comisión de Confirming (%)</label>
                    <input 
                      type="number" 
                      id="confirming_commission" 
                      formControlName="confirming_commission"
                      placeholder="1.50"
                      step="0.01"
                      min="0.5"
                      max="10">
                  </div>

                  <div class="form-group">
                    <label for="guarantee_type">Tipo de Garantía</label>
                    <select 
                      id="guarantee_type" 
                      formControlName="guarantee_type">
                      <option value="">Seleccionar garantía</option>
                      <option value="none">Sin Garantía</option>
                      <option value="bank_guarantee">Garantía Bancaria</option>
                      <option value="insurance">Seguro</option>
                      <option value="collateral">Colateral</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="payment_guarantee">Garantía de Pago</label>
                    <select 
                      id="payment_guarantee" 
                      formControlName="payment_guarantee">
                      <option value="">Seleccionar garantía de pago</option>
                      <option value="none">Sin Garantía</option>
                      <option value="bank_guarantee">Garantía Bancaria</option>
                      <option value="insurance">Seguro</option>
                      <option value="collateral">Colateral</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>
                      <input 
                        type="checkbox" 
                        formControlName="supplier_notification">
                      Notificar al Proveedor
                    </label>
                  </div>

                  <div class="form-group">
                    <label>
                      <input 
                        type="checkbox" 
                        formControlName="advance_request">
                      Solicitar Adelanto
                    </label>
                  </div>
                </div>
              </div>
            }

            <!-- Description -->
            <div class="form-section">
              <h2 class="section-title">Descripción</h2>
              <div class="form-group full-width">
                <label for="description">Descripción de la Factura</label>
                <textarea 
                  id="description" 
                  formControlName="description"
                  rows="4"
                  placeholder="Describe los productos o servicios facturados..."></textarea>
              </div>
            </div>

            <!-- Document Upload -->
            <div class="form-section">
              <h2 class="section-title">Documento</h2>
              <div class="form-group full-width">
                <label for="document">Subir Factura (PDF, JPG, PNG)</label>
                <div class="file-upload-area" 
                     [class.dragover]="isDragOver()"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()">
                  @if (selectedFile()) {
                    <div class="file-selected">
                      <svg class="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span>{{ selectedFile()?.name }}</span>
                      <button type="button" class="remove-file" (click)="removeFile($event)">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  } @else {
                    <div class="file-upload-placeholder">
                      <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                      <p class="file-info">Máximo 10MB - PDF, JPG, PNG</p>
                    </div>
                  }
                  <input 
                    #fileInput
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event)"
                    style="display: none;">
                </div>
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="goBack()">
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn-primary"
                [disabled]="invoiceForm.invalid || isSubmitting()"
                [class.loading]="isSubmitting()">
                @if (isSubmitting()) {
                  <div class="spinner"></div>
                  Guardando...
                } @else {
                  Crear Factura
                }
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>

    <!-- Success Modal -->
    @if (showSuccessModal()) {
      <div class="modal-overlay" (click)="closeSuccessModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2>¡Factura Creada!</h2>
          <p>Tu factura ha sido registrada exitosamente y está siendo procesada.</p>
          <div class="modal-actions">
            <button class="btn-primary" (click)="goToDashboard()">Ir al Dashboard</button>
            <button class="btn-secondary" (click)="createAnother()">Crear Otra</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./nueva-factura.component.css']
})
export class NuevaFacturaComponent implements OnInit {
  invoiceForm: FormGroup;
  selectedOperationType = signal<'confirming' | 'factoring'>('confirming');
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  isSubmitting = signal(false);
  showSuccessModal = signal(false);
  currentUser = signal<any>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private invoiceService: InvoiceService,
    private validationService: InvoiceValidationService
  ) {
    this.invoiceForm = this.fb.group({
      invoice_number: ['', [Validators.required]],
      client_name: ['', [Validators.required]],
      client_tax_id: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      issue_date: ['', [Validators.required]],
      due_date: ['', [Validators.required]],
      description: [''],
      // Campos específicos para factoring
      advance_percentage: [''],
      commission_rate: [''],
      expected_collection_date: [''],
      credit_risk_assessment: [''],
      // Campos específicos para confirming
      supplier_name: [''],
      supplier_tax_id: [''],
      payment_terms: [''],
      early_payment_discount: [''],
      confirmation_deadline: [''],
      confirming_type: [''],
      confirming_commission: [''],
      guarantee_type: [''],
      payment_guarantee: [''],
      supplier_notification: [false],
      advance_request: [false]
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.setupDateValidation();
  }

  private loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser.set(user);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private setupDateValidation() {
    // Add custom validator for due_date to be after issue_date
    this.invoiceForm.get('due_date')?.setValidators([
      Validators.required,
      (control) => {
        const issueDate = this.invoiceForm.get('issue_date')?.value;
        const dueDate = control.value;
        if (issueDate && dueDate && new Date(dueDate) <= new Date(issueDate)) {
          return { dateInvalid: true };
        }
        return null;
      }
    ]);

    // Re-validate due_date when issue_date changes
    this.invoiceForm.get('issue_date')?.valueChanges.subscribe(() => {
      this.invoiceForm.get('due_date')?.updateValueAndValidity();
    });
  }

  selectOperationType(type: 'confirming' | 'factoring') {
    this.selectedOperationType.set(type);
    this.updateFormValidation(type);
  }

  private updateFormValidation(operationType: 'confirming' | 'factoring') {
    // Limpiar validaciones específicas
    this.clearSpecificValidations();

    if (operationType === 'factoring') {
      // Validaciones específicas para factoring usando el servicio de validación
      this.invoiceForm.get('advance_percentage')?.setValidators([
        Validators.required, 
        this.validationService.advancePercentageValidator()
      ]);
      this.invoiceForm.get('commission_rate')?.setValidators([
        Validators.required, 
        this.validationService.commissionRateValidator()
      ]);
      this.invoiceForm.get('expected_collection_date')?.setValidators([
        Validators.required,
        this.validationService.expectedCollectionDateValidator(this.invoiceForm.get('due_date')!)
      ]);
      this.invoiceForm.get('credit_risk_assessment')?.setValidators([
        Validators.required,
        this.validationService.creditRiskAssessmentValidator()
      ]);
    } else if (operationType === 'confirming') {
      // Validaciones específicas para confirming usando el servicio de validación
      this.invoiceForm.get('supplier_name')?.setValidators([Validators.required]);
      this.invoiceForm.get('supplier_tax_id')?.setValidators([
        Validators.required,
        this.validationService.supplierTaxIdValidator()
      ]);
      this.invoiceForm.get('payment_terms')?.setValidators([Validators.required, Validators.min(1), Validators.max(365)]);
      this.invoiceForm.get('confirmation_deadline')?.setValidators([
        Validators.required,
        this.validationService.confirmationDeadlineValidator(this.invoiceForm.get('issue_date')!)
      ]);
      this.invoiceForm.get('confirming_type')?.setValidators([Validators.required]);
    }

    // Actualizar validaciones
    this.updateAllValidations();
  }

  private clearSpecificValidations() {
    const specificFields = [
      'advance_percentage', 'commission_rate', 'expected_collection_date', 'credit_risk_assessment',
      'supplier_name', 'supplier_tax_id', 'payment_terms', 'early_payment_discount', 'confirmation_deadline',
      'confirming_type', 'confirming_commission', 'guarantee_type', 'payment_guarantee', 'supplier_notification', 'advance_request'
    ];
    
    specificFields.forEach(field => {
      this.invoiceForm.get(field)?.clearValidators();
      this.invoiceForm.get(field)?.setValue('');
    });
  }

  private updateAllValidations() {
    Object.keys(this.invoiceForm.controls).forEach(key => {
      this.invoiceForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Obtiene el mensaje de error personalizado para un campo específico
   */
  getFieldErrorMessage(fieldName: string): string {
    const control = this.invoiceForm.get(fieldName);
    if (control && control.errors && control.touched) {
      return this.validationService.getErrorMessage(fieldName, control.errors);
    }
    return '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  private validateAndSetFile(file: File) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo PDF, JPG, PNG.');
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
  }

  onSubmit() {
    if (this.invoiceForm.valid) {
      // Verificar autenticación antes de enviar
      const token = this.authService.getToken();
      const isAuthenticated = this.authService.isAuthenticated();
      const currentUser = this.authService.getCurrentUser();
      
      console.log('Estado de autenticación:', {
        token: token ? 'Presente' : 'Ausente',
        isAuthenticated,
        currentUser: currentUser ? currentUser.email : 'No user'
      });
      
      if (!isAuthenticated || !token) {
        alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
        this.router.navigate(['/login']);
        return;
      }
      
      this.isSubmitting.set(true);

      const formData = new FormData();
      const formValue = this.invoiceForm.value;

      // Add form fields (company_id is now automatically obtained from authenticated user in backend)
      formData.append('invoice_number', formValue.invoice_number);
      formData.append('client_name', formValue.client_name);
      formData.append('client_tax_id', formValue.client_tax_id);
      formData.append('amount', formValue.amount);
      formData.append('issue_date', formValue.issue_date);
      formData.append('due_date', formValue.due_date);
      formData.append('operation_type', this.selectedOperationType());
      
      if (formValue.description) {
        formData.append('description', formValue.description);
      }

      // Agregar campos específicos según el tipo de operación
      if (this.selectedOperationType() === 'factoring') {
        // Asegurar que todos los campos requeridos para factoring estén presentes
        formData.append('advance_percentage', formValue.advance_percentage);
        formData.append('commission_rate', formValue.commission_rate);
        formData.append('expected_collection_date', formValue.expected_collection_date);
        formData.append('credit_risk_assessment', formValue.credit_risk_assessment);
      } else if (this.selectedOperationType() === 'confirming') {
        // Asegurar que todos los campos requeridos para confirming estén presentes
        formData.append('supplier_name', formValue.supplier_name);
        formData.append('supplier_tax_id', formValue.supplier_tax_id);
        formData.append('payment_terms', formValue.payment_terms.toString());
        formData.append('confirmation_deadline', formValue.confirmation_deadline);
        formData.append('confirming_type', formValue.confirming_type);
        // Campos opcionales - solo incluir si tienen valor
        if (formValue.early_payment_discount) formData.append('early_payment_discount', formValue.early_payment_discount);
        if (formValue.confirming_commission) formData.append('confirming_commission', formValue.confirming_commission);
        if (formValue.guarantee_type) formData.append('guarantee_type', formValue.guarantee_type);
        if (formValue.payment_guarantee) formData.append('payment_guarantee', formValue.payment_guarantee);
        if (formValue.supplier_notification !== null) formData.append('supplier_notification', formValue.supplier_notification.toString());
        if (formValue.advance_request !== null) formData.append('advance_request', formValue.advance_request.toString());
      }

      if (this.selectedFile()) {
        formData.append('invoice_file', this.selectedFile()!);
      }

      const operationType = this.selectedOperationType();
      let createObservable;

      // Use specific endpoint based on operation type
      if (operationType === 'factoring') {
        createObservable = this.invoiceService.createFactoringInvoice(formData);
      } else if (operationType === 'confirming') {
        createObservable = this.invoiceService.createConfirmingInvoice(formData);
      } else {
        // Fallback to generic endpoint
        createObservable = this.invoiceService.createInvoice(formData);
      }

      createObservable.subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.showSuccessModal.set(true);
          console.log(`${operationType} invoice created successfully:`, response);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error(`Error creating ${operationType} invoice:`, error);
          alert(`Error al crear la factura de ${operationType}. Por favor, intenta nuevamente.`);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/empresa']);
  }

  closeSuccessModal() {
    this.showSuccessModal.set(false);
  }

  goToDashboard() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/dashboard/empresa']);
  }

  createAnother() {
    this.showSuccessModal.set(false);
    this.invoiceForm.reset();
    this.selectedFile.set(null);
    this.selectOperationType('factoring');
  }


}