import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Investor {
  id: number;
  user_id: number;
  investor_type: string;
  risk_tolerance: string;
  investment_experience: string;
  preferred_sectors: string[] | null;
  minimum_investment: number;
  maximum_investment: number | null;
  investment_horizon: string;
  verification_status: string;
  accredited_investor: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestorRequest {
  user_id: number;
  investment_capacity: number;
  risk_tolerance: string;
  investment_experience: string;
  preferred_sectors?: string[];
  minimum_investment?: number;
  maximum_investment?: number;
}

export interface InvestorResponse {
  message: string;
  investor?: Investor;
}

@Injectable({
  providedIn: 'root'
})
export class InvestorService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  createInvestor(investorData: InvestorRequest): Observable<InvestorResponse> {
    console.log('InvestorService: Enviando datos de inversor:', investorData);
    return this.http.post<InvestorResponse>(
      `${this.apiUrl}/investors`,
      investorData,
      { headers: this.getHeaders() }
    );
  }

  getInvestor(id: number): Observable<Investor> {
    return this.http.get<Investor>(
      `${this.apiUrl}/investors/${id}`,
      { headers: this.getHeaders() }
    );
  }

  updateInvestor(id: number, investorData: Partial<InvestorRequest>): Observable<InvestorResponse> {
    return this.http.put<InvestorResponse>(
      `${this.apiUrl}/investors/${id}`,
      investorData,
      { headers: this.getHeaders() }
    );
  }

  getInvestorProfile(): Observable<Investor> {
    return this.http.get<Investor>(
      `${this.apiUrl}/investors/profile`,
      { headers: this.getHeaders() }
    );
  }

  getInvestorPortfolio(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/investors/${id}/portfolio`,
      { headers: this.getHeaders() }
    );
  }

  getInvestmentOpportunities(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/investors/${id}/opportunities`,
      { headers: this.getHeaders() }
    );
  }
}