import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InvestmentProposalService, CreateProposalRequest } from './services/investment-proposal.service';
import { InvoiceService, Invoice } from './services/invoice.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-crear-propuesta-inversion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="crear-propuesta-container">
      <div class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-left"></i>
          Volver
        </button>
        <h1>Crear Propuesta de Inversión</h1>
      </div>

      <div class="content" *ngIf="!isLoading()">
        <!-- Información de la Factura -->
        <div class="invoice-info-card" *ngIf="invoice()">
          <h2>Información de la Factura</h2>
          <div class="invoice-details">
            <div class="detail-row">
              <span class="label">Empresa:</span>
              <span class="value">{{ invoice()?.company?.business_name || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Número de Factura:</span>
              <span class="value">{{ invoice()?.invoice_number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Monto Original:</span>
              <span class="value">{{ formatCurrency(invoice()?.amount || 0) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Fecha de Vencimiento:</span>
              <span class="value">{{ formatDate(invoice()?.due_date) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tipo de Operación:</span>
              <span class="value operation-type" [class]="invoice()?.operation_type">
                {{ invoice()?.operation_type === 'factoring' ? 'Factoring' : 'Confirming' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Días hasta Vencimiento:</span>
              <span class="value">{{ calculateDaysToMaturity(invoice()?.due_date) }} días</span>
            </div>
            <div class="detail-row">
              <span class="label">Nivel de Riesgo:</span>
              <span class="value risk-level" [class]="getRiskClass(invoice()?.risk_score)">
                {{ getRiskLevel(invoice()?.risk_score) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Formulario de Propuesta -->
        <div class="proposal-form-card">
          <h2>Términos de tu Propuesta</h2>
          <form [formGroup]="proposalForm" (ngSubmit)="onSubmit()">
            
            <!-- Los campos específicos de factoring y confirming se muestran según el tipo de operación -->

            <!-- Campos Específicos de Factoring -->
            <div class="factoring-fields" *ngIf="invoice()?.operation_type === 'factoring'">
              <h3>Términos de Factoring</h3>
              
              <!-- Porcentaje de Adelanto y Comisión de Factoring -->
              <div class="form-row">
                <div class="form-group">
                  <label for="advancePercentage">Porcentaje de Adelanto *</label>
                  <div class="input-with-percent">
                    <input 
                      type="number" 
                      id="advancePercentage"
                      formControlName="advancePercentage"
                      class="form-control"
                      [class.error]="getFieldError('advancePercentage')"
                      placeholder="80.00"
                      min="70"
                      max="90"
                      step="0.01"
                    >
                    <span class="percent-symbol">%</span>
                  </div>
                  <small class="help-text">Rango típico: 70% - 90%</small>
                  <div class="error-message" *ngIf="getFieldError('advancePercentage')">
                    {{ getFieldError('advancePercentage') }}
                  </div>
                </div>
                <div class="form-group">
                  <label for="factoringCommission">Comisión de Factoring *</label>
                  <div class="input-with-percent">
                    <input 
                      type="number" 
                      id="factoringCommission"
                      formControlName="factoringCommission"
                      class="form-control"
                      [class.error]="getFieldError('factoringCommission')"
                      placeholder="2.50"
                      min="0.5"
                      max="10"
                      step="0.01"
                    >
                    <span class="percent-symbol">%</span>
                  </div>
                  <small class="help-text">Rango típico: 0.5% - 10%</small>
                  <div class="error-message" *ngIf="getFieldError('factoringCommission')">
                    {{ getFieldError('factoringCommission') }}
                  </div>
                </div>
              </div>

              <!-- Evaluación de Riesgo y Tipo de Factoring -->
              <div class="form-row">
                <div class="form-group">
                  <label for="riskAssessment">Evaluación de Riesgo</label>
                  <select 
                    id="riskAssessment"
                    formControlName="riskAssessment"
                    class="form-control"
                  >
                    <option value="">Seleccionar evaluación</option>
                    <option value="low">Bajo Riesgo</option>
                    <option value="medium">Riesgo Medio</option>
                    <option value="high">Alto Riesgo</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="factoringType">Tipo de Factoring</label>
                  <select 
                    id="factoringType"
                    formControlName="factoringType"
                    class="form-control"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="with_recourse">Con Recurso</option>
                    <option value="without_recourse">Sin Recurso</option>
                    <option value="international">Internacional</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Campos Específicos de Confirming -->
            <div class="confirming-fields" *ngIf="invoice()?.operation_type === 'confirming'">
              <h3>Términos de Confirming</h3>
              
              <!-- Términos de Pago y Tipo de Confirming -->
              <div class="form-row">
                <div class="form-group">
                  <label for="paymentTerms">Términos de Pago *</label>
                  <input 
                    type="text" 
                    id="paymentTerms"
                    formControlName="paymentTerms"
                    class="form-control"
                    [class.error]="getFieldError('paymentTerms')"
                    placeholder="Ej: 30 días netos"
                    maxlength="255"
                  >
                  <small class="help-text">Especifica las condiciones de pago</small>
                  <div class="error-message" *ngIf="getFieldError('paymentTerms')">
                    {{ getFieldError('paymentTerms') }}
                  </div>
                </div>
                <div class="form-group">
                  <label for="confirmingType">Tipo de Confirming *</label>
                  <select 
                    id="confirmingType"
                    formControlName="confirmingType"
                    class="form-control"
                    [class.error]="getFieldError('confirmingType')"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="with_recourse">Con Recurso</option>
                    <option value="without_recourse">Sin Recurso</option>
                    <option value="international">Internacional</option>
                  </select>
                  <div class="error-message" *ngIf="getFieldError('confirmingType')">
                    {{ getFieldError('confirmingType') }}
                  </div>
                </div>
              </div>

              <!-- Comisión de Confirming y Tipo de Garantía -->
              <div class="form-row">
                <div class="form-group">
                  <label for="confirmingCommission">Comisión de Confirming *</label>
                  <div class="input-with-percent">
                    <input 
                      type="number" 
                      id="confirmingCommission"
                      formControlName="confirmingCommission"
                      class="form-control"
                      [class.error]="getFieldError('confirmingCommission')"
                      placeholder="1.50"
                      min="0.5"
                      max="10"
                      step="0.01"
                    >
                    <span class="percent-symbol">%</span>
                  </div>
                  <small class="help-text">Rango típico: 0.5% - 10%</small>
                  <div class="error-message" *ngIf="getFieldError('confirmingCommission')">
                    {{ getFieldError('confirmingCommission') }}
                  </div>
                </div>
                <div class="form-group">
                  <label for="guaranteeType">Tipo de Garantía</label>
                  <select 
                    id="guaranteeType"
                    formControlName="guaranteeType"
                    class="form-control"
                  >
                    <option value="">Seleccionar garantía</option>
                    <option value="bank_guarantee">Garantía Bancaria</option>
                    <option value="insurance">Seguro</option>
                    <option value="collateral">Colateral</option>
                    <option value="surety_bond">Aval</option>
                    <option value="none">Sin Garantía</option>
                  </select>
                </div>
              </div>

              <!-- Opciones Adicionales de Confirming -->
              <div class="form-row">
                <div class="form-group">
                  <label for="paymentGuarantee">Garantía de Pago</label>
                  <input 
                    type="text" 
                    id="paymentGuarantee"
                    formControlName="paymentGuarantee"
                    class="form-control"
                    placeholder="Descripción de la garantía"
                    maxlength="255"
                  >
                </div>
                <div class="form-group">
                  <label for="earlyPaymentDiscount">Descuento por Pago Anticipado</label>
                  <div class="input-with-percent">
                    <input 
                      type="number" 
                      id="earlyPaymentDiscount"
                      formControlName="earlyPaymentDiscount"
                      class="form-control"
                      placeholder="2.00"
                      min="0"
                      max="10"
                      step="0.01"
                    >
                    <span class="percent-symbol">%</span>
                  </div>
                  <small class="help-text">Descuento opcional por pago anticipado</small>
                </div>
              </div>

              <!-- Checkboxes para Confirming -->
              <div class="form-row">
                <div class="form-group">
                  <div class="checkbox-group">
                    <input 
                      type="checkbox" 
                      id="supplierNotification"
                      formControlName="supplierNotification"
                      class="form-checkbox"
                    >
                    <label for="supplierNotification" class="checkbox-label">
                      Notificar al Proveedor
                    </label>
                  </div>
                  <small class="help-text">Notificar automáticamente al proveedor sobre la confirmación</small>
                </div>
                <div class="form-group">
                  <div class="checkbox-group">
                    <input 
                      type="checkbox" 
                      id="advanceRequest"
                      formControlName="advanceRequest"
                      class="form-checkbox"
                    >
                    <label for="advanceRequest" class="checkbox-label">
                      Solicitar Adelanto
                    </label>
                  </div>
                  <small class="help-text">Permitir solicitud de adelanto sobre la factura confirmada</small>
                </div>
              </div>
            </div>

            <!-- Solo campos específicos de factoring y confirming -->

            <!-- Resumen específico según tipo de operación se puede agregar aquí -->

            <!-- Botones -->
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="goBack()">
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="proposalForm.invalid || isSubmitting()"
              >
                <span *ngIf="isSubmitting()" class="spinner"></span>
                {{ isSubmitting() ? 'Enviando...' : 'Enviar Propuesta' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading()">
        <div class="spinner-large"></div>
        <p>Cargando información de la factura...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error()">
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error</h3>
          <p>{{ error() }}</p>
          <button class="btn btn-primary" (click)="goBack()">Volver</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./crear-propuesta-inversion.component.css']
})
export class CrearPropuestaInversionComponent implements OnInit {
  proposalForm: FormGroup;
  invoice = signal<Invoice | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  error = signal('');
  invoiceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private proposalService: InvestmentProposalService,
    private invoiceService: InvoiceService,
    private authService: AuthService
  ) {
    this.proposalForm = this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.invoiceId = +params['invoiceId'];
      if (this.invoiceId) {
        this.loadInvoice();
      } else {
        this.error.set('ID de factura no válido');
        this.isLoading.set(false);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Campos específicos de factoring
      advancePercentage: [''],
      factoringCommission: [''],
      riskAssessment: [''],
      factoringType: [''],
      // Campos específicos de confirming
      paymentTerms: [''],
      guaranteeType: [''],
      confirmingType: [''],
      supplierNotification: [false],
      advanceRequest: [false],
      confirmingCommission: [''],
      paymentGuarantee: [''],
      earlyPaymentDiscount: ['']
    });
  }

  private loadInvoice() {
    if (!this.invoiceId) return;

    this.invoiceService.getPublicInvoice(this.invoiceId).subscribe({
      next: (response) => {
        this.invoice.set(response);
        this.setupFormValidators();
        this.updateFormValidators(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.error.set('Error al cargar la información de la factura');
        this.isLoading.set(false);
      }
    });
  }

  private updateFormValidators(invoice: Invoice) {
    // Si es una operación de factoring, hacer campos requeridos
    if (invoice.operation_type === 'factoring') {
      this.proposalForm.get('advancePercentage')?.setValidators([
        Validators.required,
        Validators.min(70),
        Validators.max(90)
      ]);
      this.proposalForm.get('factoringCommission')?.setValidators([
        Validators.required,
        Validators.min(0.5),
        Validators.max(10)
      ]);
      // Limpiar validaciones de confirming
      this.proposalForm.get('paymentTerms')?.clearValidators();
      this.proposalForm.get('confirmingType')?.clearValidators();
      this.proposalForm.get('confirmingCommission')?.clearValidators();
    } else if (invoice.operation_type === 'confirming') {
      // Para confirming, hacer campos específicos requeridos
      this.proposalForm.get('paymentTerms')?.setValidators([
        Validators.required,
        Validators.maxLength(255)
      ]);
      this.proposalForm.get('confirmingType')?.setValidators([Validators.required]);
      this.proposalForm.get('confirmingCommission')?.setValidators([
        Validators.required,
        Validators.min(0.5),
        Validators.max(10)
      ]);
      // Limpiar validaciones de factoring
      this.proposalForm.get('advancePercentage')?.clearValidators();
      this.proposalForm.get('factoringCommission')?.clearValidators();
    } else {
      // Para otros tipos, remover todas las validaciones específicas
      this.proposalForm.get('advancePercentage')?.clearValidators();
      this.proposalForm.get('factoringCommission')?.clearValidators();
      this.proposalForm.get('paymentTerms')?.clearValidators();
      this.proposalForm.get('confirmingType')?.clearValidators();
      this.proposalForm.get('confirmingCommission')?.clearValidators();
    }
    
    // Actualizar validaciones
    this.proposalForm.get('advancePercentage')?.updateValueAndValidity();
    this.proposalForm.get('factoringCommission')?.updateValueAndValidity();
    this.proposalForm.get('paymentTerms')?.updateValueAndValidity();
    this.proposalForm.get('confirmingType')?.updateValueAndValidity();
    this.proposalForm.get('confirmingCommission')?.updateValueAndValidity();
  }

  private setupFormValidators() {
    const invoice = this.invoice();
    if (!invoice) return;

    // Configurar validadores específicos según el tipo de operación

    // Validadores específicos para factoring
    if (this.isFactoringOperation()) {
      const advancePercentageControl = this.proposalForm.get('advancePercentage');
      if (advancePercentageControl) {
        advancePercentageControl.setValidators([
          Validators.required,
          Validators.min(70),
          Validators.max(90)
        ]);
        advancePercentageControl.updateValueAndValidity();
      }

      const factoringCommissionControl = this.proposalForm.get('factoringCommission');
      if (factoringCommissionControl) {
        factoringCommissionControl.setValidators([
          Validators.required,
          Validators.min(0.5),
          Validators.max(10)
        ]);
        factoringCommissionControl.updateValueAndValidity();
      }
    }
  }

  onSubmit() {
    if (this.proposalForm.invalid || !this.invoiceId) return;

    this.isSubmitting.set(true);
    
    const proposalData: CreateProposalRequest = {
      invoice_id: this.invoiceId
    };

    const invoice = this.invoice();
    if (!invoice) return;

    // Agregar campos específicos según el tipo de operación
    if (invoice.operation_type === 'factoring') {
      // Solo campos de factoring
      const advancePercentage = this.proposalForm.get('advancePercentage')?.value;
      const factoringCommission = this.proposalForm.get('factoringCommission')?.value;
      const riskAssessment = this.proposalForm.get('riskAssessment')?.value;
      const factoringType = this.proposalForm.get('factoringType')?.value;

      if (advancePercentage) proposalData.advance_percentage = advancePercentage;
      if (factoringCommission) proposalData.factoring_commission = factoringCommission;
      if (riskAssessment) proposalData.risk_assessment = riskAssessment;
      if (factoringType) proposalData.factoring_type = factoringType;
    } else if (invoice.operation_type === 'confirming') {
      // Solo campos de confirming
      const paymentTerms = this.proposalForm.get('paymentTerms')?.value;
      const guaranteeType = this.proposalForm.get('guaranteeType')?.value;
      const confirmingType = this.proposalForm.get('confirmingType')?.value;
      const supplierNotification = this.proposalForm.get('supplierNotification')?.value;
      const advanceRequest = this.proposalForm.get('advanceRequest')?.value;
      const confirmingCommission = this.proposalForm.get('confirmingCommission')?.value;
      const paymentGuarantee = this.proposalForm.get('paymentGuarantee')?.value;
      const earlyPaymentDiscount = this.proposalForm.get('earlyPaymentDiscount')?.value;

      // Campos requeridos - siempre incluir
      proposalData.payment_terms = paymentTerms || '';
      proposalData.confirming_type = confirmingType || '';
      proposalData.confirming_commission = confirmingCommission || 0;
      
      // Campos opcionales - solo incluir si tienen valor
      if (guaranteeType) proposalData.guarantee_type = guaranteeType;
      if (supplierNotification !== null) proposalData.supplier_notification = supplierNotification;
      if (advanceRequest !== null) proposalData.advance_request = advanceRequest;
      if (paymentGuarantee) proposalData.payment_guarantee = paymentGuarantee;
      if (earlyPaymentDiscount) proposalData.early_payment_discount = earlyPaymentDiscount;
    }

    // Debug: Ver qué datos se están enviando
    console.log('Datos que se envían al backend:', proposalData);
    console.log('Valores del formulario:', this.proposalForm.value);
    console.log('Estado del formulario válido:', this.proposalForm.valid);

    this.proposalService.createProposal(proposalData).subscribe({
      next: (response) => {
        console.log('Proposal created:', response);
        this.router.navigate(['/mis-propuestas'], {
          queryParams: { success: 'Propuesta enviada exitosamente' }
        });
      },
      error: (error) => {
        console.error('Error creating proposal:', error);
        // Mostrar errores de validación específicos si están disponibles
        if (error.error?.errors) {
          const errorMessages = Object.values(error.error.errors).flat().join(', ');
          this.error.set(`Errores de validación: ${errorMessages}`);
        } else {
          this.error.set(error.error?.message || 'Error al enviar la propuesta');
        }
        this.isSubmitting.set(false);
      }
    });
  }

  // Métodos de cambio eliminados ya que no hay campos generales

  isFactoringOperation(): boolean {
    const invoice = this.invoice();
    return invoice?.operation_type === 'factoring';
  }

  // Métodos de cálculo eliminados ya que no hay campos generales de inversión

  calculateDaysToMaturity(dueDate: string | undefined): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getRiskLevel(riskScore: number | undefined): string {
    if (!riskScore) return 'No evaluado';
    if (riskScore <= 30) return 'Bajo';
    if (riskScore <= 70) return 'Medio';
    return 'Alto';
  }

  getRiskClass(riskScore: number | undefined): string {
    if (!riskScore) return 'risk-unknown';
    if (riskScore <= 30) return 'risk-low';
    if (riskScore <= 70) return 'risk-medium';
    return 'risk-high';
  }

  getFieldError(fieldName: string): string | null {
    const field = this.proposalForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) return 'Este campo es requerido';
      if (field.errors?.['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors?.['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return null;
  }

  // Método getCharCount eliminado ya que no hay campos de texto opcionales

  formatCurrency(amount: number): string {
    return this.proposalService.formatCurrency(amount);
  }

  formatPercentage(rate: number): string {
    return this.proposalService.formatPercentage(rate);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO');
  }

  goBack() {
    this.router.navigate(['/oportunidades-inversion']);
  }
}