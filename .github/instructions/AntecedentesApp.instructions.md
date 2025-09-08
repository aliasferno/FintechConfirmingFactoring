---
applyTo: '**'
---
Contexto General de la Aplicaci�n Fintech: Factoring y Confirming
Este documento proporciona una visi�n integral del funcionamiento de la aplicaci�n, desde la perspectiva del usuario y del sistema. Sirve como una gu�a para entender los flujos clave, la interacci�n entre m�dulos y la l�gica de negocio subyacente.

1. Visi�n General de la Aplicaci�n
Nuestra aplicaci�n es una plataforma web de fintech enfocada en factoring y confirming para PYMES y emprendedores en Ecuador. Permite a las empresas obtener liquidez adelantando sus facturas (factoring) o gestionar pagos a proveedores (confirming), y a inversores participar en la compra de estas facturas.

Tecnolog�as Clave:

Frontend: Angular (Capa de Presentaci�n)

Backend: PHP con Laravel (Capa de L�gica de Negocio)

Base de Datos: PostgreSQL (Capa de Datos)

2. Flujo General del Usuario
El viaje del usuario en la aplicaci�n sigue un ciclo de vida bien definido:

Enrolamiento P�blico: El usuario llega al sitio web p�blico y decide registrarse.

Selecci�n de Perfil: Durante el registro, elige su rol principal: Factoring, Confirming o Inversor.

Validaci�n: Su cuenta pasa por un proceso de validaci�n (inicialmente manual por un administrador).

Acceso al Panel: Una vez validado, el usuario inicia sesi�n y accede a un Dashboard personalizado seg�n su perfil.

Interacci�n por Perfil:

Factoring/Confirming: Sube facturas, sigue su estado, ve ofertas.

Inversor: Visualiza un "Pool P�blico" de facturas, hace ofertas, gestiona sus ofertas.

Negociaci�n/Desembolso: Se cierra un trato y se procesa el desembolso/pago.

Notificaciones: El usuario recibe actualizaciones constantes sobre el estado de sus facturas/ofertas.

3. M�dulos y Procesos Clave
3.1. Enrolamiento y Gesti�n de Usuarios
Este m�dulo maneja la entrada de nuevos usuarios al sistema y su clasificaci�n.

Registro de Usuario:

Formulario web p�blico.

Campos: email, contrase�a, tipo de perfil (Factoring, Confirming, Inversor).

Backend (Laravel): Recibe la informaci�n, hashea la contrase�a, guarda en la tabla users (password_hash, email, role_id). Inicialmente is_validated es FALSE.

Perfiles y Permisos (RBAC):

Cada usuario se asocia a un role_id (roles table).

Los roles tienen permissions (role_permissions table) que definen el acceso a m�dulos y acciones (ej. create_invoice, make_offer, view_public_pool).

Backend (Laravel): Utiliza Gates/Policies para verificar permisos en cada ruta/acci�n cr�tica.

Validaci�n de Usuario:

Un usuario con rol de admin accede a un panel interno.

Revisa los usuarios con is_validated = FALSE.

Aprueba (is_validated = TRUE) o rechaza al usuario.

Notificaci�n: Se env�a una notificaci�n al usuario sobre el resultado de la validaci�n.

3.2. Gesti�n de Facturas (Para Factoring/Confirming)
Este m�dulo permite a las PYMES y emprendedores poner sus facturas a disposici�n de los inversores.

Subida de Facturas:

Formulario en el frontend (requiere autenticaci�n).

Campos: N�mero de factura, monto, fecha de vencimiento.

Backend (Laravel): Valida los datos, asocia la factura con el user_id que la subi�, crea un registro en la tabla invoices.

Estado Inicial: negotiation_status en 'draft' o 'pending', luego pasa a 'published' tras una revisi�n o validaci�n interna.

Listado y Detalle de Facturas:

Los usuarios pueden ver todas sus facturas y su negotiation_status.

Pueden ver los detalles de cada factura y las ofertas recibidas.

Anulaci�n de Facturas:

Opci�n para el usuario de "anular" una factura (antes de ser aceptada una oferta).

