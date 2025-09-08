import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-container">
      <!-- Header -->
      <header class="header">
        <nav class="nav">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 2L3 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-13-5z"/>
              <path d="M12 14l2 2 6-6" stroke="white" stroke-width="2" fill="none"/>
            </svg>
            <span>FactorFlow</span>
          </div>
          <div class="nav-links">
            <a href="#features">Características</a>
            <a href="#how-it-works">Cómo Funciona</a>
            <a href="#contact">Contacto</a>
            <button class="btn btn-outline" (click)="navigateToLogin()">Iniciar Sesión</button>
          </div>
        </nav>
      </header>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Revoluciona tu <span class="highlight">Gestión Financiera</span> con Factoring y Confirming Digital</h1>
          <p class="hero-subtitle">
            Somos la startup fintech que conecta empresas con necesidades de liquidez inmediata 
            e inversores inteligentes. Ofrecemos soluciones de factoring y confirming 100% digitales, 
            seguras y eficientes para acelerar tu crecimiento empresarial.
          </p>
          <div class="hero-stats">
          <div class="stat">
            <div class="stat-number">Beta</div>
            <div class="stat-label">Versión Actual</div>
          </div>
          <div class="stat">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Disponibilidad</div>
          </div>
          <div class="stat">
            <div class="stat-number">0%</div>
            <div class="stat-label">Comisión de Registro</div>
          </div>
        </div>
        </div>
        <div class="hero-image">
          <div class="floating-card card-1">
            <div class="card-icon">📊</div>
            <div class="card-text">Análisis en Tiempo Real</div>
          </div>
          <div class="floating-card card-2">
            <div class="card-icon">🔒</div>
            <div class="card-text">100% Seguro</div>
          </div>
          <div class="floating-card card-3">
            <div class="card-icon">⚡</div>
            <div class="card-text">Proceso Instantáneo</div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features">
        <div class="container">
          <h2>Soluciones Fintech Innovadoras</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Factoring Digital</h3>
              <ul>
                <li>Adelanto inmediato del 80-90% de tus facturas</li>
                <li>Evaluación de riesgo automatizada con IA</li>
                <li>Proceso de aprobación en menos de 24 horas</li>
                <li>Comisiones competitivas y transparentes</li>
              </ul>
            </div>
            <div class="feature-card">
              <div class="feature-icon">✅</div>
              <h3>Confirming Inteligente</h3>
              <ul>
                <li>Confirmación automática de facturas de proveedores</li>
                <li>Gestión centralizada de pagos a proveedores</li>
                <li>Descuentos por pronto pago optimizados</li>
                <li>Mejora del capital de trabajo</li>
              </ul>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔐</div>
              <h3>Tecnología Segura</h3>
              <ul>
                <li>Blockchain para trazabilidad de transacciones</li>
                <li>Análisis predictivo de riesgo crediticio</li>
                <li>Encriptación bancaria de nivel empresarial</li>
                <li>Cumplimiento PCI DSS y regulaciones financieras</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works Section -->
      <section id="how-it-works" class="how-it-works">
        <div class="container">
          <h2>Cómo Funciona FactorFlow</h2>
          <div class="process-grid">
            <div class="process-step">
              <div class="step-number">1</div>
              <div class="step-icon">📄</div>
              <h3>Sube tu Factura</h3>
              <p>Carga tus facturas pendientes de cobro o confirma facturas de proveedores en nuestra plataforma segura</p>
            </div>
            <div class="process-step">
              <div class="step-number">2</div>
              <div class="step-icon">🤖</div>
              <h3>Análisis Automático</h3>
              <p>Nuestra IA evalúa el riesgo crediticio y determina las mejores condiciones de financiamiento</p>
            </div>
            <div class="process-step">
              <div class="step-number">3</div>
              <div class="step-icon">⚡</div>
              <h3>Aprobación Rápida</h3>
              <p>Recibe una respuesta en menos de 24 horas con condiciones transparentes y competitivas</p>
            </div>
            <div class="process-step">
              <div class="step-number">4</div>
              <div class="step-icon">💸</div>
              <h3>Recibe tu Dinero</h3>
              <p>Obtén el adelanto de tu factura o gestiona los pagos a proveedores de forma automática</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta">
        <div class="container">
          <h2>Únete a la Revolución Fintech</h2>
          <p>Más de 200 empresas ya optimizan su flujo de caja con FactorFlow. ¿Cuál es tu perfil?</p>
          
          <div class="profile-selection">
            <div class="profile-option" 
                 [class.selected]="selectedProfile() === 'empresa'"
                 (click)="selectProfile('empresa')">
              <div class="profile-icon">🏢</div>
              <h3>Empresa/PYME</h3>
              <p>Necesito liquidez inmediata para mis facturas o gestionar pagos a proveedores</p>
            </div>
            
            <div class="profile-option" 
                 [class.selected]="selectedProfile() === 'inversor'"
                 (click)="selectProfile('inversor')">
              <div class="profile-icon">💰</div>
              <h3>Inversor/Fondo</h3>
              <p>Busco oportunidades de inversión seguras con rendimientos atractivos</p>
            </div>
          </div>
          
          <button class="btn btn-primary btn-large" 
                  [disabled]="!selectedProfile()"
                  (click)="startRegistration()">
            Empezar Ahora - Es Gratis
          </button>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <div class="logo">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 2L3 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-13-5z"/>
                  <path d="M12 14l2 2 6-6" stroke="white" stroke-width="2" fill="none"/>
                </svg>
                <span>FactorFlow</span>
              </div>
              <p>La startup fintech que revoluciona el factoring y confirming digital en Latinoamérica.</p>
            </div>
            <div class="footer-section">
              <h4>Empresa</h4>
              <ul>
                <li><a href="#">Acerca de</a></li>
                <li><a href="#">Carreras</a></li>
                <li><a href="#">Prensa</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4>Soporte</h4>
              <ul>
                <li><a href="#">Centro de Ayuda</a></li>
                <li><a href="#">Contacto</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Términos</a></li>
                <li><a href="#">Privacidad</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 FactorFlow. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%);
      color: white;
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header {
      padding: 20px 0;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      z-index: 1000;
    }

    .nav {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 700;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 30px;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.3s ease;
    }

    .nav-links a:hover {
      opacity: 0.8;
    }

    .hero {
      padding: 120px 20px 80px;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
      min-height: 80vh;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 100%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
      animation: heroFloat 6s ease-in-out infinite;
    }

    @keyframes heroFloat {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }

    .hero h1 {
      font-size: 48px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s ease-in-out infinite;
      position: relative;
      z-index: 1;
    }

    @keyframes shimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .highlight {
      background: linear-gradient(45deg, #FFD700, #FFA500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 20px;
      line-height: 1.6;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .hero-stats {
      display: flex;
      gap: 40px;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      font-size: 32px;
      font-weight: 800;
      color: #FFD700;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 4px;
    }

    .hero-image {
      position: relative;
      height: 400px;
    }

    .floating-card {
      position: absolute;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: float 6s ease-in-out infinite;
    }

    .card-1 {
      top: 20px;
      right: 20px;
      animation-delay: 0s;
    }

    .card-2 {
      top: 50%;
      left: 20px;
      animation-delay: 2s;
    }

    .card-3 {
      bottom: 20px;
      right: 40px;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    .card-icon {
      font-size: 24px;
    }

    .card-text {
      font-weight: 600;
      font-size: 14px;
    }

    .features {
      background: white;
      color: #2c3e50;
      padding: 80px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .features h2 {
      text-align: center;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 60px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
    }

    .feature-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      transition: all 0.4s ease;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    }

    .feature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .feature-card:hover {
      transform: translateY(-15px);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 215, 0, 0.3);
    }

    .feature-card:hover::before {
      opacity: 1;
    }

    .feature-icon {
      font-size: 56px;
      margin-bottom: 24px;
      display: block;
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      transition: transform 0.3s ease;
    }

    .feature-card:hover .feature-icon {
      transform: scale(1.1) rotate(5deg);
    }

    .feature-card h3 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      color: white;
      position: relative;
      z-index: 1;
    }

    .feature-card ul {
      list-style: none;
      padding: 0;
      text-align: left;
      position: relative;
      z-index: 1;
    }

    .feature-card li {
      padding: 10px 0;
      color: rgba(255, 255, 255, 0.9);
      position: relative;
      padding-left: 28px;
      font-size: 15px;
      line-height: 1.5;
    }

    .feature-card li:before {
      content: '✨';
      position: absolute;
      left: 0;
      color: #FFD700;
      font-weight: bold;
      font-size: 16px;
    }

    .how-it-works {
      padding: 80px 20px;
      background: rgba(255, 255, 255, 0.05);
    }

    .process-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 40px;
      margin-top: 60px;
    }

    .process-step {
      text-align: center;
      position: relative;
    }

    .step-number {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      background: #FFD700;
      color: #2c3e50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      z-index: 2;
    }

    .step-icon {
      font-size: 48px;
      margin: 30px 0 20px;
    }

    .process-step h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: white;
    }

    .process-step p {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
    }

    .cta {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 80px 20px;
      text-align: center;
    }

    .cta h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .cta > p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 50px;
    }

    .profile-selection {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      max-width: 600px;
      margin: 0 auto 40px;
    }

    .profile-option {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 30px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .profile-option:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-5px);
    }

    .profile-option.selected {
      background: rgba(255, 255, 255, 0.2);
      border-color: #FFD700;
      transform: translateY(-5px);
    }

    .profile-option .profile-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .profile-option h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .profile-option p {
      opacity: 0.8;
      font-size: 16px;
    }

    .btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #2c3e50;
      position: relative;
      overflow: hidden;
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #FFA500, #FFD700);
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(255, 215, 0, 0.4);
    }

    .btn-primary:hover:not(:disabled)::before {
      left: 100%;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .btn-large {
      padding: 16px 48px;
      font-size: 18px;
    }

    .footer {
      background: rgba(0, 0, 0, 0.2);
      padding: 60px 20px 20px;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .footer-section h4 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
    }

    .footer-section li {
      margin-bottom: 8px;
    }

    .footer-section a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-section a:hover {
      color: white;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      text-align: center;
      opacity: 0.6;
    }

    @media (max-width: 768px) {
      .nav {
        flex-direction: column;
        gap: 20px;
        padding: 0 15px;
      }

      .nav-links {
        gap: 15px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .hero {
        grid-template-columns: 1fr;
        text-align: center;
        padding: 140px 15px 60px;
        gap: 40px;
      }

      .hero h1 {
        font-size: 32px;
        line-height: 1.3;
      }

      .hero-stats {
        justify-content: center;
        gap: 20px;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }

      .process-grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }

      .profile-selection {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 30px;
      }

      .container {
        padding: 0 15px;
      }
    }
  `]
})
export class LandingComponent {
  selectedProfile = signal<string | null>(null);

  constructor(private router: Router) {}

  selectProfile(profile: string) {
    this.selectedProfile.set(profile);
  }

  startRegistration() {
    if (this.selectedProfile()) {
      this.router.navigate(['/register'], { 
        queryParams: { profile: this.selectedProfile() } 
      });
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}