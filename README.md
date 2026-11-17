# Catálogo de productos con favoritos

API REST desarrollada con Node.js, Express y PostgreSQL usando el controlador `pg`.

## Integrantes

- Apellido1, Nombre1
- Apellido2, Nombre2

Reemplaza los apellidos y nombres antes de entregar.

## Justificación de PostgreSQL

Se eligió PostgreSQL porque permite restricciones relacionales fuertes, claves foráneas, índices,
transacciones y tipos numéricos adecuados para el catálogo y los favoritos. El modelo usa UUID
para usuarios, identificadores enteros para productos y una llave primaria compuesta para evitar
favoritos duplicados.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 13 o superior
- npm
- Postman

## Instalación

```powershell
npm install
Copy-Item .env.example .env
```

Configura `DATABASE_URL`, `JWT_SECRET` y las credenciales del administrador en `.env`.

## Inicialización

```powershell
npm run init-db
npm start
```

El script crea la base `catalogo_db` si no existe, las tablas, un usuario administrador, y cinco
productos ficticios. Al eliminar un producto, sus favoritos se eliminan automáticamente por
`ON DELETE CASCADE`.

## Variables de entorno

- `PORT`: puerto HTTP.
- `DATABASE_URL`: cadena de conexión PostgreSQL.
- `JWT_SECRET`: clave para firmar y verificar JWT.
- `JWT_EXPIRES_IN`: duración del token, por ejemplo `2h`.
- `ADMIN_*`: datos locales del administrador inicial.

## Rutas

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/auth/registro` | Público |
| POST | `/auth/login` | Público |
| GET | `/productos?categoria=Tecnología` | Público |
| GET | `/productos/:id` | Público |
| POST | `/productos` | Administrador |
| PUT | `/productos/:id` | Administrador |
| DELETE | `/productos/:id` | Administrador |
| GET | `/favoritos` | Usuario autenticado |
| POST | `/favoritos` | Usuario autenticado |
| DELETE | `/favoritos/:productoId` | Propietario autenticado |

## Ejemplos

### Registro

```json
{ "nombre": "Usuario Uno", "email": "uno@ejemplo.local", "password": "Prueba123!" }
```

### Login

```json
{ "email": "uno@ejemplo.local", "password": "Prueba123!" }
```

### Crear producto

```json
{
  "nombre": "Mouse Gamer",
  "descripcion": "Mouse óptico de seis botones",
  "categoria": "Tecnología",
  "precio": 90000
}
```

### Agregar favorito

```json
{ "productoId": 1 }
```

## Pruebas reproducibles

1. Importa `postman/Catalogo_Postman.json` y `postman/Catalogo.postman_environment.json`.
2. Ejecuta las peticiones por orden.
3. El flujo toma el token administrador y tokens de usuarios automáticamente mediante scripts.
4. Reinicia Node.js y repite `GET /productos` y `GET /favoritos` para comprobar persistencia.

## Seguridad

El registro ignora cualquier campo de rol y siempre crea `usuario`. Las contraseñas se almacenan
como hash bcrypt y las respuestas nunca incluyen el hash. Todas las rutas protegidas verifican firma
y vencimiento JWT. Los favoritos se consultan siempre por el UUID obtenido del token.
