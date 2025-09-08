import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, AuthResponse } from './services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  availableProfiles = signal<Array<{ user_type: string; name: string }>>([]);
  showProfileSelection = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.createForm();
  }



  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      // Primero verificar si hay múltiples perfiles para este email
      this.checkForMultipleProfiles(this.loginForm.value.email);
    } else {
      this.markFormGroupTouched();
      this.errorMessage.set('Por favor, completa todos los campos correctamente.');
      this.cdr.detectChanges();
    }
  }

  private checkForMultipleProfiles(email: string) {
    this.authService.checkEmailProfiles(email).subscribe({
      next: (response) => {
        if (response.profiles.length > 1) {
          // Múltiples perfiles: mostrar selección
          this.availableProfiles.set(response.profiles);
          this.showProfileSelection.set(true);
          this.isLoading.set(false);
          this.errorMessage.set('Se encontraron múltiples perfiles para este email. Por favor, selecciona el tipo de perfil correcto.');
          this.cdr.detectChanges();
        } else if (response.profiles.length === 1) {
          // Un solo perfil: proceder con login automático
          this.loginWithProfile(response.profiles[0].user_type);
        } else {
          // No se encontraron perfiles: intentar login sin user_type
          this.attemptDirectLogin();
        }
      },
      error: () => {
        // Error al verificar perfiles: intentar login directo
        this.attemptDirectLogin();
      }
    });
  }

  private attemptDirectLogin() {
    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.handleSuccessfulLogin(response as AuthResponse);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.handleLoginError(error);
      }
    });
  }

  loginWithProfile(userType: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.showProfileSelection.set(false);

    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      user_type: userType as 'empresa' | 'inversor' | 'admin'
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.handleSuccessfulLogin(response as AuthResponse);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.handleLoginError(error);
      }
    });
  }

  private handleSuccessfulLogin(response: AuthResponse) {
    const user = response.user;
    if (user.roles && user.roles.length > 0) {
      const role = user.roles[0].name;
      if (role === 'empresa') {
        this.router.navigate(['/dashboard/empresa']);
      } else if (role === 'inversor') {
        this.router.navigate(['/dashboard/inversor']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private handleLoginError(error: any) {
    let errorMsg = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
    
    if (error.status === 401) {
      errorMsg = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
    } else if (error.status === 404) {
      errorMsg = 'No existe una cuenta asociada a este email. Por favor, verifica el email o regístrate.';
    } else if (error.error && error.error.message) {
      errorMsg = error.error.message;
    }
    
    this.errorMessage.set(errorMsg);
    this.cdr.detectChanges();
  }



  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToForgotPassword() {
    // TODO: Implementar recuperación de contraseña
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldDisplayName(fieldName)} es obligatorio`;
      }
      if (field.errors?.['email']) {
        return 'Ingresa un email válido';
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${field.errors?.['minlength'].requiredLength} caracteres`;
      }
    }
    return null;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Contraseña',
      user_type: 'Tipo de perfil'
    };
    return displayNames[fieldName] || fieldName;
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}