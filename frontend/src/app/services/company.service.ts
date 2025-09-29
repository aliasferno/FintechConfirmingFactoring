import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Company {
  id: number;
  user_id: number;
  business_name: string;
  tax_id: string;
  business_type: string;
  address: string;
  phone: string;
  monthly_revenue: number;
  years_in_business: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyRequest {
  user_id: number;
  business_name: string;
  tax_id: string;
  business_type: string;
  address: string;
  phone: string;
  monthly_revenue: number;
  years_in_business: number;
}

export interface CompanyResponse {
  message: string;
  company?: Company;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly API_URL = 'http://127.0.0.1:8000/api';

  // Tipos de negocio disponibles (coinciden con el backend)
  public readonly BUSINESS_TYPES = [
    'Manufactura',
    'Servicios',
    'Comercio',
    'Tecnología',
    'Construcción',
    'Agricultura',
    'Transporte',
    'Educación',
    'Salud',
    'Turismo',
    'Finanzas',
    'Inmobiliario',
    'Energía',
    'Alimentario',
    'Textil',
    'Automotriz',
    'Químico',
    'Farmacéutico',
    'Entretenimiento',
    'Consultoría'
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Crear una nueva empresa
   */
  createCompany(companyData: CompanyRequest): Observable<CompanyResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<CompanyResponse>(`${this.API_URL}/companies`, companyData, { headers });
  }

  /**
   * Obtener empresa por ID
   */
  getCompany(id: number): Observable<{ company: Company }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ company: Company }>(`${this.API_URL}/companies/${id}`, { headers });
  }

  /**
   * Obtener todas las empresas del usuario actual
   */
  getUserCompanies(): Observable<{ companies: Company[] }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ companies: Company[] }>(`${this.API_URL}/companies`, { headers });
  }

  /**
   * Actualizar empresa
   */
  updateCompany(id: number, companyData: Partial<CompanyRequest>): Observable<CompanyResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<CompanyResponse>(`${this.API_URL}/companies/${id}`, companyData, { headers });
  }

  /**
   * Eliminar empresa
   */
  deleteCompany(id: number): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.delete<{ message: string }>(`${this.API_URL}/companies/${id}`, { headers });
  }

  /**
   * Validar si un RUC/Tax ID ya existe
   */
  validateTaxId(taxId: string): Observable<{ exists: boolean }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ exists: boolean }>(`${this.API_URL}/companies/validate-tax-id/${taxId}`, { headers });
  }

  /**
   * Obtener estadísticas de la empresa
   */
  getCompanyStats(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.API_URL}/companies/${id}/stats`, { headers });
  }

  /**
   * Obtener estadísticas de financiamientos recibidos por la empresa
   */
  getCompanyFinancingStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.API_URL}/investments/company-financing-stats`, { headers });
  }

  /**
   * Obtener historial de financiamientos recibidos por la empresa
   */
  getCompanyFinancingHistory(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.API_URL}/investments/company-financing-history`, { headers });
  }

  /**
   * Obtener actividad reciente de financiamientos
   */
  getCompanyFinancingActivity(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.API_URL}/investments/company-financing-activity`, { headers });
  }

  /**
   * Obtener headers de autorización
   */
  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  /**
   * Formatear número de ingresos mensuales
   */
  formatMonthlyRevenue(revenue: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(revenue);
  }

  /**
   * Validar datos de empresa antes del envío
   */
  validateCompanyData(data: CompanyRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.business_name || data.business_name.trim().length < 2) {
      errors.push('El nombre de la empresa debe tener al menos 2 caracteres');
    }

    if (!data.tax_id || data.tax_id.trim().length < 8) {
      errors.push('El RUC/Tax ID debe tener al menos 8 caracteres');
    }

    if (!data.business_type || !this.BUSINESS_TYPES.includes(data.business_type)) {
      errors.push('Debe seleccionar un tipo de negocio válido');
    }

    if (!data.address || data.address.trim().length < 10) {
      errors.push('La dirección debe tener al menos 10 caracteres');
    }

    if (!data.phone || data.phone.trim().length < 9) {
      errors.push('El teléfono debe tener al menos 9 dígitos');
    }

    if (!data.monthly_revenue || data.monthly_revenue <= 0) {
      errors.push('Los ingresos mensuales deben ser mayor a 0');
    }

    if (!data.years_in_business || data.years_in_business < 0) {
      errors.push('Los años en el negocio no pueden ser negativos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}