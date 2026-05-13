# Restosys Frontend - Sistema Express para Restaurante

Frontend web para **Restosys**, un sistema de gestión de restaurante orientado a la atención de mesas, punto de venta, toma de pedidos, facturación y control de estados de mesa.

Este proyecto está desarrollado con **Angular 21** y consume una API REST construida en Spring Boot.

---

## Características principales

- Inicio de sesión con usuario y contraseña.
- Login rápido para POS mediante PIN.
- Visualización de mesas del restaurante.
- Control de estados de mesa:
  - `available`: mesa disponible.
  - `occupied`: mesa con orden activa.
  - `dirty`: mesa pendiente de limpieza.
- Punto de venta para seleccionar productos por categoría.
- Carrito de pedido con cantidades, notas y subtotal.
- Envío de pedidos a cocina.
- Visualización de orden activa en mesas ocupadas.
- Bloqueo de productos ya enviados a cocina.
- Agregado de nuevos productos a una orden existente.
- Generación de cuenta por mesa.
- Procesamiento de pago.
- Limpieza de mesa para volverla a estado disponible.

---

## Tecnologías utilizadas

- Angular 21
- TypeScript
- Angular Signals
- Angular Router
- Angular HttpClient
- Angular Material Icons
- Tailwind CSS
- API REST con JWT
- Backend esperado: Spring Boot + PostgreSQL

---

## Estructura principal del proyecto

```text
src/
└── app/
    ├── components/
    │   └── auth/
    │       └── auth.component.ts
    ├── config/
    │   └── api.config.ts
    ├── services/
    │   ├── auth.service.ts
    │   ├── billing.service.ts
    │   ├── pos.service.ts
    │   └── table.service.ts
    ├── app.config.ts
    ├── app.routes.ts
    ├── app.html
    └── app.ts
```

---

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- Node.js
- npm
- Angular CLI

Puedes validar las versiones con:

```bash
node -v
npm -v
ng version
```

---

## Instalación

Clona el repositorio:

```bash
git clone https://github.com/Megex04/Restosys-frontend-sistema-express-restaurante.git
```

Ingresa a la carpeta del proyecto:

```bash
cd Restosys-frontend-sistema-express-restaurante
```

Instala las dependencias:

```bash
npm install
```

---

## Configuración de la API

El frontend consume el backend desde el archivo:

```text
src/app/config/api.config.ts
```

Ejemplo de configuración local:

```ts
export const API_CONFIG = {
  baseUrl: 'http://localhost:8080'
};
```

Con esta configuración, las peticiones se realizan hacia rutas como:

```text
http://localhost:8080/api/tables
http://localhost:8080/api/menu/categories
http://localhost:8080/api/menu/dishes/available
http://localhost:8080/api/orders
http://localhost:8080/api/billing/table/{tableId}
```

---

## Ejecución en desarrollo

Para levantar el proyecto en local:

```bash
ng serve
```

Luego abre el navegador en:

```text
http://localhost:4200
```

---

## Backend requerido

Este frontend espera que el backend exponga los siguientes endpoints:

### Autenticación

```http
POST /api/auth/login
POST /api/auth/login/pin
POST /api/auth/register
```

### Mesas

```http
GET /api/tables
PATCH /api/tables/{id}/status
```

### Menú

```http
GET /api/menu/categories
GET /api/menu/dishes/available
```

### Órdenes

```http
POST /api/orders
GET /api/orders/table/{tableId}/active
POST /api/orders/table/{tableId}/items
```

### Facturación

```http
GET /api/billing/table/{tableId}
POST /api/billing/table/{tableId}/pay
```

---

## Flujo principal del sistema

1. El usuario inicia sesión.
2. El sistema carga las mesas del restaurante.
3. Una mesa disponible puede abrir el POS.
4. El usuario selecciona productos del menú y los agrega al carrito.
5. Se envía la orden a cocina.
6. La mesa cambia a estado `occupied`.
7. Al volver a entrar a una mesa ocupada, se carga la orden activa.
8. Los productos ya enviados quedan bloqueados para edición.
9. Se pueden agregar productos nuevos a la misma orden.
10. Al facturar, se genera la cuenta de la mesa.
11. Al pagar, la orden pasa a pagada y la mesa cambia a `dirty`.
12. Al limpiar la mesa, vuelve a estado `available`.

---

## Estados de mesa

El frontend trabaja con los siguientes estados:

| Estado | Descripción |
|---|---|
| `available` | Mesa libre para iniciar una nueva orden |
| `occupied` | Mesa con una orden pendiente |
| `dirty` | Mesa pagada, pendiente de limpieza |

> Importante: los valores deben coincidir exactamente con los enums del backend. Si el backend usa minúsculas, el frontend también debe enviar minúsculas.

---

## Manejo de autenticación

El login devuelve un token JWT desde el backend. Este token se guarda en el frontend y debe enviarse en las peticiones protegidas mediante el header:

```http
Authorization: Bearer <token>
```

Se recomienda usar un interceptor HTTP para adjuntar automáticamente el token en cada petición.

---

## Scripts útiles

Ejecutar servidor de desarrollo:

```bash
ng serve
```

Compilar el proyecto:

```bash
ng build
```

Ejecutar pruebas:

```bash
ng test
```

---

## Consideraciones de desarrollo

- No subir la carpeta `node_modules`.
- Verificar que el backend esté levantado en `http://localhost:8080`.
- Verificar que el frontend esté levantado en `http://localhost:4200`.
- Si aparecen errores 403, revisar la configuración de Spring Security y CORS.
- Si no cargan productos, revisar que el backend devuelva correctamente la categoría del plato, ya sea como `categoryId` o como `category.id`.
- Si una mesa está `occupied`, debe existir una orden `PENDING` asociada en el backend.

---

## Archivo `.gitignore` recomendado

```gitignore
node_modules/
dist/
.angular/
.vscode/
.env
.DS_Store
npm-debug.log
yarn-error.log
```

---

## Autor

Proyecto desarrollado por **Miguel Antonio La Cunza Alfaro**.

---

## Estado del proyecto

Proyecto en desarrollo activo.
