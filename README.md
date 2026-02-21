# MaxiKiosco Admin - Sistema de Gestion para Maxikioscos

Sistema integral de **punto de venta (POS)** y **gestion comercial** disenado especificamente para maxikioscos, almacenes y pequenos comercios de Buenos Aires y alrededores.

Accede desde cualquier dispositivo con internet: computadora, tablet o celular. No requiere instalacion de software.

---

## Que es MaxiKiosco Admin?

Es una plataforma web que permite al dueno de un maxikiosco **controlar todo su negocio desde un solo lugar**: ventas, stock, caja, empleados y reportes. Funciona 100% en la nube, lo que significa que no necesitas instalar nada, solo abrir el navegador.

**Problema que resuelve:** La mayoria de los kioscos manejan todo "de cabeza" o en cuadernos. No saben cuanto venden por dia, que productos se mueven mas, si el empleado cuadra la caja, o cuando hay que reponer mercaderia. Este sistema resuelve todo eso de forma simple.

---

## Funcionalidades Completas

### 1. Punto de Venta (POS)

El corazon del sistema. Una interfaz rapida y simple para registrar ventas al instante.

- **Venta rapida**: Selecciona productos por categoria o buscalos por nombre
- **Lector de codigo de barras**: Conecta un lector USB (pistola) y escaneando el producto se agrega automaticamente al carrito
- **Carrito de compras**: Agrega, quita o modifica cantidades antes de confirmar la venta
- **3 metodos de pago**:
  - Efectivo (con calculo automatico de vuelto)
  - Tarjeta de debito/credito
  - Transferencia bancaria
- **Control de stock en tiempo real**: Si un producto no tiene stock suficiente, el sistema no permite venderlo
- **Acceso para empleados**: Los empleados solo ven la pantalla de ventas y caja, nada mas

### 2. Control de Caja Registradora

Sistema completo de apertura y cierre de caja con control de faltantes y sobrantes.

- **Apertura de caja**: El operador registra con cuanto efectivo arranca el dia
- **Cierre de caja**: Al final del turno, el operador cuenta el efectivo fisico y el sistema calcula automaticamente si hay diferencia (faltante o sobrante)
- **Calculo automatico del esperado**: El sistema sabe exactamente cuanto deberia haber en caja:
  - Monto de apertura + ventas en efectivo - gastos/retiros = **monto esperado**
- **Registro de movimientos de caja**:
  - Gastos (ej: compra de bolsas, limpieza)
  - Pagos a proveedores
  - Retiros de efectivo
  - Ajustes
- **Resumen en tiempo real**: Mientras la caja esta abierta, el operador ve cuanto se vendio por cada metodo de pago y los movimientos del dia
- **Una sola caja abierta a la vez**: El sistema garantiza que no haya dos cajas abiertas simultaneamente

### 3. Gestion de Productos e Inventario

Alta, Baja y Modificacion completa de productos con control de stock inteligente.

- **Carga de productos** con los siguientes datos:
  - Nombre y descripcion
  - Categoria (ej: Bebidas, Golosinas, Limpieza, etc.)
  - Precio de venta y precio de costo
  - Stock actual y stock minimo (para alertas)
  - Codigo SKU y codigo de barras
  - Imagen del producto (se sube a la nube automaticamente)
- **Categorias personalizables**: Crea las categorias que necesites con nombre y emoji (ej: "Bebidas", "Fiambres", "Lacteos")
- **Alertas de stock bajo**: Cuando un producto llega al minimo configurado, aparece en el dashboard como alerta
- **Busqueda avanzada**: Busca productos por nombre, SKU o codigo de barras
- **Eliminacion logica**: Los productos eliminados se desactivan, no se borran (se preserva el historial de ventas)
- **Imagenes optimizadas**: Las fotos se redimensionan y comprimen automaticamente para no consumir datos innecesariamente

### 4. Panel de Control (Dashboard)

Vista general del negocio en una sola pantalla. Solo visible para administradores.

- **Ventas del dia**: Cuanto se vendio hoy y en cuantas operaciones
- **Ventas de la semana**: Resumen semanal con totales
- **Ventas del mes**: Resumen mensual con totales
- **Top 10 productos mas vendidos**: Tabla con los productos que mas se venden, cantidad vendida y recaudacion
- **Productos con stock bajo**: Lista de productos que necesitan reposicion urgente, mostrando stock actual vs minimo y categoria
- **Productos sin ventas**: Inventario "muerto" - productos cargados que nunca se vendieron (para tomar decisiones sobre que dejar de comprar)
- **Ultimos cierres de caja**: Historial reciente de aperturas/cierres con operador, montos y diferencias

