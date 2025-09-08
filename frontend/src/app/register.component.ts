import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, RegisterRequest } from './services/auth.service';
import { CompanyService, CompanyRequest } from './services/company.service';
import { InvestorService, InvestorRequest } from './services/investor.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  selectedProfile = signal<'empresa' | 'inversor' | null>(null);
  registrationForm: FormGroup;
  currentStep = signal(1);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService,
    private investorService: InvestorService
  ) {
    this.registrationForm = this.createForm();
  }

  ngOnInit() {
    // Check for profile parameter from landing page
    this.route.queryParams.subscribe(params => {
      if (params['profile']) {
        this.selectProfile(params['profile']);
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Datos básicos
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      
      // Datos personales/empresa
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      
      // Datos específicos de empresa
      companyName: [''],
      taxId: [''],
      companyAddress: [''],
      companyPhone: [''],
      businessType: [''],
      monthlyRevenue: [0],
      yearsInBusiness: [0],
      
      // Datos específicos de inversor
      investmentCapacity: [''],
      riskProfile: [''],
      investmentExperience: [''],
      
      // Términos y condiciones
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptPrivacy: [false, [Validators.requiredTrue]]
    });
  }

  selectProfile(profile: 'empresa' | 'inversor') {
    this.selectedProfile.set(profile);
    this.updateValidators();
  }

  updateValidators() {
    const profile = this.selectedProfile();
    
    if (profile === 'empresa') {
      // Hacer obligatorios los campos de empresa
      this.registrationForm.get('companyName')?.setValidators([Validators.required]);
      this.registrationForm.get('taxId')?.setValidators([Validators.required]);
      this.registrationForm.get('companyAddress')?.setValidators([Validators.required]);
      this.registrationForm.get('businessType')?.setValidators([Validators.required]);
      
      // Remover validadores de inversor
      this.registrationForm.get('investmentCapacity')?.clearValidators();
      this.registrationForm.get('riskProfile')?.clearValidators();
      this.registrationForm.get('investmentExperience')?.clearValidators();
    } else if (profile === 'inversor') {
      // Hacer obligatorios los campos de inversor
      this.registrationForm.get('investmentCapacity')?.setValidators([Validators.required]);
      this.registrationForm.get('riskProfile')?.setValidators([Validators.required]);
      this.registrationForm.get('investmentExperience')?.setValidators([Validators.required]);
      
      // Remover validadores de empresa
      this.registrationForm.get('companyName')?.clearValidators();
      this.registrationForm.get('taxId')?.clearValidators();
      this.registrationForm.get('companyAddress')?.clearValidators();
      this.registrationForm.get('businessType')?.clearValidators();
    }
    
    this.registrationForm.updateValueAndValidity();
  }

  nextStep() {
    if (this.currentStep() < 3) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  onSubmit() {
    console.log('=== INICIO DE ENVÍO DE FORMULARIO ===');
    console.log('Formulario válido:', this.registrationForm.valid);
    console.log('Contraseñas coinciden:', this.passwordsMatch());
    console.log('Perfil seleccionado:', this.selectedProfile());
    console.log('Errores del formulario:', this.registrationForm.errors);
    
    // Mostrar errores de cada campo
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      if (control && control.errors) {
        console.log(`Campo ${key} tiene errores:`, control.errors);
      }
    });
    
    if (this.registrationForm.valid && this.passwordsMatch()) {
      console.log('✅ Formulario válido, procediendo con el registro...');
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      
      const profile = this.selectedProfile();
      
      // Preparar datos de registro de usuario
      const userRegistrationData: RegisterRequest = {
        email: this.registrationForm.get('email')?.value,
        password: this.registrationForm.get('password')?.value,
        password_confirmation: this.registrationForm.get('confirmPassword')?.value,
        first_name: this.registrationForm.get('firstName')?.value,
        last_name: this.registrationForm.get('lastName')?.value,
        phone: this.registrationForm.get('phone')?.value,
        user_type: profile!
      };
      
      // Registrar usuario
      console.log('Enviando datos de registro:', userRegistrationData);
      this.authService.register(userRegistrationData).subscribe({
        next: (authResponse) => {
          console.log('Usuario registrado exitosamente:', authResponse);
          
          // Si es empresa, registrar también los datos de la empresa
          if (profile === 'empresa' && authResponse.user) {
            this.registerCompany(authResponse.user.id);
          } else if (profile === 'inversor' && authResponse.user) {
            this.registerInvestor(authResponse.user.id);
          } else {
            this.handleRegistrationSuccess();
          }
        },
        error: (error) => {
          console.error('Error en el registro:', error);
          this.handleRegistrationError(error);
        }
      });
    } else {
      console.log('❌ Formulario inválido o contraseñas no coinciden');
      this.markFormGroupTouched();
      if (!this.passwordsMatch()) {
        console.log('Error: Las contraseñas no coinciden');
        this.errorMessage.set('Las contraseñas no coinciden');
      } else {
        console.log('Error: Formulario tiene campos inválidos');
        this.errorMessage.set('Por favor, completa todos los campos obligatorios correctamente.');
      }
    }
  }
  
  private registerCompany(userId: number) {
    const companyData: CompanyRequest = {
      user_id: userId,
      business_name: this.registrationForm.get('companyName')?.value,
      tax_id: this.registrationForm.get('taxId')?.value,
      business_type: this.registrationForm.get('businessType')?.value,
      address: this.registrationForm.get('companyAddress')?.value,
      phone: this.registrationForm.get('companyPhone')?.value || this.registrationForm.get('phone')?.value,
      monthly_revenue: this.parseMonthlyRevenue(this.registrationForm.get('monthlyRevenue')?.value),
      years_in_business: this.registrationForm.get('yearsInBusiness')?.value || 0
    };
    
    this.companyService.createCompany(companyData).subscribe({
      next: (companyResponse) => {
        console.log('Empresa registrada exitosamente:', companyResponse);
        this.handleRegistrationSuccess();
      },
      error: (error) => {
        console.error('Error al registrar empresa:', error);
        this.handleRegistrationError(error);
      }
    });
  }
  
  private registerInvestor(userId: number) {
    // Mapear los valores del frontend a los esperados por el backend
    const riskToleranceMap: { [key: string]: string } = {
      'conservador': 'low',
      'moderado': 'medium',
      'agresivo': 'high'
    };
    
    const experienceMap: { [key: string]: string } = {
      'principiante': 'beginner',
      'intermedio': 'intermediate',
      'avanzado': 'advanced'
    };
    
    const investorData: InvestorRequest = {
      user_id: userId,
      investment_capacity: this.parseInvestmentCapacity(this.registrationForm.get('investmentCapacity')?.value),
      risk_tolerance: riskToleranceMap[this.registrationForm.get('riskProfile')?.value] || 'medium',
      investment_experience: experienceMap[this.registrationForm.get('investmentExperience')?.value] || 'beginner'
    };
    
    console.log('Registrando inversor con datos:', investorData);
    
    this.investorService.createInvestor(investorData).subscribe({
      next: (investorResponse) => {
        console.log('Inversor registrado exitosamente:', investorResponse);
        this.handleRegistrationSuccess();
      },
      error: (error) => {
        console.error('Error al registrar inversor:', error);
        this.handleRegistrationError(error);
      }
    });
  }
  
  private parseInvestmentCapacity(capacityRange: string): number {
    if (!capacityRange) return 10000;
    
    switch (capacityRange) {
      case '10000-50000': return 30000;
      case '50000-100000': return 75000;
      case '100000-500000': return 300000;
      case '500000+': return 750000;
      default: return 10000;
    }
  }
  
  private parseMonthlyRevenue(revenueRange: string): number {
    if (!revenueRange) return 0;
    
    switch (revenueRange) {
      case '0-50000': return 25000;
      case '50000-100000': return 75000;
      case '100000-500000': return 300000;
      case '500000+': return 750000;
      default: return 0;
    }
  }
  
  private handleRegistrationSuccess() {
    this.isLoading.set(false);
    this.successMessage.set('¡Registro exitoso! Bienvenido a FinTech Pro.');
    
    // Redirigir al dashboard después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 2000);
  }
  
  private handleRegistrationError(error: any) {
    this.isLoading.set(false);
    
    let errorMsg = 'Error en el registro. Por favor, inténtalo de nuevo.';
    
    if (error.error && error.error.message) {
      errorMsg = error.error.message;
    } else if (error.error && error.error.errors) {
      // Manejar errores de validación del backend
      const errors = error.error.errors;
      const errorMessages = Object.keys(errors).map(key => 
        errors[key].join(', ')
      ).join('; ');
      errorMsg = errorMessages;
    }
    
    this.errorMessage.set(errorMsg);
  }

  passwordsMatch(): boolean {
    const password = this.registrationForm.get('password')?.value;
    const confirmPassword = this.registrationForm.get('confirmPassword')?.value;
    return password === confirmPassword;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.registrationForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors?.['email']) {
        return 'Ingresa un email válido';
      }
      if (field.errors?.['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return null;
  }

  markFormGroupTouched() {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }
}