import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface FactoringValidationRules {
  advance_percentage: { min: number; max: number };
  commission_rate: { min: number; max: number };
  expected_collection_date: { required: boolean };
  credit_risk_assessment: { required: boolean; options: string[] };
}

export interface ConfirmingValidationRules {
  supplier_name: { required: boolean; maxLength: number };
  supplier_tax_id: { required: boolean; pattern?: string };
  payment_terms: { required: boolean; maxLength: number };
  early_payment_discount: { min: number; max: number };
  confirmation_deadline: { required: boolean };
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceValidationService {

  private factoringRules: FactoringValidationRules = {
    advance_percentage: { min: 1, max: 90 },
    commission_rate: { min: 0.1, max: 10 },
    expected_collection_date: { required: true },
    credit_risk_assessment: { 
      required: true, 
      options: ['low', 'medium', 'high'] 
    }
  };

  private confirmingRules: ConfirmingValidationRules = {
    supplier_name: { required: true, maxLength: 255 },
    supplier_tax_id: { required: true, pattern: '^[0-9]{8,15}$' },
    payment_terms: { required: true, maxLength: 255 },
    early_payment_discount: { min: 0, max: 100 },
    confirmation_deadline: { required: true }
  };

  constructor() { }

  /**
   * Obtiene las reglas de validación para factoring
   */
  getFactoringRules(): FactoringValidationRules {
    return this.factoringRules;
  }

  /**
   * Obtiene las reglas de validación para confirming
   */
  getConfirmingRules(): ConfirmingValidationRules {
    return this.confirmingRules;
  }

  /**
   * Validador personalizado para porcentaje de adelanto en factoring
   */
  advancePercentageValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null; // Let required validator handle empty values
      }
      
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { invalidNumber: true };
      }
      
      if (numValue < this.factoringRules.advance_percentage.min) {
        return { minAdvancePercentage: { min: this.factoringRules.advance_percentage.min, actual: numValue } };
      }
      
      if (numValue > this.factoringRules.advance_percentage.max) {
        return { maxAdvancePercentage: { max: this.factoringRules.advance_percentage.max, actual: numValue } };
      }
      
      return null;
    };
  }

  /**
   * Validador personalizado para tasa de comisión en factoring
   */
  commissionRateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { invalidNumber: true };
      }
      
      if (numValue < this.factoringRules.commission_rate.min) {
        return { minCommissionRate: { min: this.factoringRules.commission_rate.min, actual: numValue } };
      }
      
      if (numValue > this.factoringRules.commission_rate.max) {
        return { maxCommissionRate: { max: this.factoringRules.commission_rate.max, actual: numValue } };
      }
      
      return null;
    };
  }

  /**
   * Validador personalizado para fecha de cobro esperada
   */
  expectedCollectionDateValidator(dueDateControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const expectedDate = control.value;
      const dueDate = dueDateControl.value;
      
      if (!expectedDate || !dueDate) {
        return null;
      }
      
      if (new Date(expectedDate) <= new Date(dueDate)) {
        return { expectedDateInvalid: { message: 'La fecha de cobro esperada debe ser posterior a la fecha de vencimiento' } };
      }
      
      return null;
    };
  }

  /**
   * Validador personalizado para evaluación de riesgo crediticio
   */
  creditRiskAssessmentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      
      if (!this.factoringRules.credit_risk_assessment.options.includes(value)) {
        return { invalidCreditRisk: { validOptions: this.factoringRules.credit_risk_assessment.options } };
      }
      
      return null;
    };
  }

  /**
   * Validador personalizado para ID fiscal del proveedor
   */
  supplierTaxIdValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      
      const pattern = this.confirmingRules.supplier_tax_id.pattern;
      if (pattern && !new RegExp(pattern).test(value)) {
        return { invalidTaxId: { pattern: pattern } };
      }
      
      return null;
    };
  }

  /**
   * Validador personalizado para descuento por pago anticipado
   */
  earlyPaymentDiscountValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { invalidNumber: true };
      }
      
      if (numValue < this.confirmingRules.early_payment_discount.min) {
        return { minDiscount: { min: this.confirmingRules.early_payment_discount.min, actual: numValue } };
      }
      
      if (numValue > this.confirmingRules.early_payment_discount.max) {
        return { maxDiscount: { max: this.confirmingRules.early_payment_discount.max, actual: numValue } };
      }
      
      return null;
    };
  }

  /**
   * Validador personalizado para fecha límite de confirmación
   */
  confirmationDeadlineValidator(issueDateControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const confirmationDate = control.value;
      const issueDate = issueDateControl.value;
      
      if (!confirmationDate || !issueDate) {
        return null;
      }
      
      if (new Date(confirmationDate) <= new Date(issueDate)) {
        return { confirmationDateInvalid: { message: 'La fecha límite de confirmación debe ser posterior a la fecha de emisión' } };
      }
      
      return null;
    };
  }

  /**
   * Obtiene el mensaje de error personalizado para un campo específico
   */
  getErrorMessage(fieldName: string, errors: ValidationErrors): string {
    if (errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} es requerido`;
    }
    
    if (errors['minAdvancePercentage']) {
      return `El porcentaje de adelanto debe ser al menos ${errors['minAdvancePercentage'].min}%`;
    }
    
    if (errors['maxAdvancePercentage']) {
      return `El porcentaje de adelanto no puede exceder ${errors['maxAdvancePercentage'].max}%`;
    }
    
    if (errors['minCommissionRate']) {
      return `La tasa de comisión debe ser al menos ${errors['minCommissionRate'].min}%`;
    }
    
    if (errors['maxCommissionRate']) {
      return `La tasa de comisión no puede exceder ${errors['maxCommissionRate'].max}%`;
    }
    
    if (errors['expectedDateInvalid']) {
      return errors['expectedDateInvalid'].message;
    }
    
    if (errors['invalidCreditRisk']) {
      return `Seleccione una opción válida: ${errors['invalidCreditRisk'].validOptions.join(', ')}`;
    }
    
    if (errors['invalidTaxId']) {
      return 'El ID fiscal del proveedor debe tener entre 8 y 15 dígitos';
    }
    
    if (errors['minDiscount']) {
      return `El descuento debe ser al menos ${errors['minDiscount'].min}%`;
    }
    
    if (errors['maxDiscount']) {
      return `El descuento no puede exceder ${errors['maxDiscount'].max}%`;
    }
    
    if (errors['confirmationDateInvalid']) {
      return errors['confirmationDateInvalid'].message;
    }
    
    if (errors['invalidNumber']) {
      return 'Ingrese un número válido';
    }
    
    return 'Campo inválido';
  }

  /**
   * Obtiene el nombre de visualización para un campo
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'advance_percentage': 'Porcentaje de adelanto',
      'commission_rate': 'Tasa de comisión',
      'expected_collection_date': 'Fecha de cobro esperada',
      'credit_risk_assessment': 'Evaluación de riesgo crediticio',
      'supplier_name': 'Nombre del proveedor',
      'supplier_tax_id': 'ID fiscal del proveedor',
      'payment_terms': 'Términos de pago',
      'early_payment_discount': 'Descuento por pago anticipado',
      'confirmation_deadline': 'Fecha límite de confirmación'
    };
    
    return displayNames[fieldName] || fieldName;
  }
}