### 5. Reportes de Ventas

Herramienta de analisis para entender el rendimiento del negocio.

- **Historial completo de ventas**: Todas las ventas registradas con detalle de cada producto vendido
- **Filtros avanzados**:
  - Por rango de fechas (ej: "del 1 al 15 de este mes")
  - Por metodo de pago (solo efectivo, solo tarjeta, etc.)
  - Por producto (buscar ventas de un producto especifico)
- **Metricas automaticas**:
  - Total facturado en el periodo
  - Cantidad de ventas realizadas
  - Ticket promedio (cuanto gasta cada cliente en promedio)
  - Cantidad de productos vendidos
- **Exportacion a Excel**: Descarga un archivo .xlsx con todo el detalle para llevar al contador o analizar en una planilla
  - Incluye: fecha, hora, producto, cantidad, precio unitario, subtotal, metodo de pago
  - Formateado y listo para imprimir o enviar

### 6. Panel de Auditoria

Control exhaustivo sobre las sesiones de caja. Ideal para duenos que tienen empleados.

- **Historial de todas las cajas**: Registro completo de cada apertura y cierre
- **Filtros de auditoria**:
  - Por operador (quien abrio/cerro la caja)
  - Por rango de fechas
  - Por estado (abiertas/cerradas)
  - Por tipo de diferencia (cuadradas, con faltante, con sobrante)
- **Detalle de cada sesion de caja**:
  - Quien abrio y quien cerro
  - Monto de apertura vs monto de cierre
  - Todas las ventas realizadas durante esa caja
  - Todos los movimientos (gastos, retiros)
  - Todos los productos vendidos con cantidades
  - Diferencia final explicada
- **Deteccion de anomalias**: Identifica rapidamente cajas con faltantes o sobrantes sospechosos

### 7. Gestion de Usuarios

Administracion de accesos para duenos y empleados.

- **Dos roles disponibles**:
  - **Administrador**: Acceso total a todas las funcionalidades
  - **Empleado**: Solo acceso al Punto de Venta y Control de Caja
- **Alta, baja y modificacion de usuarios**
- **Datos por usuario**: Nombre completo, email, contrasena (encriptada), rol, estado activo/inactivo
- **Registro de ultimo acceso**: Saber cuando fue la ultima vez que cada usuario entro al sistema
- **Contrasenas seguras**: Las contrasenas se almacenan encriptadas (estandar de la industria)

### 8. Seguridad y Proteccion de Datos

- **Autenticacion con contrasena encriptada**
- **Sesiones seguras** con cookies HTTP-only (no manipulables desde el navegador)
- **Proteccion de rutas**: Un empleado no puede acceder a secciones de administrador escribiendo la URL manualmente
- **Transacciones atomicas**: Las ventas se procesan de forma segura - si algo falla a mitad de una venta, no se registra nada incompleto (ni la venta ni el descuento de stock)
- **Validaciones en base de datos**: Precios no negativos, stock no negativo, emails unicos, codigos de barras unicos, etc.

---

## Resumen de Modulos

| Modulo | Descripcion | Acceso |
|---|---|---|
| **Punto de Venta** | Registro de ventas con carrito, busqueda y escaner | Admin y Empleado |
| **Control de Caja** | Apertura, cierre, movimientos y resumen de caja | Admin y Empleado |
| **Productos** | Alta/baja/modificacion de productos y categorias | Solo Admin |
| **Dashboard** | Metricas del negocio, alertas y resumen general | Solo Admin |
| **Reportes** | Historial de ventas, filtros y exportacion a Excel | Solo Admin |
| **Auditoria** | Control de sesiones de caja y deteccion de diferencias | Solo Admin |
| **Usuarios** | Gestion de accesos, roles y empleados | Solo Admin |

---

## Caracteristicas Tecnicas

