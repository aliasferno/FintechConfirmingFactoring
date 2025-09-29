import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'empresa' | 'inversor';
  created_at: string;
  updated_at: string;
  roles?: Role[];
  permissions?: Permission[];
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'empresa' | 'inversor';
}

export interface LoginRequest {
  email: string;
  password: string;
  user_type?: 'empresa' | 'inversor' | 'admin';
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://127.0.0.1:8000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar token y usuario desde localStorage al inicializar
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    
    if (token) {
      this.tokenSubject.next(token);
    }
    
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  /**
   * Registrar un nuevo usuario
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    // Enviar los datos tal como los espera el backend actualizado
    const backendData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      password: userData.password,
      password_confirmation: userData.password_confirmation,
      user_type: userData.user_type, // Mantener valores en español: 'empresa', 'inversor'
      phone: userData.phone
    };
    
    console.log('Enviando petición de registro al backend:', backendData);
    console.log('URL completa:', `${this.API_URL}/register`);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, backendData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .pipe(
        tap({
          next: (response) => {
            console.log('Respuesta exitosa del backend:', response);
            if (response.token) {
              this.setAuthData(response.token, response.user);
            }
          },
          error: (error) => {
            console.error('Error detallado en la petición:', error);
            console.error('Status:', error.status);
            console.error('Message:', error.message);
            console.error('Error body:', error.error);
          }
        })
      );
  }



  /**
   * Iniciar sesión
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setAuthData(response.token, response.user);
          }
        })
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.API_URL}/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.clearAuthData();
        })
      );
  }

  /**
   * Obtener perfil del usuario actual
   */
  getProfile(): Observable<{ user: User }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ user: User }>(`${this.API_URL}/profile`, { headers });
  }

  /**
   * Verificar perfiles disponibles para un email
   */
  checkEmailProfiles(email: string): Observable<{ message: string; profiles: Array<{ user_type: string; name: string }> }> {
    return this.http.post<{ message: string; profiles: Array<{ user_type: string; name: string }> }>(
      `${this.API_URL}/check-email-profiles`,
      { email }
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const tokenFromSubject = this.tokenSubject.value;
    const tokenFromStorage = localStorage.getItem('auth_token');
    return !!(tokenFromSubject || tokenFromStorage);
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    const userFromSubject = this.currentUserSubject.value;
    if (userFromSubject) {
      return userFromSubject;
    }
    
    // Si no hay usuario en el subject, intentar obtenerlo del localStorage
    const userFromStorage = localStorage.getItem('current_user');
    if (userFromStorage) {
      try {
        const user = JSON.parse(userFromStorage);
        return user;
      } catch (error) {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Obtener headers de autorización
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Establecer datos de autenticación
   */
  private setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.roles) {
      return false;
    }
    return user.roles.some(role => role.name === roleName);
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(roleName => this.hasRole(roleName));
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permissionName: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.some(permission => permission.name === permissionName);
  }

  /**
   * Verificar si el usuario tiene alguno de los permisos especificados
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    return permissionNames.some(permissionName => this.hasPermission(permissionName));
  }

  /**
   * Obtener los roles del usuario actual
   */
  getUserRoles(): Role[] {
    const user = this.getCurrentUser();
    return user?.roles || [];
  }

  /**
   * Obtener los permisos del usuario actual
   */
  getUserPermissions(): Permission[] {
    const user = this.getCurrentUser();
    return user?.permissions || [];
  }
}