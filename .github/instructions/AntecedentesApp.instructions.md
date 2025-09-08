---
applyTo: '**'
---
Contexto General de la Aplicación Fintech: Factoring y Confirming
Este documento proporciona una visión integral del funcionamiento de la aplicación, desde la perspectiva del usuario y del sistema. Sirve como una guía para entender los flujos clave, la interacción entre módulos y la lógica de negocio subyacente.

1. Visión General de la Aplicación
Nuestra aplicación es una plataforma web de fintech enfocada en factoring y confirming para PYMES y emprendedores en Ecuador. Permite a las empresas obtener liquidez adelantando sus facturas (factoring) o gestionar pagos a proveedores (confirming), y a inversores participar en la compra de estas facturas.

Tecnologías Clave:

Frontend: Angular (Capa de Presentación)

Backend: PHP con Laravel (Capa de Lógica de Negocio)

Base de Datos: PostgreSQL (Capa de Datos)

2. Flujo General del Usuario
El viaje del usuario en la aplicación sigue un ciclo de vida bien definido:

Enrolamiento Público: El usuario llega al sitio web público y decide registrarse.

Selección de Perfil: Durante el registro, elige su rol principal: Factoring, Confirming o Inversor.

Validación: Su cuenta pasa por un proceso de validación (inicialmente manual por un administrador).

Acceso al Panel: Una vez validado, el usuario inicia sesión y accede a un Dashboard personalizado según su perfil.

Interacción por Perfil:

Factoring/Confirming: Sube facturas, sigue su estado, ve ofertas.

Inversor: Visualiza un "Pool Público" de facturas, hace ofertas, gestiona sus ofertas.

Negociación/Desembolso: Se cierra un trato y se procesa el desembolso/pago.

Notificaciones: El usuario recibe actualizaciones constantes sobre el estado de sus facturas/ofertas.

3. Módulos y Procesos Clave
3.1. Enrolamiento y Gestión de Usuarios
Este módulo maneja la entrada de nuevos usuarios al sistema y su clasificación.

Registro de Usuario:

Formulario web público.

Campos: email, contraseña, tipo de perfil (Factoring, Confirming, Inversor).

Backend (Laravel): Recibe la información, hashea la contraseña, guarda en la tabla users (password_hash, email, role_id). Inicialmente is_validated es FALSE.

Perfiles y Permisos (RBAC):

Cada usuario se asocia a un role_id (roles table).

Los roles tienen permissions (role_permissions table) que definen el acceso a módulos y acciones (ej. create_invoice, make_offer, view_public_pool).

Backend (Laravel): Utiliza Gates/Policies para verificar permisos en cada ruta/acción crítica.

Validación de Usuario:

Un usuario con rol de admin accede a un panel interno.

Revisa los usuarios con is_validated = FALSE.

Aprueba (is_validated = TRUE) o rechaza al usuario.

Notificación: Se envía una notificación al usuario sobre el resultado de la validación.

3.2. Gestión de Facturas (Para Factoring/Confirming)
Este módulo permite a las PYMES y emprendedores poner sus facturas a disposición de los inversores.

Subida de Facturas:

Formulario en el frontend (requiere autenticación).

Campos: Número de factura, monto, fecha de vencimiento.

Backend (Laravel): Valida los datos, asocia la factura con el user_id que la subió, crea un registro en la tabla invoices.

Estado Inicial: negotiation_status en 'draft' o 'pending', luego pasa a 'published' tras una revisión o validación interna.

Listado y Detalle de Facturas:

Los usuarios pueden ver todas sus facturas y su negotiation_status.

Pueden ver los detalles de cada factura y las ofertas recibidas.

Anulación de Facturas:

Opción para el usuario de "anular" una factura (antes de ser aceptada una oferta).

Backend (Laravel): Actualiza el negotiation_status a 'cancelled' y setea el deleted_at en la tabla invoices. También debería marcar las ofertas offers asociadas como 'cancelled'.