| Caracteristica | Detalle |
|---|---|
| Tipo de aplicacion | Web (SaaS) - accesible desde cualquier navegador |
| Dispositivos compatibles | PC, notebook, tablet, celular |
| Requiere instalacion | No |
| Base de datos | MongoDB (en la nube, con backups) |
| Hosting | Vercel (alta disponibilidad, servidores globales) |
| Almacenamiento de imagenes | Cloudinary (nube, con optimizacion automatica) |
| Idioma | Espanol (Argentina) |
| Moneda | Pesos argentinos (ARS) |
| Lector de codigos | Compatible con cualquier lector USB estandar |
| Exportacion | Excel (.xlsx) |
| Usuarios simultaneos | Sin limite |
| Cantidad de productos | Sin limite |
| Historial de ventas | Sin limite, se conserva todo |

---

## Como Funciona en el Dia a Dia

```
1. APERTURA DEL DIA
   El empleado o dueno abre la caja indicando el monto inicial de efectivo.

2. VENTAS
   Se registran las ventas usando el Punto de Venta:
   - Buscar o escanear productos con la pistola
   - Agregar al carrito y ajustar cantidades
   - Cobrar en efectivo, tarjeta o transferencia
   El stock se descuenta automaticamente con cada venta.

3. MOVIMIENTOS DE CAJA
   Si hay gastos durante el dia (pago a proveedor, compra de insumos, retiro de
   efectivo), se registran como movimientos de caja para que el calculo sea exacto.

4. CIERRE DEL DIA
   El empleado o dueno cuenta el efectivo fisico y cierra la caja.
   El sistema calcula automaticamente si cuadra o hay diferencia.

5. CONTROL DEL DUENO (DESDE CUALQUIER LUGAR)
   Desde el dashboard o los reportes, el dueno puede ver:
   - Cuanto se vendio hoy/esta semana/este mes
   - Que productos se movieron mas
   - Si la caja cuadro o hay faltante
   - Que productos necesitan reposicion
   Todo esto desde su celular, sin necesidad de estar en el local.
```

---

## Que Incluye el Servicio

### Pago Inicial - Instalacion y Puesta en Marcha

El pago inicial cubre la puesta en marcha completa del sistema para que el comercio empiece a operar desde el primer dia:

**Configuracion tecnica:**
- Despliegue del sistema en la nube (hosting, base de datos, almacenamiento de imagenes)
- Configuracion del dominio y acceso al sistema
- Creacion de la cuenta del dueno (usuario administrador)
- Creacion de usuarios para cada empleado

**Carga de datos iniciales:**
- Carga de categorias personalizadas segun el tipo de comercio
- Carga del catalogo de productos con precios, stock y categorias
- Carga de imagenes de productos (opcional)
- Configuracion de stock minimo para alertas

**Capacitacion (presencial o virtual, 1-2 horas):**
- Como hacer ventas en el Punto de Venta
- Como usar el lector de codigo de barras (si tiene uno)
- Como abrir y cerrar la caja correctamente
- Como registrar gastos y movimientos de caja
- Como cargar y modificar productos y precios
- Como ver el dashboard, reportes y exportar a Excel
- Como auditar las cajas de los empleados (para administradores)
- Entrega de guia rapida de uso

**Soporte post-instalacion:**
- Acompanamiento intensivo durante la primera semana de uso
- Resolucion de dudas por WhatsApp
- Ajustes y correcciones si se detecta algun problema

### Suscripcion Mensual

La suscripcion mensual cubre todo lo necesario para que el sistema funcione sin interrupciones:

- **Hosting**: Servidores en la nube funcionando 24/7, los 365 dias del ano
- **Base de datos**: Almacenamiento seguro de productos, ventas, cierres de caja y todo el historial
- **Almacenamiento de imagenes**: Subida y almacenamiento de fotos de productos con optimizacion automatica
- **Backups**: Copias de seguridad periodicas de todos los datos
- **Actualizaciones**: Mejoras del sistema, nuevas funcionalidades y correcciones
- **Mantenimiento tecnico**: Monitoreo del sistema, prevencion de caidas y correccion de errores
- **Soporte tecnico**: Atencion por WhatsApp y/o email en horario comercial (lunes a sabados)
- **Acceso ilimitado**: Sin restriccion de usuarios, productos ni ventas

---

## Planes Sugeridos

> *Precios de referencia en pesos argentinos. Sujetos a actualizacion por inflacion.*

### Plan Basico
**Para kioscos atendidos por el dueno solo**
- 1 usuario administrador
- Todas las funcionalidades incluidas
- Soporte por WhatsApp en horario comercial

### Plan Profesional
**Para kioscos con 1 a 2 empleados**
- Hasta 3 usuarios (1 administrador + 2 empleados)
- Todas las funcionalidades incluidas
- Soporte prioritario por WhatsApp
- Auditoria de cajas para control de empleados

