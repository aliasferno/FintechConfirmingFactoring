import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Invoice } from '../../models/invoice.model';

@Component({
  selector: 'app-modal-condiciones-inversion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './modal-condiciones-inversion.component.html',
  styleUrls: ['./modal-condiciones-inversion.component.css']
})
export class ModalCondicionesInversionComponent implements OnInit {
  @Input() invoice!: Invoice;
  @Input() isVisible: boolean = false;
  @Output() acceptConditions = new EventEmitter<void>();
  @Output() modifyConditions = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  condicionesForm!: FormGroup;
  showModificationForm = false;
  companyConditionsAccepted = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
    // Debug: Verificar qué datos llegan al modal
    console.log('Modal - Datos de la factura recibidos:', this.invoice);
    console.log('Modal - Tipo de operación:', this.invoice?.operation_type);
    console.log('Modal - Condiciones específicas:', {
      advance_percentage: this.invoice?.advance_percentage,
      commission_rate: this.invoice?.commission_rate,
      payment_terms: this.invoice?.payment_terms,
      early_payment_discount: this.invoice?.early_payment_discount,
      confirming_type: this.invoice?.confirming_type,
      guarantee_type: this.invoice?.guarantee_type
    });
  }

  initializeForm() {
    if (this.invoice?.operation_type === 'factoring') {
      this.condicionesForm = this.fb.group({
        advance_percentage: [this.invoice.advance_percentage, [Validators.required, Validators.min(1), Validators.max(100)]],
        commission_rate: [this.invoice.commission_rate, [Validators.required, Validators.min(0.1), Validators.max(50)]],
        expected_collection_date: [this.invoice.expected_collection_date, Validators.required],
        credit_risk_assessment: [this.invoice.credit_risk_assessment || 'medium'],
        factoring_type: [this.invoice.factoring_type || 'with_recourse']
      });
    } else if (this.invoice?.operation_type === 'confirming') {
      this.condicionesForm = this.fb.group({
        payment_terms: [this.invoice.payment_terms, [Validators.required, Validators.min(1), Validators.max(365)]],
        early_payment_discount: [this.invoice.early_payment_discount, [Validators.min(0), Validators.max(20)]],
        confirmation_deadline: [this.invoice.confirmation_deadline, Validators.required],
        confirming_type: [this.invoice.confirming_type || 'simple'],
        commission_rate: [this.invoice.commission_rate, [Validators.required, Validators.min(0.1), Validators.max(10)]],
        guarantee_type: [this.invoice.guarantee_type || 'bank_guarantee']
      });
    }
  }

  acceptCompanyConditions() {
    console.log('Aceptando condiciones originales de la empresa');
    this.acceptConditions.emit();
  }

  showModificationOptions() {
    this.showModificationForm = true;
  }

  submitModifications() {
    if (this.condicionesForm.valid) {
      const modifications = this.condicionesForm.value;
      console.log('Enviando modificaciones:', modifications);
      this.modifyConditions.emit(modifications);
    }
  }

  closeModal() {
    this.showModificationForm = false;
    this.companyConditionsAccepted = false;
    console.log('Cerrando modal');
    this.cancel.emit();
  }

  onBackdropClick() {
    this.cancel.emit();
  }

  // Métodos para obtener etiquetas legibles
  getConfirmingTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'simple': return 'Simple';
      case 'irrevocable': return 'Irrevocable';
      case 'confirmed': return 'Confirmado';
      case 'reverse': return 'Reverso';
      default: return 'No especificado';
    }
  }

  getGuaranteeTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'bank_guarantee': return 'Garantía Bancaria';
      case 'corporate_guarantee': return 'Aval Corporativo';
      case 'insurance': return 'Seguro';
      default: return 'No especificado';
    }
  }

  getRiskLevelLabel(level: string | undefined): string {
    switch (level) {
      case 'low': return 'Bajo';
      case 'medium': return 'Medio';
      case 'high': return 'Alto';
      default: return 'No evaluado';
    }
  }

  getFactoringTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'with_recourse': return 'Con Recurso';
      case 'without_recourse': return 'Sin Recurso';
      default: return 'No especificado';
    }
  }

  // Getters para facilitar el acceso a los controles del formulario
  get advance_percentage() { return this.condicionesForm.get('advance_percentage'); }
  get commission_rate() { return this.condicionesForm.get('commission_rate'); }
  get expected_collection_date() { return this.condicionesForm.get('expected_collection_date'); }
  get payment_terms() { return this.condicionesForm.get('payment_terms'); }
  get early_payment_discount() { return this.condicionesForm.get('early_payment_discount'); }
  get confirmation_deadline() { return this.condicionesForm.get('confirmation_deadline'); }

  // Métodos de utilidad
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO');
  }

  calculatePotentialReturn(): number {
    if (!this.invoice) return 0;
    
    console.log('🔍 Calculando retorno potencial para:', this.invoice);
    console.log('🔍 Tipo de operación:', this.invoice.operation_type);
    console.log('🔍 Monto de la factura:', this.invoice.amount);
    console.log('🔍 Commission rate:', this.invoice.commission_rate);
    console.log('🔍 Confirming commission:', this.invoice.confirming_commission);
    console.log('🔍 Advance request:', this.invoice.advance_request);
    console.log('🔍 Early payment discount:', this.invoice.early_payment_discount);
    
    if (this.invoice.operation_type === 'factoring') {
      const advanceAmount = this.invoice.amount * ((this.invoice.advance_percentage || 0) / 100);
      const commission = advanceAmount * ((this.invoice.commission_rate || 0) / 100);
      console.log('🔍 Factoring - Advance amount:', advanceAmount, 'Commission:', commission);
      return commission;
    } else if (this.invoice.operation_type === 'confirming') {
      // Para confirming, usar confirming_commission si está disponible, sino commission_rate
      const commissionRate = this.invoice.confirming_commission || this.invoice.commission_rate || 0;
      let totalReturn = this.invoice.amount * (commissionRate / 100);
      
      // Si advance_request es true, agregar el descuento por pago anticipado
      if (this.invoice.advance_request === true && this.invoice.early_payment_discount) {
        const earlyPaymentBonus = this.invoice.amount * (this.invoice.early_payment_discount / 100);
        totalReturn += earlyPaymentBonus;
        console.log('🔍 Confirming - Descuento por pago anticipado agregado:', earlyPaymentBonus);
      }
      
      console.log('🔍 Confirming - Commission rate usado:', commissionRate);
      console.log('🔍 Confirming - Retorno base:', this.invoice.amount * (commissionRate / 100));
      console.log('🔍 Confirming - Retorno total:', totalReturn);
      return totalReturn;
    }
    
    return 0;
  }
}