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
  factoring_type?: string;
  // Campos específicos para Confirming
  supplier_name?: string;
  supplier_tax_id?: string;
  payment_terms?: string;
  early_payment_discount?: number;
  confirmation_deadline?: string;
  confirming_type?: string;
  confirming_commission?: number;
  guarantee_type?: string;
  payment_guarantee?: string;
  supplier_notification?: boolean;
  advance_request?: boolean;
  created_at: string;
  updated_at: string;
  company?: {
    id: number;
    business_name: string;
    tax_id: string;
    name?: string;
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