### Plan Negocio
**Para maxikioscos con varios turnos o sucursales**
- Usuarios ilimitados
- Todas las funcionalidades incluidas
- Soporte prioritario por WhatsApp y telefono
- Capacitacion adicional para nuevos empleados sin costo

---

## Que Necesita el Comercio

**Requisitos minimos:**
- Conexion a internet (WiFi o datos moviles del celular)
- Un dispositivo con navegador web: computadora, tablet o celular (Chrome, Firefox, Safari o Edge)

**Opcional pero recomendado:**
- Lector de codigo de barras USB (pistola) para agilizar las ventas - se consiguen facilmente en MercadoLibre
- Tablet o computadora dedicada para el mostrador

**No se necesita:**
- Computadora potente ni de ultima generacion
- Instalacion de ningun programa o aplicacion
- Impresora fiscal (el sistema no emite factura, registra ventas internamente para control del negocio)
- Conocimientos tecnicos previos

---

## Preguntas Frecuentes

**Funciona sin internet?**
No. El sistema necesita conexion a internet ya que los datos se guardan en la nube. La ventaja es que el dueno puede ver todo desde cualquier lugar con su celular.

**Puedo usarlo desde el celular?**
Si. El sistema se adapta a cualquier tamano de pantalla (computadora, tablet o celular).

**Que pasa si se corta la luz o internet en el medio de una venta?**
La venta no se registra incompleta. Cuando vuelve la conexion, se puede continuar normalmente sin perder datos.

**Emite factura electronica (AFIP)?**
No. El sistema es para gestion interna del negocio (control de ventas, stock y caja). La facturacion electronica es una funcionalidad adicional que puede integrarse a futuro.

**Puedo ver cuanto vende mi empleado si no estoy en el local?**
Si. Como administrador podes ver las ventas, el estado de la caja y los reportes desde tu celular en cualquier momento y lugar.

**Mis datos estan seguros?**
Si. Los datos se almacenan en servidores en la nube con encriptacion. Las contrasenas estan encriptadas, las sesiones son seguras y se realizan backups periodicos.

**Hay limite de productos o ventas?**
No. Podes cargar todos los productos que necesites y registrar todas las ventas que quieras sin limite.

**Sirve para almacen, despensa, drugstore o dietetica?**
Si. El sistema es adaptable a cualquier comercio minorista que venda productos. Se configuran las categorias segun el tipo de negocio.

**Puedo cambiar los precios facilmente?**
Si. Desde la seccion de productos podes modificar precios de venta y costo en cualquier momento. El cambio se refleja inmediatamente en el Punto de Venta.

**Como se si tengo que reponer un producto?**
El sistema permite configurar un stock minimo por producto. Cuando el stock llega a ese numero, aparece una alerta en el dashboard. Ademas, podes ver en tiempo real el stock de cada producto.

**Puedo exportar los datos para mi contador?**
Si. Los reportes de ventas se pueden exportar a Excel (.xlsx) con todo el detalle: fecha, producto, cantidad, precio, metodo de pago. Listo para enviar.

**Que pasa si dejo de pagar la mensualidad?**
El acceso al sistema se suspende hasta regularizar el pago. Los datos se conservan por un periodo prudencial para que no pierdas informacion.

---

## Por Que Elegir MaxiKiosco Admin

- **Sin instalacion**: Funciona desde el navegador, sin descargar nada
- **Acceso remoto**: Controla tu negocio desde el celular sin estar en el local
- **Control de empleados**: Auditoria de caja para saber si cuadran los numeros
- **Alertas de stock**: Nunca mas te quedas sin un producto que se vende mucho
- **Reportes claros**: Sabe cuanto vendes, que se mueve y cuanto gana tu negocio
- **Exportacion a Excel**: Datos listos para el contador
- **Facil de usar**: Pensado para personas sin conocimientos tecnicos
- **Todo en espanol**: Sistema y soporte en espanol rioplatense
- **Lector de codigos**: Venta ultra rapida escaneando productos
- **Sin limites**: Productos, ventas y usuarios ilimitados
- **Datos seguros**: Encriptacion, backups y servidores de alta disponibilidad

---

## Contacto

Para consultas sobre el sistema, demostraciones en vivo o cotizaciones personalizadas, contactanos.

---

*Sistema desarrollado para maxikioscos y comercios minoristas de Buenos Aires, Argentina.*
