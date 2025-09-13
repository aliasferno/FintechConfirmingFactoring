import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface InvestmentProposal {
  id: number;
  investor_id: number;
  invoice_id: number;
  // Campos específicos de factoring
  advance_percentage?: number;
  factoring_commission?: number;
  risk_assessment?: 'low' | 'medium' | 'high';
  factoring_type?: 'with_recourse' | 'without_recourse' | 'international';
  // Campos específicos de confirming
  payment_terms?: string;
  guarantee_type?: 'with_recourse' | 'without_recourse';
  confirming_type?: 'with_recourse' | 'without_recourse' | 'international';
  supplier_notification?: boolean;
  advance_request?: boolean;
  confirming_commission?: number;
  payment_guarantee?: string;
  early_payment_discount?: number;
  // Campos adicionales
  negotiation_terms?: string;
  investor_comments?: string;
  // Campos de control del sistema
  status: 'draft' | 'sent' | 'pending' | 'approved' | 'rejected' | 'counter_offered' | 'expired';
  company_response?: string;
  responded_at?: string;
  responded_by?: number;
  sent_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
  investor?: any;
  invoice?: any;
  responded_by_user?: any;
}

export interface CreateProposalRequest {
  invoice_id: number;
  // Campos específicos de factoring
  advance_percentage?: number;
  factoring_commission?: number;
  risk_assessment?: 'low' | 'medium' | 'high';
  factoring_type?: 'with_recourse' | 'without_recourse' | 'international';
  // Campos específicos de confirming
  payment_terms?: string;
  guarantee_type?: 'with_recourse' | 'without_recourse';
  confirming_type?: 'with_recourse' | 'without_recourse' | 'international';
  supplier_notification?: boolean;
  advance_request?: boolean;
  confirming_commission?: number;
  payment_guarantee?: string;
  early_payment_discount?: number;
  // Campos adicionales
  negotiation_terms?: string;
  investor_comments?: string;
}

export interface RespondToProposalRequest {
  action: 'approve' | 'reject' | 'counter_offer';
  response_message: string;
  counter_terms?: {
    // Campos específicos según el tipo de operación
    advance_percentage?: number;
    factoring_commission?: number;
    confirming_commission?: number;
    payment_terms?: string;
  };
}

export interface ProposalResponse {
  message: string;
  proposal?: InvestmentProposal;
  counter_offer?: InvestmentProposal;
}

export interface ProposalStatistics {
  total_proposals: number;
  pending_proposals: number;
  approved_proposals: number;
  rejected_proposals: number;
  counter_offered_proposals: number;
  expired_proposals: number;
  total_proposed_amount: number;
  average_proposed_amount: number;
  average_interest_rate: number;
  approval_rate: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentProposalService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Crear una nueva propuesta de inversión
   */
  createProposal(proposalData: CreateProposalRequest): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(
      `${this.apiUrl}/investment-proposals`,
      proposalData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener todas las propuestas (con filtros opcionales)
   */
  getProposals(filters?: {
    investor_id?: number;
    invoice_id?: number;
    status?: string;
    company_id?: number;
    include_expired?: boolean;
    page?: number;
  }): Observable<any> {
    let params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${this.apiUrl}/investment-proposals${params.toString() ? '?' + params.toString() : ''}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtener una propuesta específica
   */
  getProposal(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/investment-proposals/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener propuestas del inversor actual
   */
  getInvestorProposals(page?: number): Observable<any> {
    const url = `${this.apiUrl}/investment-proposals/investor${page ? '?page=' + page : ''}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtener propuestas para la empresa actual
   */
  getCompanyProposals(page?: number): Observable<any> {
    const url = `${this.apiUrl}/investment-proposals/company${page ? '?page=' + page : ''}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtener propuestas por inversor específico
   */
  getProposalsByInvestor(investorId: number): Observable<InvestmentProposal[]> {
    return this.http.get<InvestmentProposal[]>(
      `${this.apiUrl}/investment-proposals/investor/${investorId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener estadísticas del inversor
   */
  getInvestorStatistics(investorId: number): Observable<ProposalStatistics> {
    return this.http.get<ProposalStatistics>(
      `${this.apiUrl}/investment-proposals/investor/${investorId}/statistics`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Responder a una propuesta (aprobar, rechazar o contraoferta)
   */
  respondToProposal(proposalId: number, response: RespondToProposalRequest): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(
      `${this.apiUrl}/investment-proposals/${proposalId}/respond`,
      response,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Enviar propuesta a la empresa
   */
  sendProposal(proposalId: number): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(
      `${this.apiUrl}/investment-proposals/${proposalId}/send`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Aprobar propuesta (empresa)
   */
  approveProposal(proposalId: number, approvalNotes?: string): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(
      `${this.apiUrl}/investment-proposals/${proposalId}/approve`,
      { approval_notes: approvalNotes },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Rechazar propuesta (empresa)
   */
  rejectProposal(proposalId: number, rejectionReason: string): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(
      `${this.apiUrl}/investment-proposals/${proposalId}/reject`,
      { rejection_reason: rejectionReason },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener estadísticas de propuestas
   */
  getStatistics(dateRange?: { start_date?: string; end_date?: string }): Observable<ProposalStatistics> {
    let params = new URLSearchParams();
    
    if (dateRange) {
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);
    }

    const url = `${this.apiUrl}/investment-proposals/statistics${params.toString() ? '?' + params.toString() : ''}`;
    return this.http.get<ProposalStatistics>(url, { headers: this.getHeaders() });
  }

  /**
   * Marcar propuestas expiradas
   */
  markExpiredProposals(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/investment-proposals/mark-expired`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener el estado de una propuesta (helper method)
   */
  getProposalStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'counter_offered': 'Contraoferta',
      'expired': 'Expirada'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtener el color del estado (helper method)
   */
  getProposalStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': '#ffc107',
      'approved': '#28a745',
      'rejected': '#dc3545',
      'counter_offered': '#17a2b8',
      'expired': '#6c757d'
    };
    return colorMap[status] || '#6c757d';
  }

  /**
   * Calcular el retorno esperado basado en comisiones
   */
  calculateExpectedReturn(proposal: InvestmentProposal): number {
    // Calcular comisión basada en el tipo de operación
    if (proposal.factoring_commission && proposal.advance_percentage) {
      // Factoring: comisión sobre el monto de anticipo
      const invoiceAmount = proposal.invoice?.amount || 0;
      const advanceAmount = invoiceAmount * (proposal.advance_percentage / 100);
      return advanceAmount * (proposal.factoring_commission / 100);
    } else if (proposal.confirming_commission) {
      // Confirming: comisión sobre el monto total
      const invoiceAmount = proposal.invoice?.amount || 0;
      return invoiceAmount * (proposal.confirming_commission / 100);
    }
    return 0;
  }

  /**
   * Verificar si una propuesta está expirada
   */
  isProposalExpired(proposal: InvestmentProposal): boolean {
    // Las propuestas ahora se consideran expiradas solo por su status
    return proposal.status === 'expired';
  }

  /**
   * Verificar si una propuesta puede ser respondida
   */
  canRespondToProposal(proposal: InvestmentProposal): boolean {
    const validStatuses = ['pending', 'counter_offered'];
    return validStatuses.includes(proposal.status) && proposal.status !== 'expired';
  }

  /**
   * Formatear monto en pesos colombianos
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatear porcentaje
   */
  formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }
}