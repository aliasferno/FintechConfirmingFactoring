import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { InvestorService } from './services/investor.service';
import { InvestmentService, InvestorStats } from './services/investment.service';

interface InvestmentStats {
  totalInversiones: number;
  inversionesActivas: number;
  montoInvertido: number;
  rendimientoTotal: number;
}

interface InvestmentOpportunity {
  id: string;
  companyName: string;
  facturaNumber: string;
  amount: number;
  interestRate: number;
  term: number; // días
  riskLevel: 'bajo' | 'medio' | 'alto';
  dueDate: Date;
}

interface RecentInvestment {
  id: string;
  type: 'inversion_realizada' | 'pago_recibido' | 'oportunidad_nueva';
  description: string;
  amount?: number;
  date: Date;
}

@Component({
  selector: 'app-dashboard-inversor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-inversor.component.html',
  styleUrls: ['./dashboard-inversor.component.css']
})
export class DashboardInversorComponent implements OnInit {
  user = signal<User | null>(null);
  stats = signal<InvestmentStats>({
    totalInversiones: 0,
    inversionesActivas: 0,
    montoInvertido: 0,
    rendimientoTotal: 0
  });
  opportunities = signal<InvestmentOpportunity[]>([]);
  recentActivities = signal<RecentInvestment[]>([]);
  isLoading = signal(true);
  error = signal('');

  constructor(
    private authService: AuthService,
    private investorService: InvestorService,
    private investmentService: InvestmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadDashboardData();
  }

  private loadUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.set(currentUser);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private loadDashboardData() {
    this.isLoading.set(true);
    this.error.set('');
    
    this.investmentService.getInvestorStats().subscribe({
      next: (data: InvestorStats) => {
        this.stats.set({
          totalInversiones: data.totalInversiones,
          inversionesActivas: data.inversionesActivas,
          montoInvertido: data.montoInvertido,
          rendimientoTotal: data.rendimientoTotal
        });

        // Mapear oportunidades del backend al formato del frontend
        const mappedOpportunities = data.opportunities.map(opp => ({
          id: opp.id.toString(),
          companyName: opp.companyName,
          facturaNumber: opp.facturaNumber,
          amount: opp.amount,
          interestRate: (opp.expectedReturn / opp.amount) * 100, // Calcular tasa de interés
          term: Math.ceil((new Date(opp.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)), // Días hasta vencimiento
          riskLevel: this.mapRiskLevel(opp.riskLevel),
          dueDate: new Date(opp.dueDate)
        }));
        this.opportunities.set(mappedOpportunities);

        // Mapear actividades recientes del backend al formato del frontend
        const mappedActivities = data.recentActivities.map(activity => ({
          id: activity.id.toString(),
          type: this.mapActivityType(activity.type),
          description: activity.description,
          amount: activity.amount,
          date: new Date(activity.date)
        }));
        this.recentActivities.set(mappedActivities);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar datos del dashboard:', error);
        this.error.set('Error al cargar los datos del dashboard');
        this.isLoading.set(false);
        
        // Establecer valores por defecto en caso de error
        this.stats.set({
          totalInversiones: 0,
          inversionesActivas: 0,
          montoInvertido: 0,
          rendimientoTotal: 0
        });
        this.opportunities.set([]);
        this.recentActivities.set([]);
      }
    });
  }

  navigateToOportunidades() {
    this.router.navigate(['/oportunidades']);
  }

  navigateToInversiones() {
    this.router.navigate(['/inversiones']);
  }

  navigateToPortafolio() {
    this.router.navigate(['/portafolio']);
  }

  navigateToReportes() {
    this.router.navigate(['/reportes']);
  }

  navigateToProfile() {
    this.router.navigate(['/perfil']);
  }

  investInOpportunity(opportunityId: string) {
    // TODO: Implementar lógica de inversión
    console.log('Invertir en oportunidad:', opportunityId);
    this.router.navigate(['/oportunidades', opportunityId, 'invertir']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Aún así redirigir al usuario
        this.router.navigate(['/']);
      }
    });
  }

  formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '$0';
    }
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numericAmount);
  }

  formatPercentage(rate: number): string {
    return `${rate.toFixed(1)}%`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'bajo':
        return 'risk-low';
      case 'medio':
        return 'risk-medium';
      case 'alto':
        return 'risk-high';
      default:
        return 'risk-medium';
    }
  }

  getRiskLevelText(riskLevel: string): string {
    switch (riskLevel) {
      case 'bajo':
        return 'Riesgo Bajo';
      case 'medio':
        return 'Riesgo Medio';
      case 'alto':
        return 'Riesgo Alto';
      default:
        return 'Riesgo Medio';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'inversion_realizada':
        return '💰';
      case 'pago_recibido':
        return '✅';
      case 'oportunidad_nueva':
        return '🔔';
      default:
        return '📊';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'inversion_realizada':
        return 'text-blue-600';
      case 'pago_recibido':
        return 'text-green-600';
      case 'oportunidad_nueva':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }

  calculateExpectedReturn(amount: number, rate: number, term: number): number {
    return (amount * rate * term) / (365 * 100);
  }

  private mapRiskLevel(backendRiskLevel: string): 'bajo' | 'medio' | 'alto' {
    switch (backendRiskLevel.toLowerCase()) {
      case 'low':
        return 'bajo';
      case 'medium':
        return 'medio';
      case 'high':
        return 'alto';
      default:
        return 'medio';
    }
  }

  private mapActivityType(backendType: string): 'inversion_realizada' | 'pago_recibido' | 'oportunidad_nueva' {
    switch (backendType.toLowerCase()) {
      case 'investment':
        return 'inversion_realizada';
      case 'payment':
        return 'pago_recibido';
      case 'opportunity':
        return 'oportunidad_nueva';
      default:
        return 'inversion_realizada';
    }
  }
}