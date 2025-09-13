import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface InvestorStats {
  totalInversiones: number;
  inversionesActivas: number;
  montoInvertido: number;
  rendimientoTotal: number;
  opportunities: InvestmentOpportunity[];
  recentActivities: RecentActivity[];
}

export interface InvestmentOpportunity {
  id: number;
  companyName: string;
  facturaNumber: string;
  amount: number;
  interestRate: number;
  term: number;
  expectedReturn: number;
  riskLevel: string;
  dueDate: string;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

export interface Investment {
  id: number;
  investor_id: number;
  invoice_id: number;
  amount: number;
  expected_return: number;
  actual_return?: number;
  investment_date: string;
  maturity_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentResponse {
  message: string;
  investment?: Investment;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  getInvestorStats(): Observable<InvestorStats> {
    return this.http.get<InvestorStats>(
      `${this.apiUrl}/investments/investor-stats`,
      { headers: this.getHeaders() }
    );
  }

  getInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(
      `${this.apiUrl}/investments`,
      { headers: this.getHeaders() }
    );
  }

  createInvestment(investmentData: any): Observable<InvestmentResponse> {
    return this.http.post<InvestmentResponse>(
      `${this.apiUrl}/investments`,
      investmentData,
      { headers: this.getHeaders() }
    );
  }

  getInvestment(id: number): Observable<Investment> {
    return this.http.get<Investment>(
      `${this.apiUrl}/investments/${id}`,
      { headers: this.getHeaders() }
    );
  }

  updateInvestment(id: number, investmentData: any): Observable<InvestmentResponse> {
    return this.http.put<InvestmentResponse>(
      `${this.apiUrl}/investments/${id}`,
      investmentData,
      { headers: this.getHeaders() }
    );
  }

  deleteInvestment(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/investments/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getInvestmentOpportunities(): Observable<any[]> {
    return this.http.get<any>(
      `${this.apiUrl}/investments/opportunities`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        // Si la respuesta tiene una estructura paginada
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        // Si la respuesta es un array directamente
        return response;
      })
    );
  }

  getInvestmentStatistics(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/investments/statistics`,
      { headers: this.getHeaders() }
    );
  }

  getInvestmentOpportunity(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/investments/opportunities/${id}`,
      { headers: this.getHeaders() }
    );
  }
}