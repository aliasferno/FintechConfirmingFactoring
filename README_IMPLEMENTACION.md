# Fintech Confirming & Factoring - Sistema de Registro de Empresas

## 🚀 Descripción del Proyecto

Plataforma fintech completa que permite a las empresas registrarse y acceder a servicios de confirming y factoring. Implementado con Laravel (backend) y Angular (frontend).

## 📋 Características Principales

- ✅ **Registro de Empresas**: Sistema completo de onboarding corporativo
- ✅ **Autenticación JWT**: Seguridad robusta con tokens
- ✅ **Validaciones Avanzadas**: Frontend y backend sincronizados
- ✅ **Interfaz Moderna**: UI/UX optimizada con Angular
- ✅ **API RESTful**: Backend escalable con Laravel
- ✅ **Base de Datos**: SQLite para desarrollo, fácil migración a producción

## 🛠️ Stack Tecnológico

### Backend
- **Laravel 11** - Framework PHP
- **SQLite** - Base de datos
- **Sanctum** - Autenticación API
- **Eloquent ORM** - Mapeo objeto-relacional

### Frontend
- **Angular 18** - Framework TypeScript
- **Angular Signals** - Gestión de estado reactiva
- **Reactive Forms** - Formularios dinámicos
- **HttpClient** - Comunicación HTTP

## 📁 Estructura del Proyecto

```
FintechConfirmingFactoring/
├── backend/                 # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/
│   │   └── Models/
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/               # Aplicación Angular
│   └── src/app/
│       ├── services/
│       ├── register.component.*
│       └── landing.component.*
└── DOCUMENTACION_REGISTRO_EMPRESAS.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- PHP 8.2+
- Composer
- Node.js 18+
- npm

### Backend (Laravel)

```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
composer install

# Copiar archivo de configuración
cp .env.example .env

# Generar clave de aplicación
php artisan key:generate

# Ejecutar migraciones
php artisan migrate

# Iniciar servidor de desarrollo
php artisan serve --host=127.0.0.1 --port=8000
```

### Frontend (Angular)

```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:4200/
- **Backend API**: http://127.0.0.1:8000/api/
- **Documentación API**: http://127.0.0.1:8000/api/documentation (si está configurada)

## 📊 Endpoints Principales

### Autenticación
- `POST /api/register` - Registro de usuario
- `POST /api/login` - Inicio de sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/user` - Perfil de usuario

### Empresas
- `POST /api/companies` - Crear empresa
- `GET /api/companies` - Listar empresas
- `GET /api/companies/{id}` - Obtener empresa
- `PUT /api/companies/{id}` - Actualizar empresa
- `DELETE /api/companies/{id}` - Eliminar empresa

## 🧪 Pruebas

### Datos de Prueba

**Usuario de Ejemplo:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "phone": "+34123456789",
  "password": "password123"
}
```

**Empresa de Ejemplo:**
```json
{
  "company_name": "Empresa Ejemplo S.L.",
  "tax_id": "B12345678",
  "company_address": "Calle Principal 123, Madrid",
  "business_type": "Tecnología e Informática",
  "monthly_revenue": 50000,
  "years_in_business": 5
}
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno (Backend)

```env
APP_NAME="Fintech Confirming Factoring"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite

SANCTUM_STATEFUL_DOMAINS=localhost:4200
```

### Configuración CORS

El backend está configurado para aceptar requests desde `http://localhost:4200` durante el desarrollo.

## 📝 Flujo de Usuario

1. **Landing Page** → Selección de perfil (Empresa/Inversor)
2. **Registro** → Formulario de datos personales y corporativos
3. **Validación** → Verificación en tiempo real
4. **Confirmación** → Creación de cuenta y empresa
5. **Dashboard** → Acceso a la plataforma (próximamente)

## 🐛 Solución de Problemas

### Errores Comunes

**Error de CORS:**
```bash
# Verificar configuración en config/cors.php
# Asegurar que localhost:4200 esté en allowed_origins
```

**Error de Base de Datos:**
```bash
# Verificar que el archivo SQLite existe
touch database/database.sqlite
php artisan migrate
```

**Error de Dependencias:**
```bash
# Backend
composer install
composer dump-autoload

# Frontend
npm install
npm audit fix
```

## 📚 Documentación Adicional

- [Documentación Completa](./DOCUMENTACION_REGISTRO_EMPRESAS.md)
- [Laravel Documentation](https://laravel.com/docs)
- [Angular Documentation](https://angular.io/docs)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es parte de un proyecto integrador académico.

## 👥 Equipo de Desarrollo

- **Backend**: Laravel + SQLite + Sanctum
- **Frontend**: Angular + TypeScript + Reactive Forms
- **Integración**: RESTful API + JWT Authentication

---

**Estado del Proyecto**: ✅ Funcional - Sistema de registro completamente implementado

**Última Actualización**: Enero 2025