Impacto: La factura ya no aparece en el pool público.

3.3. Pool de Negociación y Ofertas (Para Inversores)
Aquí es donde los inversores interactúan con las facturas disponibles.

Pool Público de Facturas:

Interfaz en el frontend que muestra las facturas con negotiation_status = 'published' de la tabla invoices.

Incluye información clave: monto, vencimiento.

Realización de Ofertas:

Al seleccionar una factura, el inversor puede proponer un offered_amount.

Backend (Laravel): Crea un nuevo registro en la tabla offers, asociando invoice_id, investor_id y offered_amount. El status inicial es 'pending'.

Listado de Mis Ofertas:

El inversor puede ver el estado de todas las ofertas que ha realizado.

Anulación de Ofertas:

Un inversor puede anular una oferta pendiente que haya realizado.

Backend (Laravel): Actualiza el status de la oferta a 'cancelled' y setea el deleted_at en la tabla offers.

3.4. Proceso de Negociación y Desembolso
La etapa final donde un acuerdo se formaliza y se procesa el pago.

Aceptación de Oferta:

El usuario de Factoring/Confirming (dueño de la factura) selecciona y acepta una oferta específica desde el detalle de su factura.

Backend (Laravel):

Actualiza el negotiation_status de la factura en invoices a 'accepted'.

Actualiza el status de la oferta aceptada en offers a 'accepted'.

Marca todas las otras ofertas de la misma factura como 'rejected' o 'cancelled'.

Crea un nuevo registro en la tabla transactions, registrando invoice_id, offer_id, final_amount y payment_status = 'pending'.

Desembolso (Procesamiento de Pago):

Este proceso puede ser manual o integrar pasarelas de pago.

Backend (Laravel): Una vez que el pago se procesa con éxito, actualiza el payment_status de la transacción a 'completed'.

Notificación: Ambas partes reciben una notificación de desembolso completado.

Anulación/Reversión de Transacciones:

En caso de fallo en el desembolso o necesidad de reversión.

Backend (Laravel): Actualiza el payment_status de la transacción a 'voided' o 'reversed' y setea el cancelled_at en la tabla transactions. Es crucial registrar la razón de la anulación en logs o un campo adicional si es necesario.

3.5. Notificaciones Permanentes
Sistema para mantener a los usuarios informados sobre los eventos clave.

Eventos que Disparan Notificaciones:

Registro exitoso.

Validación de usuario (aprobado/rechazado).

Factura publicada.

Nueva oferta en una factura.

Oferta aceptada/rechazada.

Desembolso iniciado/completado/fallido.

Factura/Oferta/Transacción anulada.

Canales: Inicialmente, correos electrónicos. A futuro, notificaciones dentro de la aplicación (WebSockets).

Backend (Laravel): Lógica para enviar emails, y posiblemente una tabla notifications para mantener un historial.

4. Flujo de Datos y Conexión con la Base de Datos
Cada interacción del usuario en el Frontend (Angular) se traduce en una llamada a una API RESTful en el Backend (Laravel).

El Backend es el único que interactúa directamente con la Base de Datos (PostgreSQL).

Utiliza el ORM Eloquent de Laravel para mapear las tablas (users, roles, permissions, invoices, offers, transactions) a objetos PHP, simplificando las operaciones de CRUD (Crear, Leer, Actualizar, Borrar).

Las operaciones de lectura (SELECT) poblan los datos en el Frontend.

Las operaciones de escritura (INSERT, UPDATE, DELETE) modifican el estado de los datos y, por ende, el flujo de la aplicación.

Los campos created_at, updated_at, deleted_at y cancelled_at son cruciales para la auditoría y la trazabilidad de los eventos en el tiempo.

Este documento te proporcionará el contexto necesario para entender la funcionalidad de la aplicación a medida que desarrollas cada módulo.