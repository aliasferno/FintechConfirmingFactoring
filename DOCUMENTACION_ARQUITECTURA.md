# Documentación de Arquitectura - FinTech Confirming & Factoring

## 🏗️ Arquitectura General

El proyecto está estructurado como una aplicación full-stack con:
- **Backend**: Laravel 11 con API REST y autenticación Sanctum
- **Frontend**: Angular 18 con TypeScript
- **Base de datos**: SQLite (desarrollo) con soporte para PostgreSQL
- **Autenticación**: Sistema de roles y permisos con Spatie Laravel Permission

## 🔧 Backend - Archivos y Clases Principales

### Controladores Core

#### `app/Http/Controllers/UserController.php`
- **Función**: Manejo de autenticación, registro y gestión de usuarios
- **Características especiales**:
  - Login con soporte para múltiples perfiles por email
  - Método `checkEmailProfiles()` para verificar perfiles disponibles
  - Autenticación diferenciada por `user_type`
  - Generación de tokens Sanctum

#### `app/Http/Controllers/InvestorController.php`
- **Función**: Gestión completa de perfiles de inversores
- **Funcionalidades**:
  - CRUD de perfiles de inversor
  - Gestión de preferencias de inversión
  - Validaciones específicas del dominio

#### `app/Http/Controllers/CompanyController.php`
- **Función**: Gestión de perfiles de empresas
- **Funcionalidades**:
  - Manejo de datos financieros empresariales
  - Validación de información corporativa
  - Gestión de documentos empresariales

#### `app/Http/Controllers/InvoiceController.php`
- **Función**: Manejo de facturas y documentos
- **Características**:
  - Upload y gestión de archivos
  - Validación de formatos de factura
  - Estados de procesamiento

#### `app/Http/Controllers/InvestmentController.php`
- **Función**: Gestión del proceso de inversiones
- **Funcionalidades**:
  - Creación y seguimiento de inversiones
  - Cálculos financieros
  - Relaciones entre inversores y empresas

### Modelos Principales

#### `app/Models/User.php`
- **Características**:
  - Modelo base con autenticación Sanctum
  - Integración con Spatie Laravel Permission
  - Relaciones polimórficas con Company e Investor
  - Campos: `name`, `email`, `user_type`, `role_id`, `verification_status`

#### `app/Models/Company.php`
- **Función**: Perfil empresarial con datos financieros
- **Relaciones**:
  - `belongsTo(User::class)`
  - `hasMany(Invoice::class)`
  - `hasMany(Investment::class)`

#### `app/Models/Investor.php`
- **Función**: Perfil de inversor
- **Características**:
  - Preferencias de inversión
  - Historial de inversiones
  - Configuraciones de riesgo

#### `app/Models/Invoice.php`
- **Función**: Gestión de facturas
- **Estados**: `pending`, `approved`, `rejected`, `funded`
- **Campos clave**: `amount`, `due_date`, `status`, `file_path`

#### `app/Models/Investment.php`
- **Función**: Registro de inversiones
- **Relaciones**: Conecta `Investor`, `Company` e `Invoice`
- **Campos**: `amount`, `expected_return`, `status`, `investment_date`

### Configuración Clave

#### `routes/api.php`
- **Rutas públicas**: `/login`, `/register`, `/check-email-profiles`
- **Rutas protegidas**: Todas bajo middleware `auth:sanctum`
- **Agrupación por funcionalidad**: user, company, investor, invoice, investment

#### `config/sanctum.php`
- **Configuración de tokens**: Sin expiración (`null`)
- **Dominios stateful**: Configurado para desarrollo local
- **Middleware**: CSRF y encriptación de cookies

#### `config/cors.php`
- **Configuración CORS**: Habilitado para comunicación frontend-backend
- **Orígenes permitidos**: `http://localhost:4200`

## 🎨 Frontend - Componentes y Servicios Principales

### Servicios Core

#### `src/app/services/auth.service.ts`
- **Funciones principales**:
  - `login()`: Autenticación con soporte para `user_type`
  - `checkEmailProfiles()`: Verificación de perfiles múltiples
  - `getAuthHeaders()`: Headers de autorización
  - `isAuthenticated()`: Verificación de estado de sesión
- **Gestión de tokens**: LocalStorage con métodos `setAuthData()` y `clearAuthData()`

#### `src/app/services/investor.service.ts`
- **Función**: API calls para funcionalidades de inversores
- **Métodos**: CRUD completo con headers de autenticación
- **Integración**: Usa `AuthService` para headers automáticos

#### `src/app/services/company.service.ts`
- **Función**: API calls para funcionalidades empresariales
- **Características**: Manejo de datos financieros y documentos

#### `src/app/services/invoice.service.ts`
- **Función**: Gestión de facturas
- **Funcionalidades**: Upload de archivos, estados de factura

