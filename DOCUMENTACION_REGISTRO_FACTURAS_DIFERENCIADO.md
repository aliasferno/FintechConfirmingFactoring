# Registro Diferenciado de Facturas: Factoring vs Confirming

## Índice
1. [Introducción](#introducción)
2. [Análisis de Diferencias Clave](#análisis-de-diferencias-clave)
3. [Registro de Facturas para Factoring](#registro-de-facturas-para-factoring)
4. [Registro de Facturas para Confirming](#registro-de-facturas-para-confirming)
5. [Comparación de Procesos](#comparación-de-procesos)
6. [Implementación Técnica](#implementación-técnica)
7. [Validaciones y Controles](#validaciones-y-controles)
8. [Casos de Uso Prácticos](#casos-de-uso-prácticos)

## Documentación Relacionada
- **[Reglas de Validación de Facturas](./REGLAS_VALIDACION_FACTURAS.md)** - Documentación detallada de todas las reglas de validación implementadas en el sistema

## Introducción

Este documento define los procesos diferenciados de registro de facturas según el tipo de operación financiera (factoring o confirming) que realizará la empresa o PYME. Cada proceso tiene características específicas que reflejan la naturaleza y objetivos de cada instrumento financiero.

## Análisis de Diferencias Clave

### Perspectiva del Negocio

| Aspecto | Factoring | Confirming |
|---------|-----------|------------|
| **Dirección del Flujo** | Cuentas por Cobrar → Liquidez | Cuentas por Pagar → Gestión |
| **Iniciativa** | Empresa busca liquidez | Empresa optimiza pagos |
| **Beneficiario Principal** | La empresa registrante | Los proveedores |
| **Urgencia** | Alta (necesidad de efectivo) | Media (optimización) |
| **Riesgo Principal** | Impago del cliente | Cumplimiento del proveedor |

### Impacto en el Registro

Estas diferencias conceptuales se traducen en:
- **Campos requeridos diferentes**
- **Flujos de validación específicos**
- **Documentación complementaria distinta**
- **Procesos de aprobación diferenciados**
- **Métricas y seguimiento particulares**

## Registro de Facturas para Factoring

### Objetivo del Proceso
Registrar facturas emitidas por la empresa a sus clientes para obtener liquidez inmediata mediante su cesión a una entidad financiera.

### Flujo de Registro

```
1. Selección de Tipo → "Factoring"
2. Información Básica de la Factura
3. Datos del Cliente Deudor (Crítico)
4. Evaluación de Elegibilidad
5. Documentación de Respaldo
6. Configuración de Adelanto
7. Términos y Condiciones
8. Envío para Evaluación
```

### Campos Específicos para Factoring

#### 1. Información Básica
- **Número de Factura**: Identificador único
- **Fecha de Emisión**: Fecha original de la factura
- **Fecha de Vencimiento**: Plazo original de pago
- **Monto Total**: Valor nominal de la factura
- **Moneda**: Divisa de la operación
- **Tipo de Factura**: Producto, servicio, mixta

#### 2. Datos del Cliente Deudor (Críticos)
- **Razón Social Completa**: Nombre legal del cliente
- **Identificación Fiscal**: RUC, NIT, o equivalente
- **Sector Económico**: Clasificación CIIU
- **Historial Crediticio**: Calificación si está disponible
- **Relación Comercial**: Tiempo como cliente
- **Volumen de Negocio**: Facturación anual aproximada
- **Referencias Comerciales**: Otros proveedores

#### 3. Información de la Operación
- **Descripción Detallada**: Bienes o servicios facturados
- **Términos de Pago Originales**: Condiciones acordadas
- **Garantías Asociadas**: Si las hubiera
- **Contratos de Respaldo**: Órdenes de compra, contratos

#### 4. Configuración del Factoring
- **Tipo de Factoring Solicitado**: Con/sin recurso
- **Porcentaje de Adelanto Deseado**: 70-90%
- **Plazo Máximo de Gestión**: Días para cobro
- **Comisiones Aceptables**: Rango de tasas

#### 5. Documentación Requerida
- ✅ **Factura Original** (PDF/imagen)
- ✅ **Orden de Compra** o contrato
- ✅ **Comprobante de Entrega** (guía, acta)
- ✅ **Estados Financieros del Cliente** (si disponible)
- ✅ **Historial de Pagos** del cliente
- ⚠️ **Autorizaciones Especiales** (si aplica)

### Validaciones Específicas para Factoring

#### Validaciones Automáticas
- **Duplicidad**: Verificar que la factura no esté ya registrada
- **Vencimiento**: Plazo mínimo de 30 días restantes
- **Monto Mínimo**: Valor mínimo para factoring
- **Cliente Válido**: Verificación en listas negras
- **Formato de Documentos**: Legibilidad y completitud

#### Validaciones Manuales
- **Evaluación Crediticia**: Análisis del cliente deudor
- **Autenticidad**: Verificación de documentos
- **Viabilidad Comercial**: Análisis de la operación
- **Riesgo Sectorial**: Evaluación del sector del cliente

### Estados del Proceso
1. **Borrador**: En proceso de registro
2. **Pendiente Documentos**: Falta documentación
3. **En Evaluación**: Análisis crediticio en curso
4. **Pre-aprobada**: Evaluación positiva inicial
5. **Aprobada**: Lista para factoring
6. **Rechazada**: No cumple criterios
7. **En Factoring**: Proceso activo
8. **Liquidada**: Proceso completado

## Registro de Facturas para Confirming

### Objetivo del Proceso
Registrar facturas recibidas de proveedores para gestionar su pago a través de una entidad financiera, ofreciendo a los proveedores la opción de cobro anticipado.

### Flujo de Registro

```
1. Selección de Tipo → "Confirming"
2. Información Básica de la Factura
3. Datos del Proveedor (Beneficiario)
4. Validación de la Obligación
5. Configuración de Pago
6. Documentación de Soporte
7. Autorización Interna
8. Envío al Sistema de Confirming
```

### Campos Específicos para Confirming

#### 1. Información Básica
- **Número de Factura del Proveedor**: Identificador del proveedor
- **Fecha de Recepción**: Cuándo se recibió la factura
- **Fecha de Vencimiento Original**: Plazo acordado con proveedor
- **Monto a Pagar**: Valor neto a pagar
- **Moneda**: Divisa de la operación
- **Centro de Costo**: Área que generó la obligación

#### 2. Datos del Proveedor (Beneficiario)
- **Razón Social**: Nombre legal del proveedor
- **Identificación Fiscal**: RUC, NIT, o equivalente
- **Datos Bancarios**: Cuenta para pagos
- **Clasificación**: Proveedor estratégico, regular, ocasional
- **Historial de Cumplimiento**: Calidad de entregas
- **Volumen de Compras**: Facturación anual
- **Términos Comerciales**: Condiciones habituales

#### 3. Información de la Obligación
- **Descripción de Bienes/Servicios**: Qué se recibió
- **Orden de Compra Asociada**: Referencia interna
- **Conformidad de Recepción**: Validación de entrega
- **Retenciones Aplicables**: Impuestos a retener
- **Descuentos Comerciales**: Si los hubiera

#### 4. Configuración del Confirming
- **Fecha de Pago Programada**: Cuándo se pagará
- **Autorización de Anticipo**: Si el proveedor puede cobrar antes
- **Límite de Descuento**: Máximo descuento por anticipo
- **Notificación al Proveedor**: Automática o manual

#### 5. Documentación Requerida
- ✅ **Factura del Proveedor** (original)
- ✅ **Orden de Compra** o contrato
- ✅ **Acta de Conformidad** o recepción
- ✅ **Autorización de Pago** (si requerida)
- ⚠️ **Documentos Adicionales** (certificados, garantías)

### Validaciones Específicas para Confirming

#### Validaciones Automáticas
- **Orden de Compra**: Existencia y vigencia
- **Presupuesto**: Disponibilidad de fondos
- **Duplicidad**: Evitar pagos duplicados
- **Proveedor Activo**: Estado en el sistema
- **Límites de Pago**: Montos autorizados

#### Validaciones Manuales
- **Conformidad**: Verificación de entrega
- **Autorización**: Aprobación del área solicitante
- **Documentación**: Completitud y validez
- **Términos Comerciales**: Cumplimiento de condiciones

### Estados del Proceso
1. **Borrador**: En proceso de registro
2. **Pendiente Conformidad**: Falta validación de recepción
3. **Pendiente Autorización**: Requiere aprobación
4. **Autorizada**: Lista para confirming
5. **En Confirming**: Notificada al banco
6. **Notificada al Proveedor**: Proveedor informado
7. **Anticipada**: Proveedor cobró anticipadamente
8. **Pagada**: Proceso completado

## Comparación de Procesos

### Tabla Comparativa Detallada

| Aspecto | Factoring | Confirming |
|---------|-----------|------------|
| **Tipo de Factura** | Emitida por la empresa | Recibida de proveedores |
| **Enfoque Principal** | Evaluación del cliente deudor | Validación de la obligación |
| **Documentación Crítica** | Comprobantes de entrega | Actas de conformidad |
| **Validación Principal** | Capacidad de pago del cliente | Legitimidad de la obligación |
| **Urgencia del Proceso** | Alta (necesidad de liquidez) | Media (optimización) |
| **Complejidad de Evaluación** | Alta (riesgo crediticio) | Media (validación interna) |
| **Tiempo de Procesamiento** | 2-5 días hábiles | 1-3 días hábiles |
| **Documentos Adicionales** | Referencias comerciales | Autorizaciones internas |
| **Seguimiento Post-Registro** | Gestión de cobro | Notificación a proveedores |

### Flujos de Trabajo Diferenciados

#### Factoring: Flujo Orientado al Riesgo
```
Registro → Evaluación Crediticia → Análisis de Documentos → 
Aprobación/Rechazo → Configuración de Adelanto → Activación
```

#### Confirming: Flujo Orientado a la Validación
```
Registro → Validación de Obligación → Autorización Interna → 
Configuración de Pago → Notificación → Activación
```

## Implementación Técnica

### Estructura de Base de Datos

#### Tabla Principal: `invoices`
```sql
CREATE TABLE invoices (
    id BIGINT PRIMARY KEY,
    operation_type ENUM('factoring', 'confirming'),
    invoice_number VARCHAR(100),
    issue_date DATE,
    due_date DATE,
    amount DECIMAL(15,2),
    currency VARCHAR(3),
    status VARCHAR(50),
    -- Campos específicos de factoring
    client_id BIGINT NULL, -- Para factoring
    advance_percentage DECIMAL(5,2) NULL,
    factoring_type ENUM('with_recourse', 'without_recourse') NULL,
    -- Campos específicos de confirming
    supplier_id BIGINT NULL, -- Para confirming
    purchase_order_id BIGINT NULL,
    payment_date DATE NULL,
    early_payment_allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Tablas Relacionadas
```sql
-- Para factoring
CREATE TABLE factoring_details (
    invoice_id BIGINT,
    credit_evaluation JSON,
    commercial_references JSON,
    risk_score DECIMAL(3,2),
    approval_date TIMESTAMP
);

-- Para confirming
CREATE TABLE confirming_details (
    invoice_id BIGINT,
    conformity_date TIMESTAMP,
    authorized_by BIGINT,
    supplier_notified BOOLEAN,
    early_payment_date TIMESTAMP NULL
);
```

### Componentes de Frontend

#### Selector de Tipo de Operación
```typescript
// Componente inicial para seleccionar tipo
export class InvoiceTypeSelector {
  operationType: 'factoring' | 'confirming' | null = null;
  
  selectOperationType(type: 'factoring' | 'confirming') {
    this.operationType = type;
    this.router.navigate(['/invoices/register', type]);
  }
}
```

#### Formularios Diferenciados
```typescript
// Factoring Form
export class FactoringInvoiceForm {
  factoringForm = this.fb.group({
    // Campos básicos
    invoiceNumber: ['', Validators.required],
    issueDate: ['', Validators.required],
    dueDate: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1000)]],
    
    // Campos específicos de factoring
    clientId: ['', Validators.required],
    factoringType: ['', Validators.required],
    advancePercentage: [80, [Validators.min(70), Validators.max(90)]],
    
    // Documentación
    invoiceDocument: ['', Validators.required],
    deliveryProof: ['', Validators.required],
    purchaseOrder: [''],
  });
}

// Confirming Form
export class ConfirmingInvoiceForm {
  confirmingForm = this.fb.group({
    // Campos básicos
    supplierInvoiceNumber: ['', Validators.required],
    receptionDate: ['', Validators.required],
    dueDate: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]],
    
    // Campos específicos de confirming
    supplierId: ['', Validators.required],
    purchaseOrderId: ['', Validators.required],
    paymentDate: ['', Validators.required],
    earlyPaymentAllowed: [true],
    
    // Validación
    conformityDate: ['', Validators.required],
    authorizedBy: ['', Validators.required],
  });
}
```

### API Endpoints Diferenciados

```typescript
// Rutas específicas
POST /api/invoices/factoring
POST /api/invoices/confirming
GET /api/invoices/factoring/{id}
GET /api/invoices/confirming/{id}
PUT /api/invoices/factoring/{id}
PUT /api/invoices/confirming/{id}

// Endpoints de validación
POST /api/invoices/factoring/validate-client
POST /api/invoices/confirming/validate-supplier
POST /api/invoices/factoring/credit-evaluation
POST /api/invoices/confirming/conformity-check
```

## Validaciones y Controles

> **📋 Documentación Detallada de Validaciones**
> 
> Para información completa y actualizada sobre las reglas de validación implementadas en el sistema, consulte el documento específico:
> **[REGLAS_VALIDACION_FACTURAS.md](./REGLAS_VALIDACION_FACTURAS.md)**
> 
> Este documento incluye:
> - Reglas de validación detalladas para factoring y confirming
> - Ejemplos prácticos con casos válidos e inválidos
> - Códigos de error y mensajes específicos
> - Validaciones de archivos y formatos permitidos

### Reglas de Negocio por Tipo

#### Factoring
```typescript
class FactoringValidationRules {
  static validateForFactoring(invoice: FactoringInvoice): ValidationResult {
    const errors: string[] = [];
    
    // Validaciones específicas
    if (invoice.dueDate <= new Date()) {
      errors.push('La factura debe tener al menos 30 días de vencimiento');
    }
    
    if (invoice.amount < 1000) {
      errors.push('El monto mínimo para factoring es $1,000');
    }
    
    if (!invoice.clientCreditScore || invoice.clientCreditScore < 600) {
      errors.push('El cliente debe tener un score crediticio mínimo de 600');
    }
    
    if (!invoice.deliveryProof) {
      errors.push('Es obligatorio el comprobante de entrega para factoring');
    }
    
    return { isValid: errors.length === 0, errors };
  }
}
```

#### Confirming
```typescript
class ConfirmingValidationRules {
  static validateForConfirming(invoice: ConfirmingInvoice): ValidationResult {
    const errors: string[] = [];
    
    // Validaciones específicas
    if (!invoice.purchaseOrderId) {
      errors.push('Es obligatoria la orden de compra para confirming');
    }
    
    if (!invoice.conformityDate) {
      errors.push('Debe registrarse la fecha de conformidad');
    }
    
    if (!invoice.authorizedBy) {
      errors.push('Requiere autorización del área solicitante');
    }
    
    if (invoice.paymentDate < invoice.receptionDate) {
      errors.push('La fecha de pago no puede ser anterior a la recepción');
    }
    
    return { isValid: errors.length === 0, errors };
  }
}
```

### Controles de Seguridad

#### Permisos Diferenciados
```typescript
// Permisos para factoring
const FACTORING_PERMISSIONS = {
  CREATE: 'factoring.create',
  EVALUATE: 'factoring.evaluate',
  APPROVE: 'factoring.approve',
  MANAGE: 'factoring.manage'
};

// Permisos para confirming
const CONFIRMING_PERMISSIONS = {
  CREATE: 'confirming.create',
  AUTHORIZE: 'confirming.authorize',
  NOTIFY: 'confirming.notify',
  MANAGE: 'confirming.manage'
};
```

## Casos de Uso Prácticos

### Escenario 1: PYME Manufacturera - Factoring

**Situación**: Una PYME que fabrica componentes automotrices necesita liquidez para comprar materia prima.

**Proceso de Registro**:
1. **Selecciona "Factoring"** en el sistema
2. **Registra factura** emitida a empresa automotriz grande
3. **Proporciona datos del cliente**: Ford Colombia S.A.
4. **Adjunta documentación**: 
   - Factura por $50,000 USD
   - Orden de compra de Ford
   - Guía de despacho firmada
   - Contrato marco de suministro
5. **Configura adelanto**: Solicita 85% de adelanto
6. **Sistema evalúa**: Score crediticio de Ford (AAA)
7. **Aprobación automática**: Por ser cliente de bajo riesgo
8. **Recibe liquidez**: $42,500 USD en 24 horas

### Escenario 2: Empresa de Servicios - Confirming

**Situación**: Una empresa de consultoría quiere optimizar pagos a proveedores de tecnología.

**Proceso de Registro**:
1. **Selecciona "Confirming"** en el sistema
2. **Registra factura recibida** de proveedor de software
3. **Datos del proveedor**: Microsoft Colombia
4. **Adjunta documentación**:
   - Factura por licencias Office 365: $15,000 USD
   - Orden de compra interna
   - Acta de conformidad del área de TI
5. **Configura pago**: Fecha programada en 60 días
6. **Autorización**: Gerente de TI aprueba
7. **Notificación**: Microsoft recibe opción de cobro anticipado
8. **Microsoft decide**: Cobra anticipadamente con 2% de descuento
9. **Empresa paga**: Al banco en 60 días como programado

### Escenario 3: Uso Combinado

**Situación**: Empresa comercializadora que usa ambos instrumentos.

**Factoring** (Lado de Ventas):
- Registra facturas de ventas a grandes retailers
- Obtiene liquidez inmediata para capital de trabajo
- Mejora rotación de cartera

**Confirming** (Lado de Compras):
- Registra facturas de proveedores internacionales
- Optimiza flujo de pagos
- Ofrece beneficios a proveedores estratégicos

**Resultado**: Triangulación financiera perfecta

## Métricas y Seguimiento

### KPIs por Tipo de Operación

#### Factoring
- **Tiempo de Aprobación**: Promedio de horas desde registro hasta aprobación
- **Tasa de Aprobación**: Porcentaje de facturas aprobadas vs registradas
- **Monto Promedio**: Valor promedio de facturas en factoring
- **Score Crediticio Promedio**: Calidad de clientes deudores
- **Tiempo de Cobro**: Días promedio para cobrar facturas
- **Tasa de Impago**: Porcentaje de facturas no cobradas

#### Confirming
- **Tiempo de Procesamiento**: Horas desde registro hasta notificación
- **Tasa de Autorización**: Porcentaje de facturas autorizadas
- **Adopción de Anticipo**: Porcentaje de proveedores que usan anticipo
- **Ahorro en Descuentos**: Beneficios obtenidos por proveedores
- **Satisfacción del Proveedor**: Medición de experiencia
- **Eficiencia Administrativa**: Reducción en tiempo de gestión

### Dashboard Diferenciado

```typescript
// Métricas específicas por tipo
interface FactoringMetrics {
  totalInvoicesRegistered: number;
  totalAmountInFactoring: number;
  averageApprovalTime: number;
  approvalRate: number;
  averageCreditScore: number;
  pendingCollections: number;
}

interface ConfirmingMetrics {
  totalInvoicesRegistered: number;
  totalAmountInConfirming: number;
  averageProcessingTime: number;
  authorizationRate: number;
  earlyPaymentRate: number;
  supplierSatisfactionScore: number;
}
```

## Conclusiones

La diferenciación en el registro de facturas entre factoring y confirming es fundamental para:

1. **Optimizar Procesos**: Cada flujo está diseñado para las necesidades específicas
2. **Mejorar Experiencia**: Interfaces adaptadas al contexto de uso
3. **Reducir Errores**: Validaciones específicas para cada tipo
4. **Acelerar Aprobaciones**: Criterios claros y diferenciados
5. **Facilitar Seguimiento**: Métricas relevantes para cada operación

Esta aproximación diferenciada permite a las empresas y PYMEs aprovechar al máximo ambos instrumentos financieros según sus necesidades específicas de flujo de caja y gestión de relaciones comerciales.

---

**Última actualización**: Enero 2025  
**Versión**: 1.0  
**Responsable**: Equipo de Desarrollo Fintech