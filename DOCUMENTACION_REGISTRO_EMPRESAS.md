# Documentación - Sistema de Registro de Empresas

## Resumen del Proyecto

Este documento detalla la implementación completa del sistema de registro de empresas para la plataforma Fintech de Confirming y Factoring. El sistema permite a las empresas registrarse en la plataforma proporcionando información corporativa detallada y creando cuentas de usuario asociadas.

## Arquitectura del Sistema

### Backend (Laravel)
- **Framework**: Laravel 11
- **Base de Datos**: SQLite
- **Autenticación**: Laravel Sanctum (JWT)
- **Arquitectura**: MVC (Model-View-Controller)
- **Puerto**: 8000

### Frontend (Angular)
- **Framework**: Angular 18
- **Gestión de Estado**: Signals
- **HTTP Client**: Angular HttpClient
- **Formularios**: Reactive Forms
- **Puerto**: 4200

## Estructura de Archivos Implementados

### Backend Laravel

#### Modelos
- `app/Models/User.php` - Modelo de usuario con autenticación Sanctum
- `app/Models/Company.php` - Modelo de empresa con relaciones

#### Controladores
- `app/Http/Controllers/AuthController.php` - Manejo de autenticación (registro, login, logout)
- `app/Http/Controllers/CompanyController.php` - CRUD de empresas

#### Migraciones
- `database/migrations/create_users_table.php` - Tabla de usuarios
- `database/migrations/create_companies_table.php` - Tabla de empresas

#### Rutas API
- `routes/api.php` - Definición de endpoints REST

### Frontend Angular

#### Servicios
- `src/app/services/auth.service.ts` - Servicio de autenticación
- `src/app/services/company.service.ts` - Servicio de gestión de empresas

#### Componentes
- `src/app/register.component.ts` - Lógica del componente de registro
- `src/app/register.component.html` - Template del formulario de registro
- `src/app/register.component.css` - Estilos del componente
- `src/app/landing.component.ts` - Selección de perfil (empresa/inversor)

#### Configuración
- `src/app/app.config.ts` - Configuración de HttpClient
- `src/app/app.routes.ts` - Rutas de la aplicación

## Funcionalidades Implementadas

### 1. Registro de Usuarios
- Validación de email único
- Encriptación de contraseñas
- Generación de tokens JWT
- Validación de campos obligatorios

### 2. Registro de Empresas
- Información corporativa completa
- Validación de Tax ID único
- Categorización por tipo de negocio
- Asociación con usuario propietario

### 3. Autenticación
- Login con email y contraseña
- Gestión de tokens JWT
- Middleware de autenticación
- Logout seguro

### 4. Validaciones
- **Frontend**: Validaciones reactivas en tiempo real
- **Backend**: Validaciones de servidor con Laravel Request
- **Base de Datos**: Constraints de integridad

## Endpoints API Implementados

### Autenticación
```
POST /api/register - Registro de usuario
POST /api/login - Inicio de sesión
POST /api/logout - Cerrar sesión
GET /api/user - Obtener perfil de usuario
```

### Empresas
```
POST /api/companies - Crear empresa
GET /api/companies - Listar empresas del usuario
GET /api/companies/{id} - Obtener empresa específica
PUT /api/companies/{id} - Actualizar empresa
DELETE /api/companies/{id} - Eliminar empresa
GET /api/companies/validate-tax-id/{taxId} - Validar Tax ID
GET /api/companies/stats - Estadísticas de empresas
```

## Modelos de Datos

### Usuario (User)
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}
```

### Empresa (Company)
```typescript
interface Company {
  id: number;
  user_id: number;
  company_name: string;
  tax_id: string;
  company_address: string;
  business_type: string;
  monthly_revenue: number;
  years_in_business?: number;
  created_at: string;
  updated_at: string;
}
```

## Tipos de Negocio Soportados

1. Agricultura y Ganadería
2. Minería y Extracción
3. Manufactura y Producción
4. Construcción e Inmobiliaria
5. Comercio al Por Mayor
6. Comercio al Por Menor
7. Transporte y Logística
8. Tecnología e Informática
9. Servicios Financieros
10. Servicios Profesionales
11. Educación y Capacitación
12. Salud y Servicios Médicos
13. Turismo y Hospitalidad
14. Entretenimiento y Medios
15. Energía y Servicios Públicos
16. Otros Servicios

## Flujo de Registro

### Paso 1: Selección de Perfil
1. Usuario accede a la landing page
2. Selecciona perfil "Empresa"
3. Redirección a formulario de registro

### Paso 2: Registro de Usuario
1. Completar datos personales (nombre, email, teléfono, contraseña)
2. Validación en tiempo real
3. Verificación de email único

### Paso 3: Registro de Empresa
1. Completar información corporativa
2. Validación de Tax ID único
3. Selección de tipo de negocio
4. Especificación de ingresos mensuales

### Paso 4: Confirmación
1. Envío de datos al backend
2. Creación de usuario y empresa
3. Generación de token de autenticación
4. Redirección al dashboard

## Manejo de Errores

### Frontend
- Validaciones de formulario en tiempo real
- Mensajes de error específicos por campo
- Notificaciones de éxito/error globales
- Manejo de errores de red

### Backend
- Validación de datos de entrada
- Respuestas HTTP apropiadas
- Mensajes de error descriptivos
- Logging de errores

## Seguridad Implementada

1. **Autenticación JWT**: Tokens seguros para sesiones
2. **Encriptación de Contraseñas**: Hash bcrypt
3. **Validación de Entrada**: Sanitización de datos
4. **CORS**: Configuración para desarrollo
5. **Middleware de Autenticación**: Protección de rutas

## Configuración de Desarrollo

### Backend
```bash
# Instalar dependencias
composer install

# Configurar base de datos
php artisan migrate

# Iniciar servidor
php artisan serve --host=127.0.0.1 --port=8000
```

### Frontend
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

## URLs de Acceso

- **Frontend**: http://localhost:4200/
- **Backend API**: http://127.0.0.1:8000/api/
- **Registro**: http://localhost:4200/register

## Pruebas Realizadas

### Funcionalidades Probadas
✅ Registro de usuario con validaciones
✅ Registro de empresa con datos completos
✅ Autenticación JWT
✅ Validación de Tax ID único
✅ Manejo de errores de formulario
✅ Integración frontend-backend
✅ Navegación entre componentes

### Casos de Prueba
1. **Registro Exitoso**: Usuario y empresa creados correctamente
2. **Email Duplicado**: Error manejado apropiadamente
3. **Tax ID Duplicado**: Validación funcionando
4. **Campos Obligatorios**: Validaciones activas
5. **Contraseñas No Coinciden**: Validación en tiempo real

## Próximos Pasos Sugeridos

1. **Dashboard de Empresa**: Interfaz post-registro
2. **Verificación de Email**: Proceso de confirmación
3. **Recuperación de Contraseña**: Sistema de reset
4. **Perfil de Empresa**: Edición de información
5. **Documentos Corporativos**: Subida de archivos
6. **Notificaciones**: Sistema de alertas
7. **Auditoría**: Logs de actividad
8. **Testing**: Pruebas unitarias y de integración

## Conclusión

El sistema de registro de empresas ha sido implementado exitosamente con una arquitectura robusta que separa claramente las responsabilidades entre frontend y backend. La integración entre Angular y Laravel proporciona una experiencia de usuario fluida mientras mantiene la seguridad y validación de datos en todos los niveles.

La implementación actual sirve como base sólida para futuras expansiones del sistema, con patrones de código consistentes y una estructura escalable.