Backend (Laravel): Actualiza el negotiation_status a 'cancelled' y setea el deleted_at en la tabla invoices. Tambi�n deber�a marcar las ofertas offers asociadas como 'cancelled'.

Impacto: La factura ya no aparece en el pool p�blico.

3.3. Pool de Negociaci�n y Ofertas (Para Inversores)
Aqu� es donde los inversores interact�an con las facturas disponibles.

Pool P�blico de Facturas:

Interfaz en el frontend que muestra las facturas con negotiation_status = 'published' de la tabla invoices.

Incluye informaci�n clave: monto, vencimiento.

Realizaci�n de Ofertas:

Al seleccionar una factura, el inversor puede proponer un offered_amount.

Backend (Laravel): Crea un nuevo registro en la tabla offers, asociando invoice_id, investor_id y offered_amount. El status inicial es 'pending'.

Listado de Mis Ofertas:

El inversor puede ver el estado de todas las ofertas que ha realizado.

Anulaci�n de Ofertas:

Un inversor puede anular una oferta pendiente que haya realizado.

Backend (Laravel): Actualiza el status de la oferta a 'cancelled' y setea el deleted_at en la tabla offers.

3.4. Proceso de Negociaci�n y Desembolso
La etapa final donde un acuerdo se formaliza y se procesa el pago.

Aceptaci�n de Oferta:

El usuario de Factoring/Confirming (due�o de la factura) selecciona y acepta una oferta espec�fica desde el detalle de su factura.

Backend (Laravel):

Actualiza el negotiation_status de la factura en invoices a 'accepted'.

Actualiza el status de la oferta aceptada en offers a 'accepted'.

Marca todas las otras ofertas de la misma factura como 'rejected' o 'cancelled'.

Crea un nuevo registro en la tabla transactions, registrando invoice_id, offer_id, final_amount y payment_status = 'pending'.

Desembolso (Procesamiento de Pago):

Este proceso puede ser manual o integrar pasarelas de pago.

Backend (Laravel): Una vez que el pago se procesa con �xito, actualiza el payment_status de la transacci�n a 'completed'.

Notificaci�n: Ambas partes reciben una notificaci�n de desembolso completado.

Anulaci�n/Reversi�n de Transacciones:

En caso de fallo en el desembolso o necesidad de reversi�n.

Backend (Laravel): Actualiza el payment_status de la transacci�n a 'voided' o 'reversed' y setea el cancelled_at en la tabla transactions. Es crucial registrar la raz�n de la anulaci�n en logs o un campo adicional si es necesario.

3.5. Notificaciones Permanentes
Sistema para mantener a los usuarios informados sobre los eventos clave.

Eventos que Disparan Notificaciones:

Registro exitoso.

Validaci�n de usuario (aprobado/rechazado).

Factura publicada.

Nueva oferta en una factura.

Oferta aceptada/rechazada.

Desembolso iniciado/completado/fallido.

Factura/Oferta/Transacci�n anulada.

Canales: Inicialmente, correos electr�nicos. A futuro, notificaciones dentro de la aplicaci�n (WebSockets).

Backend (Laravel): L�gica para enviar emails, y posiblemente una tabla notifications para mantener un historial.

4. Flujo de Datos y Conexi�n con la Base de Datos
Cada interacci�n del usuario en el Frontend (Angular) se traduce en una llamada a una API RESTful en el Backend (Laravel).

El Backend es el �nico que interact�a directamente con la Base de Datos (PostgreSQL).

Utiliza el ORM Eloquent de Laravel para mapear las tablas (users, roles, permissions, invoices, offers, transactions) a objetos PHP, simplificando las operaciones de CRUD (Crear, Leer, Actualizar, Borrar).

Las operaciones de lectura (SELECT) poblan los datos en el Frontend.

Las operaciones de escritura (INSERT, UPDATE, DELETE) modifican el estado de los datos y, por ende, el flujo de la aplicaci�n.

Los campos created_at, updated_at, deleted_at y cancelled_at son cruciales para la auditor�a y la trazabilidad de los eventos en el tiempo.

Este documento te proporcionar� el contexto necesario para entender la funcionalidad de la aplicaci�n a medida que desarrollas cada m�dulo.