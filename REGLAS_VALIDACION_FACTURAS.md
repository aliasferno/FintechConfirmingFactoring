# Reglas de Validación para Creación de Facturas

## Índice
1. [Introducción](#introducción)
2. [Reglas Generales](#reglas-generales)
3. [Reglas Específicas para Factoring](#reglas-específicas-para-factoring)
4. [Reglas Específicas para Confirming](#reglas-específicas-para-confirming)
5. [Validaciones de Archivos](#validaciones-de-archivos)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Códigos de Error](#códigos-de-error)

## Introducción

Este documento define las reglas de validación implementadas en el sistema para la creación de facturas, diferenciando entre operaciones de **Factoring** y **Confirming**. Estas reglas garantizan la integridad de los datos y el cumplimiento de los requisitos del negocio.

## Reglas Generales

Estas reglas aplican para **todos** los tipos de facturas, independientemente del tipo de operación:

### Campos Obligatorios Básicos

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `invoice_number` | String | Requerido, máximo 255 caracteres, único | Número único de la factura |
| `client_name` | String | Requerido, máximo 255 caracteres | Nombre del cliente |
| `client_tax_id` | String | Requerido, máximo 255 caracteres | Identificación fiscal del cliente |
| `amount` | Decimal | Requerido, mínimo 0 | Monto total de la factura |
| `issue_date` | Date | Requerido, formato fecha válido | Fecha de emisión |
| `due_date` | Date | Requerido, posterior a `issue_date` | Fecha de vencimiento |
| `operation_type` | String | Requerido, valores: `confirming`, `factoring` | Tipo de operación |

### Campos Opcionales Básicos

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `description` | String | Opcional, máximo 1000 caracteres | Descripción de la factura |
| `document` | File | Opcional, formatos: PDF, JPG, JPEG, PNG, máximo 10MB | Documento adjunto |

### Reglas de Fechas

- **Fecha de vencimiento**: Debe ser posterior a la fecha de emisión
- **Formato de fechas**: Debe seguir el formato estándar (YYYY-MM-DD)
- **Fechas futuras**: Las fechas no pueden ser anteriores a la fecha actual (excepto `issue_date` en casos específicos)

## Reglas Específicas para Factoring

Cuando `operation_type = "factoring"`, se aplican las siguientes validaciones adicionales:

### Campos Obligatorios para Factoring

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `advance_percentage` | Decimal | Requerido, mínimo 10, máximo 90 | Porcentaje de adelanto solicitado |
| `commission_rate` | Decimal | Requerido, mínimo 0.1, máximo 10 | Tasa de comisión (en porcentaje) |
| `expected_collection_date` | Date | Requerido, posterior a `due_date` | Fecha esperada de cobro |
| `credit_risk_assessment` | String | Requerido, valores: `low`, `medium`, `high` | Evaluación de riesgo crediticio |

### Validaciones Específicas de Factoring

#### Porcentaje de Adelanto (`advance_percentage`)
```
- Valor mínimo: 10%
- Valor máximo: 90%
- Tipo: Número decimal
- Ejemplo válido: 75.5
- Ejemplo inválido: 95 (excede el máximo)
```

#### Tasa de Comisión (`commission_rate`)
```
- Valor mínimo: 0.1%
- Valor máximo: 10%
- Tipo: Número decimal
- Ejemplo válido: 2.5
- Ejemplo inválido: 15 (excede el máximo)
```

#### Fecha Esperada de Cobro (`expected_collection_date`)
```
- Debe ser posterior a la fecha de vencimiento (due_date)
- Formato: YYYY-MM-DD
- Ejemplo válido: Si due_date = "2024-03-15", entonces expected_collection_date = "2024-03-20"
- Ejemplo inválido: Si due_date = "2024-03-15", entonces expected_collection_date = "2024-03-10"
```

#### Evaluación de Riesgo Crediticio (`credit_risk_assessment`)
```
- Valores permitidos: "low", "medium", "high"
- Caso sensitivo: debe ser exactamente en minúsculas
- Ejemplo válido: "medium"
- Ejemplo inválido: "Medium" o "MEDIUM"
```

## Reglas Específicas para Confirming

Cuando `operation_type = "confirming"`, se aplican las siguientes validaciones adicionales:

### Campos Obligatorios para Confirming

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `supplier_name` | String | Requerido, máximo 255 caracteres | Nombre del proveedor |
| `supplier_tax_id` | String | Requerido, máximo 255 caracteres | Identificación fiscal del proveedor |
| `payment_terms` | String | Requerido, máximo 255 caracteres | Términos de pago |
| `confirmation_deadline` | Date | Requerido, posterior a `issue_date` | Fecha límite de confirmación |

### Campos Opcionales para Confirming

| Campo | Tipo | Validación | Descripción |
|-------|------|------------|-------------|
| `early_payment_discount` | Decimal | Opcional, mínimo 0, máximo 100 | Descuento por pago anticipado |

### Validaciones Específicas de Confirming

#### Información del Proveedor
```
- supplier_name: Máximo 255 caracteres, no puede estar vacío
- supplier_tax_id: Máximo 255 caracteres, debe seguir formato de identificación fiscal
```

#### Términos de Pago (`payment_terms`)
```
- Máximo 255 caracteres
- Debe describir claramente las condiciones de pago
- Ejemplo válido: "30 días neto"
- Ejemplo válido: "Pago contra entrega"
```

#### Fecha Límite de Confirmación (`confirmation_deadline`)
```
- Debe ser posterior a la fecha de emisión (issue_date)
- Debe ser anterior o igual a la fecha de vencimiento (due_date)
- Formato: YYYY-MM-DD
- Ejemplo válido: Si issue_date = "2024-03-01" y due_date = "2024-03-30", 
  entonces confirmation_deadline = "2024-03-15"
```

#### Descuento por Pago Anticipado (`early_payment_discount`)
```
- Valor mínimo: 0%
- Valor máximo: 100%
- Tipo: Número decimal
- Ejemplo válido: 5.5
- Ejemplo inválido: 150 (excede el máximo)
```

## Validaciones de Archivos

### Documentos Adjuntos (`document`)

| Propiedad | Valor |
|-----------|-------|
| **Formatos permitidos** | PDF, JPG, JPEG, PNG |
| **Tamaño máximo** | 10 MB (10,240 KB) |
| **Obligatorio** | No |
| **Validación adicional** | El archivo debe ser legible y no estar corrupto |

### Ejemplos de Archivos Válidos
```
✅ factura_001.pdf (2.5 MB)
✅ documento.jpg (1.8 MB)
✅ comprobante.png (500 KB)
```

### Ejemplos de Archivos Inválidos
```
❌ documento.docx (formato no permitido)
❌ archivo_grande.pdf (15 MB - excede el límite)
❌ imagen.gif (formato no permitido)
```

## Ejemplos Prácticos

### Ejemplo 1: Factura de Factoring Válida

```json
{
  "invoice_number": "FACT-2024-001",
  "client_name": "Empresa ABC S.A.",
  "client_tax_id": "20123456789",
  "amount": 50000.00,
  "issue_date": "2024-03-01",
  "due_date": "2024-03-30",
  "operation_type": "factoring",
  "description": "Venta de productos manufacturados",
  "advance_percentage": 80.0,
  "commission_rate": 2.5,
  "expected_collection_date": "2024-04-05",
  "credit_risk_assessment": "low"
}
```

### Ejemplo 2: Factura de Confirming Válida

```json
{
  "invoice_number": "CONF-2024-001",
  "client_name": "Cliente XYZ Ltda.",
  "client_tax_id": "20987654321",
  "amount": 25000.00,
  "issue_date": "2024-03-01",
  "due_date": "2024-03-30",
  "operation_type": "confirming",
  "description": "Servicios de consultoría",
  "supplier_name": "Proveedor DEF S.A.S.",
  "supplier_tax_id": "20555666777",
  "payment_terms": "30 días calendario",
  "confirmation_deadline": "2024-03-15",
  "early_payment_discount": 2.0
}
```

### Ejemplo 3: Errores Comunes

#### Error en Factoring - Fecha Incorrecta
```json
{
  "invoice_number": "FACT-2024-002",
  "operation_type": "factoring",
  "due_date": "2024-03-30",
  "expected_collection_date": "2024-03-25"  // ❌ ERROR: Anterior a due_date
}
```

#### Error en Confirming - Campo Faltante
```json
{
  "invoice_number": "CONF-2024-002",
  "operation_type": "confirming",
  "issue_date": "2024-03-01",
  "due_date": "2024-03-30"
  // ❌ ERROR: Falta supplier_name, supplier_tax_id, payment_terms, confirmation_deadline
}
```

## Códigos de Error

### Errores de Validación Generales

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `422` | Validation failed | Error general de validación |
| `400` | Bad Request | Solicitud malformada |
| `403` | Unauthorized | Usuario no autorizado para crear facturas |

### Mensajes de Error Específicos

#### Factoring
```
- "The advance percentage must be between 10 and 90."
- "The commission rate must be between 0.1 and 10."
- "The expected collection date must be after the due date."
- "The credit risk assessment must be one of: low, medium, high."
```

#### Confirming
```
- "The supplier name field is required."
- "The supplier tax id field is required."
- "The payment terms field is required."
- "The confirmation deadline must be after the issue date."
- "The early payment discount must be between 0 and 100."
```

#### Archivos
```
- "The document must be a file of type: pdf, jpg, jpeg, png."
- "The document may not be greater than 10240 kilobytes."
```

### Validación en el Frontend

El sistema también implementa validaciones en tiempo real en el frontend para mejorar la experiencia del usuario:

#### Validaciones de Factoring (Frontend)
- **Porcentaje de adelanto**: Validación en tiempo real con rango 1-90%
- **Tasa de comisión**: Validación con rango 0.1-10%
- **Fecha de cobro esperada**: Validación que debe ser posterior a la fecha de vencimiento
- **Evaluación de riesgo**: Lista desplegable con opciones predefinidas

#### Validaciones de Confirming (Frontend)
- **ID fiscal del proveedor**: Patrón de validación para números de 8-15 dígitos
- **Términos de pago**: Validación de longitud máxima
- **Fecha límite de confirmación**: Validación de rango de fechas
- **Descuento por pago anticipado**: Rango 0-100%

---

**Nota**: Estas reglas están implementadas tanto en el backend (Laravel) como en el frontend (Angular) para garantizar la consistencia y seguridad de los datos. Cualquier modificación a estas reglas debe realizarse en ambos lugares para mantener la sincronización del sistema.