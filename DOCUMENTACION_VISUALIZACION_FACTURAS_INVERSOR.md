# Documentación: Visualización de Facturas en el Perfil de Inversor

## Índice
1. [Introducción](#introducción)
2. [Flujo Completo de Visualización](#flujo-completo-de-visualización)
3. [Estados de las Facturas](#estados-de-las-facturas)
4. [Criterios de Filtrado](#criterios-de-filtrado)
5. [API de Oportunidades de Inversión](#api-de-oportunidades-de-inversión)
6. [Componente Frontend](#componente-frontend)
7. [Casos de Uso Prácticos](#casos-de-uso-prácticos)
8. [Troubleshooting](#troubleshooting)

## Introducción

Este documento describe el proceso completo de cómo las facturas creadas por las empresas se muestran como oportunidades de inversión en el perfil de los inversores. El sistema implementa un flujo de aprobación que garantiza que solo las facturas verificadas y aprobadas estén disponibles para inversión.

## Flujo Completo de Visualización

### 1. Creación de Factura por Empresa
```
Empresa → Crear Factura → Estado: "pending" → Verification Status: "pending"
```

### 2. Proceso de Aprobación
```
Admin/Sistema → Revisar Factura → Aprobar → Estado: "approved" → Verification Status: "verified"
```

### 3. Visualización para Inversores
```
Factura Aprobada → API Oportunidades → Frontend → "Explorar Oportunidades"
```

### Diagrama de Flujo
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Empresa crea  │    │  Admin/Sistema  │    │   Inversor ve   │
│     factura     │───▶│    aprueba      │───▶│  oportunidades  │
│                 │    │    factura      │    │                 │
│ Status: pending │    │Status: approved │    │ En "Explorar    │
│ Verif: pending  │    │Verif: verified  │    │ Oportunidades"  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Estados de las Facturas

### Estados Principales (`status`)
| Estado | Descripción | Visible para Inversores |
|--------|-------------|------------------------|
| `pending` | Factura creada, esperando aprobación | ❌ No |
| `approved` | Factura aprobada y disponible para inversión | ✅ Sí |
| `funded` | Factura ya financiada por un inversor | ❌ No |
| `paid` | Factura pagada completamente | ❌ No |
| `rejected` | Factura rechazada | ❌ No |
| `expired` | Factura vencida | ❌ No |

### Estados de Verificación (`verification_status`)
| Estado | Descripción | Impacto |
|--------|-------------|---------|
| `pending` | Esperando verificación | No visible para inversores |
| `verified` | Verificada y aprobada | Visible para inversores |
| `rejected` | Rechazada en verificación | No visible para inversores |

### Condiciones para Visibilidad
Una factura es visible para inversores **SOLO** si cumple **TODAS** estas condiciones:

1. ✅ `status = 'approved'`
2. ✅ `verification_status = 'verified'`
3. ✅ `due_date > fecha_actual` (no vencida)
4. ✅ La empresa tiene `verification_status = 'verified'`

## Criterios de Filtrado

### Filtros Automáticos del Sistema
```php
// En InvestmentController::opportunities()
$query = Invoice::approved()
    ->with(['company.user'])
    ->whereHas('company', function ($q) {
        $q->where('verification_status', 'verified');
    })
    ->where('due_date', '>', now());
```

### Filtros Opcionales Disponibles
| Filtro | Parámetro | Descripción |
|--------|-----------|-------------|
| Score de Riesgo | `max_risk_score` | Máximo score de riesgo aceptable |
| Monto Mínimo | `min_amount` | Monto mínimo de la factura |
| Monto Máximo | `max_amount` | Monto máximo de la factura |
| Fecha Límite | `max_due_date` | Fecha máxima de vencimiento |

### Ejemplo de Filtros
```
GET /api/investments/opportunities?max_risk_score=70&min_amount=10000&max_amount=100000
```

## API de Oportunidades de Inversión

### Endpoint Principal
```
GET /api/investments/opportunities
```

### Headers Requeridos
```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

### Respuesta de Ejemplo
```json
{
  "data": [
    {
      "id": 1,
      "company_id": 5,
      "invoice_number": "FAC-2024-001",
      "client_name": "Cliente ABC",
      "amount": 50000.00,
      "due_date": "2024-12-31",
      "operation_type": "factoring",
      "commission_rate": 2.5000,
      "advance_percentage": 80.00,
      "risk_score": 65,
      "company": {
        "id": 5,
        "business_name": "Empresa XYZ S.A.",
        "tax_id": "12345678901"
      }
    }
  ],
  "current_page": 1,
  "last_page": 3,
  "per_page": 15,
  "total": 42
}
```

### Transformaciones de Datos
El sistema convierte automáticamente los valores monetarios a `float`:
- `amount`
- `net_amount`
- `discount_rate`
- `advance_percentage`
- `commission_rate`
- `early_payment_discount`

## Componente Frontend

### Archivo Principal
`frontend/src/app/oportunidades-inversion.component.ts`

### Funcionalidades Clave

#### 1. Carga de Oportunidades
```typescript
loadOpportunities() {
  this.isLoading.set(true);
  this.investmentService.getInvestmentOpportunities().subscribe({
    next: (allInvoices: Invoice[]) => {
      const mappedOpportunities = allInvoices.map(invoice => {
        // Mapeo de facturas a oportunidades de inversión
        return {
          id: invoice.id.toString(),
          companyName: invoice.company?.business_name || 'N/A',
          facturaNumber: invoice.invoice_number,
          amount: invoice.amount,
          interestRate: this.calculateInterestRate(invoice),
          // ... más campos
        };
      });
      this.opportunities.set(mappedOpportunities);
    }
  });
}
```

#### 2. Cálculo de Tasa de Interés
```typescript
calculateInterestRate(invoice: Invoice): number {
  if (invoice.operation_type === 'factoring' && invoice.commission_rate) {
    return parseFloat(invoice.commission_rate.toString()) / 100;
  } else if (invoice.operation_type === 'confirming' && invoice.early_payment_discount) {
    return parseFloat(invoice.early_payment_discount.toString()) / 100;
  }
  return 0;
}
```

#### 3. Filtros por Tipo de Operación
```typescript
setOperationType(type: 'all' | 'factoring' | 'confirming') {
  this.selectedOperationType.set(type);
  this.applyFilters();
}

applyFilters() {
  const filtered = this.opportunities().filter(opp => {
    if (this.selectedOperationType() === 'all') return true;
    return opp.operationType === this.selectedOperationType();
  });
  this.filteredOpportunities.set(filtered);
}
```

### Navegación
- **Ver Detalle**: `/oportunidad-detalle/{id}`
- **Crear Propuesta**: `/crear-propuesta/{id}`
- **Volver**: `/dashboard/inversor`

## Casos de Uso Prácticos

### Caso 1: Factura de Factoring Disponible
```
✅ Empresa verificada crea factura de factoring
✅ Admin aprueba la factura
✅ Factura aparece en "Explorar Oportunidades"
✅ Inversor puede crear propuesta de inversión
```

### Caso 2: Factura Pendiente de Aprobación
```
❌ Empresa crea factura (status: pending)
❌ Factura NO aparece en "Explorar Oportunidades"
❌ Inversor no puede verla hasta que sea aprobada
```

### Caso 3: Factura Vencida
```
❌ Factura aprobada pero due_date < fecha_actual
❌ Factura NO aparece en "Explorar Oportunidades"
❌ Sistema filtra automáticamente facturas vencidas
```

### Caso 4: Empresa No Verificada
```
❌ Empresa no verificada crea factura
❌ Aunque la factura sea aprobada, NO aparece
❌ La empresa debe estar verificada primero
```

## Troubleshooting

### Problema: "No veo facturas en Explorar Oportunidades"

#### Verificaciones:
1. **¿Las facturas están aprobadas?**
   ```sql
   SELECT * FROM invoices WHERE status = 'approved';
   ```

2. **¿Las empresas están verificadas?**
   ```sql
   SELECT c.*, i.* FROM companies c 
   JOIN invoices i ON c.id = i.company_id 
   WHERE c.verification_status = 'verified';
   ```

3. **¿Las facturas no han vencido?**
   ```sql
   SELECT * FROM invoices WHERE due_date > NOW();
   ```

4. **¿El usuario tiene permisos de inversor?**
   ```sql
   SELECT u.*, r.name FROM users u 
   JOIN model_has_roles mhr ON u.id = mhr.model_id 
   JOIN roles r ON mhr.role_id = r.id 
   WHERE u.id = {user_id};
   ```

### Problema: "Error 401 Unauthorized"
- Verificar token de autenticación
- Verificar que el usuario tenga rol de inversor
- Verificar que el token no haya expirado

### Problema: "Facturas no se actualizan"
- Verificar que el frontend esté llamando a la API correcta
- Revisar logs del backend para errores
- Verificar que la paginación esté funcionando

## Códigos de Estado HTTP

| Código | Descripción | Acción |
|--------|-------------|--------|
| 200 | Éxito | Facturas cargadas correctamente |
| 401 | No autorizado | Verificar autenticación |
| 403 | Prohibido | Usuario sin permisos de inversor |
| 404 | No encontrado | Endpoint incorrecto |
| 500 | Error del servidor | Revisar logs del backend |

---

**Nota**: Esta documentación está basada en el código actual del sistema y debe actualizarse si se realizan cambios en la lógica de negocio o en los endpoints de la API.