import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Invoice {
  id: number;
  company_id: number;
  invoice_number: string;
  client_name: string;
  client_tax_id: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  risk_score?: number;
  discount_rate?: number;
  net_amount?: number;
  document_path?: string;
  verification_status: string;
  operation_type: 'confirming' | 'factoring';
  description?: string;
  // Campos específicos para Factoring
  advance_percentage?: number;
  commission_rate?: number;
  expected_collection_date?: string;
  credit_risk_assessment?: 'low' | 'medium' | 'high';
  // Campos específicos para Confirming
  supplier_name?: string;
  supplier_tax_id?: string;
  payment_terms?: string;
  early_payment_discount?: number;
  confirmation_deadline?: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: number;
    business_name: string;
    tax_id: string;
  };
  investments?: any[];
}

export interface InvoiceResponse {
  message: string;
  invoice?: Invoice;
}

export interface InvoicesListResponse {
  data: Invoice[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  /**
   * Get all invoices with optional filters
   */
  getInvoices(params?: {
    status?: string;
    verification_status?: string;
    operation_type?: string;
    page?: number;
    per_page?: number;
  }): Observable<InvoicesListResponse> {
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      queryParams = searchParams.toString();
    }

    const url = queryParams ? `${this.apiUrl}/invoices?${queryParams}` : `${this.apiUrl}/invoices`;
    return this.http.get<InvoicesListResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Get factoring invoices
   */
  getFactoringInvoices(params?: {
    status?: string;
    verification_status?: string;
    page?: number;
    per_page?: number;
  }): Observable<InvoicesListResponse> {
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      queryParams = searchParams.toString();
    }

    const url = queryParams ? `${this.apiUrl}/invoices/factoring?${queryParams}` : `${this.apiUrl}/invoices/factoring`;
    return this.http.get<InvoicesListResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Get confirming invoices
   */
  getConfirmingInvoices(params?: {
    status?: string;
    verification_status?: string;
    page?: number;
    per_page?: number;
  }): Observable<InvoicesListResponse> {
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      queryParams = searchParams.toString();
    }

    const url = queryParams ? `${this.apiUrl}/invoices/confirming?${queryParams}` : `${this.apiUrl}/invoices/confirming`;
    return this.http.get<InvoicesListResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Get invoices by company
   */
  getInvoicesByCompany(companyId: number, params?: {
    status?: string;
    verification_status?: string;
    operation_type?: string;
    page?: number;
    per_page?: number;
  }): Observable<InvoicesListResponse> {
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      queryParams = searchParams.toString();
    }

    const url = queryParams 
      ? `${this.apiUrl}/invoices/company/${companyId}?${queryParams}` 
      : `${this.apiUrl}/invoices/company/${companyId}`;
    return this.http.get<InvoicesListResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Get a single invoice by ID
   */
  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Get specific factoring invoice
   */
  getFactoringInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/factoring/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Get specific confirming invoice
   */
  getConfirmingInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/confirming/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Create a new invoice
   */
  createInvoice(formData: FormData): Observable<InvoiceResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
      // Don't set Content-Type for FormData, let the browser set it
    });

    return this.http.post<InvoiceResponse>(`${this.apiUrl}/invoices`, formData, { headers });
  }

  /**
   * Create factoring invoice
   */
  createFactoringInvoice(formData: FormData): Observable<InvoiceResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.post<InvoiceResponse>(`${this.apiUrl}/invoices/factoring`, formData, { headers });
  }

  /**
   * Create confirming invoice
   */
  createConfirmingInvoice(formData: FormData): Observable<InvoiceResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.post<InvoiceResponse>(`${this.apiUrl}/invoices/confirming`, formData, { headers });
  }

  /**
   * Update an existing invoice
   */
  updateInvoice(id: number, formData: FormData): Observable<InvoiceResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.post<InvoiceResponse>(`${this.apiUrl}/invoices/${id}`, formData, { headers });
  }

  /**
   * Update factoring invoice
   */
  updateFactoringInvoice(id: number, formData: FormData): Observable<InvoiceResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.post<InvoiceResponse>(`${this.apiUrl}/invoices/factoring/${id}`, formData, { headers });
  }

  /**
   * Update confirming invoice
   */
  updateConfirmingInvoice(id: number, formData: FormData): Observable<InvoiceResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.post<InvoiceResponse>(`${this.apiUrl}/invoices/confirming/${id}`, formData, { headers });
  }

  /**
   * Delete an invoice
   */
  deleteInvoice(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/invoices/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Get invoices available for investment
   */
  getAvailableForInvestment(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices/available-for-investment`, { headers: this.getHeaders() });
  }

  /**
   * Get a public invoice by ID (no authentication required)
   */
  getPublicInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/public/invoices/${id}`);
  }

  /**
   * Update verification status of an invoice
   */
  updateVerificationStatus(id: number, status: string, notes?: string): Observable<InvoiceResponse> {
    const body = { verification_status: status };
    if (notes) {
      (body as any).verification_notes = notes;
    }

    return this.http.patch<InvoiceResponse>(
      `${this.apiUrl}/invoices/${id}/verification-status`, 
      body, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get invoice statistics for dashboard
   */
  getInvoiceStats(companyId?: number): Observable<{
    totalFacturas: number;
    facturasPendientes: number;
    facturasCaducadas: number;
    montoTotal: number;
    montoDisponible: number;
    facturasPorTipo: {
      confirming: number;
      factoring: number;
    };
    recentActivities: {
      id: number;
      type: string;
      description: string;
      amount: number;
      date: string;
    }[];
  }> {
    const url = companyId 
      ? `${this.apiUrl}/invoices/stats?company_id=${companyId}`
      : `${this.apiUrl}/invoices/stats`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  /**
   * Download invoice document
   */
  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoices/${id}/document`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Get invoice status options
   */
  getStatusOptions(): { value: string; label: string }[] {
    return [
      { value: 'pending', label: 'Pendiente' },
      { value: 'approved', label: 'Aprobada' },
      { value: 'funded', label: 'Financiada' },
      { value: 'paid', label: 'Pagada' },
      { value: 'rejected', label: 'Rechazada' }
    ];
  }

  /**
   * Get verification status options
   */
  getVerificationStatusOptions(): { value: string; label: string }[] {
    return [
      { value: 'pending', label: 'Pendiente' },
      { value: 'verified', label: 'Verificada' },
      { value: 'rejected', label: 'Rechazada' }
    ];
  }

  /**
   * Get operation type options
   */
  getOperationTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'factoring', label: 'Factoring' },
      { value: 'confirming', label: 'Confirming' }
    ];
  }

  /**
   * Approve an invoice
   */
  approveInvoice(id: number): Observable<InvoiceResponse> {
    return this.http.patch<InvoiceResponse>(
      `${this.apiUrl}/invoices/${id}/approve`, 
      {}, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update expired invoices
   */
  updateExpiredInvoices(): Observable<{ message: string; updated_count: number }> {
    return this.http.post<{ message: string; updated_count: number }>(
      `${this.apiUrl}/invoices/update-expired`,
      {},
      { headers: this.getHeaders() }
    );
  }

}