#### `src/app/services/investment.service.ts`
- **Función**: Gestión de inversiones
- **Características**: Cálculos financieros, seguimiento de inversiones

### Componentes Principales

#### `src/app/login.component.ts`
- **Características especiales**:
  - **Detección automática de perfiles múltiples**
  - **Interfaz de selección de perfil** cuando hay múltiples opciones
  - **Flujo inteligente**: Un perfil → login automático, múltiples → selección manual
  - **Manejo de errores** contextual y específico

#### `src/app/register.component.ts`
- **Función**: Registro diferenciado por tipo de usuario
- **Validaciones**: Específicas por tipo (empresa/inversor)

#### `src/app/dashboard-empresa.component.ts`
- **Función**: Dashboard específico para empresas
- **Funcionalidades**: Gestión de facturas, estado financiero

#### `src/app/dashboard-inversor.component.ts`
- **Función**: Dashboard específico para inversores
- **Funcionalidades**: Oportunidades de inversión, portfolio

### Interfaces y Tipos

#### `src/app/interfaces/user.interface.ts`
- **Tipos principales**: `User`, `LoginRequest`, `AuthResponse`
- **Enums**: `UserType`, `VerificationStatus`

#### `src/app/interfaces/company.interface.ts`
- **Tipos**: `Company`, `CompanyProfile`
- **Campos financieros**: Revenue, assets, liabilities

#### `src/app/interfaces/investor.interface.ts`
- **Tipos**: `Investor`, `InvestmentPreferences`
- **Configuraciones**: Risk tolerance, investment ranges

## 🔐 Funcionalidades Implementadas

### Sistema de Autenticación Avanzado
- ✅ **Login inteligente**: Detección automática de perfiles múltiples
- ✅ **Selección de perfil**: UI elegante para múltiples cuentas
- ✅ **Tokens Sanctum**: Autenticación stateless segura
- ✅ **Roles y permisos**: Sistema granular con Spatie
- ✅ **Middleware de protección**: Rutas seguras en frontend y backend

### Gestión de Usuarios
- ✅ **Registro diferenciado**: Formularios específicos por tipo
- ✅ **Perfiles empresariales**: Datos financieros completos
- ✅ **Perfiles de inversor**: Preferencias y configuraciones
- ✅ **Verificación de email**: Sistema de confirmación
- ✅ **Manejo de roles**: Asignación automática según tipo

### Funcionalidades de Negocio
- ✅ **Gestión de facturas**: Upload, validación, estados
- ✅ **Sistema de inversiones**: Matching, cálculos, seguimiento
- ✅ **Dashboards específicos**: UI adaptada por tipo de usuario
- ✅ **API REST completa**: Endpoints documentados y validados
- ✅ **Validaciones robustas**: Frontend y backend sincronizados

## 🏛️ Arquitectura de Base de Datos

### Tablas Principales
- **users**: Usuarios base con roles
- **companies**: Perfiles empresariales
- **investors**: Perfiles de inversores
- **invoices**: Facturas y documentos
- **investments**: Registro de inversiones
- **roles**: Sistema de roles (Spatie)
- **permissions**: Permisos granulares (Spatie)

### Relaciones Clave
- `User` → `Company` (1:1)
- `User` → `Investor` (1:1)
- `Company` → `Invoice` (1:N)
- `Investment` → `Investor`, `Company`, `Invoice` (N:1)

## 🚀 Estado Actual del Proyecto

### ✅ Completado
- Arquitectura base full-stack
- Sistema de autenticación robusto
- Manejo de perfiles múltiples
- API REST completa
- Frontend responsive
- Validaciones y manejo de errores
- Dashboards funcionales

### 🔄 En Desarrollo
- Optimizaciones de rendimiento
- Tests automatizados
- Documentación de API
- Despliegue en producción

### 📋 Próximos Pasos
- Implementación de notificaciones
- Sistema de reportes avanzados
- Integración con servicios de pago
- Módulo de análisis financiero

## 🛠️ Tecnologías y Dependencias

### Backend
- **Laravel 11**: Framework PHP
- **Sanctum**: Autenticación API
- **Spatie Laravel Permission**: Roles y permisos
- **SQLite/PostgreSQL**: Base de datos
- **Composer**: Gestión de dependencias

### Frontend
- **Angular 18**: Framework TypeScript
- **RxJS**: Programación reactiva
- **Angular CLI**: Herramientas de desarrollo
- **TypeScript**: Tipado estático
- **npm**: Gestión de paquetes

### Herramientas de Desarrollo
- **Git**: Control de versiones
- **VS Code**: Editor recomendado
- **Postman**: Testing de API
- **Angular DevTools**: Debugging

---

**Última actualización**: Agosto 2025  
**Versión del proyecto**: 1.0.0  
**Estado**: Funcional y estable