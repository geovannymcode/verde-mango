# 🥭 Verde Mango

Backend de e-commerce (frutas, verduras y recetas) construido como **monolito modular** con **Spring Boot 3 + Kotlin + Spring Modulith**.

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Lenguaje | Kotlin 2.0.21 (JVM 21) |
| Framework | Spring Boot 3.4.4 |
| Arquitectura | Spring Modulith 1.3.12 (monolito modular) |
| Persistencia | Spring Data JPA + PostgreSQL 17 |
| Migraciones | Flyway |
| Cache | Redis (Spring Cache) |
| Seguridad | Spring Security + JWT (jjwt) |
| Documentación API | springdoc-openapi (Swagger UI) |
| Build | Gradle (Kotlin DSL) |
| Contenedores dev | Docker Compose (Postgres, Redis) — se levantan automáticamente al correr la app |
| Tests | JUnit 5, MockK, springmockk, Testcontainers, Spring Modulith Test |

## Arquitectura

La aplicación es un **único deployable** (`backend/app`) organizado en módulos verticales según [Spring Modulith](https://spring.io/projects/spring-modulith), donde cada paquete de primer nivel bajo `com.geovannycode.verdemango` es un módulo independiente:

```
com.geovannycode.verdemango
├── auth        # Registro, login, JWT, refresh tokens
├── catalog     # Productos, categorías, ratings de productos
├── orders      # Carrito, checkout, órdenes
├── payment     # Integración de pagos (Wompi)
├── recipes     # Recetas, ratings de recetas
└── common      # Módulo compartido (OPEN): DTOs, constantes, seguridad, eventos comunes
```

Cada módulo sigue la misma sub-estructura interna:

```
<modulo>/
├── domain/       # Entidades JPA y lógica de dominio
├── repository/   # Spring Data repositories
├── service/      # Casos de uso / lógica de aplicación
└── web/          # Controllers REST + DTOs
```

**Comunicación entre módulos**: exclusivamente mediante `ApplicationEventPublisher` / `@EventListener` de Spring (eventos de dominio), nunca por acceso directo a paquetes internos de otro módulo. Los eventos publicados quedan registrados de forma transaccional en la base de datos (`spring-modulith-starter-jdbc`), garantizando reintento ante fallos o reinicios (`republish-outstanding-events-on-restart`).

Las reglas de modularidad (que ningún módulo acceda a las internals de otro) se verifican automáticamente en el test `@/Users/geovanny/Documents/Developer/Kotlin/verde-mango/backend/app/src/test/kotlin/com/geovannycode/verdemango/ModularityTests.kt` vía `ApplicationModules.verify()`.

## Estructura del proyecto

```
verde-mango/
├── backend/
│   └── app/                          # Único módulo Gradle (el monolito)
│       └── src/main/
│           ├── java/...common/       # package-info.java (anotación @ApplicationModule OPEN)
│           ├── kotlin/...verdemango/ # Código fuente por módulo (ver arriba)
│           └── resources/
│               ├── application.yaml
│               └── db/migration/     # Migraciones Flyway (V1..V7)
├── infrastructure/
│   ├── docker-compose.yml            # Postgres + Redis
│   └── init-databases.sql
├── postman/                          # Colección Postman para pruebas manuales (local, gitignored)
├── build.gradle.kts                  # Config raíz (Kotlin, JVM 21)
├── settings.gradle.kts               # include("backend:app")
└── gradlew / gradlew.bat
```

## Requisitos previos

- **JDK 21**
- **Docker Desktop** (para Postgres y Redis vía Docker Compose)
- No es necesario instalar Postgres/Redis manualmente: Spring Boot Docker Compose los levanta y detiene automáticamente al ejecutar/parar la app.

## Cómo ejecutar

```bash
# Clonar y entrar al proyecto
git clone <repo-url>
cd verde-mango

# Levantar la aplicación (levanta Postgres + Redis automáticamente)
./gradlew :backend:app:bootRun
```

La app queda disponible en `http://localhost:8080`.

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/api-docs`
- **Actuator health**: `http://localhost:8080/actuator/health`
- **Actuator modulith** (info de módulos): `http://localhost:8080/actuator/modulith`

### Usuario administrador precargado

Las migraciones (`V1__auth_tables.sql`) incluyen un usuario `SUPER_ADMIN` inicial:

```
email: admin@verdemango.com
```

(La contraseña está hasheada en la migración; defínela/cámbiala según tu entorno antes de usarla en producción).

## Configuración

La configuración vive en `@/Users/geovanny/Documents/Developer/Kotlin/verde-mango/backend/app/src/main/resources/application.yaml`. Variables de entorno soportadas (con valores por defecto para desarrollo local):

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexión PostgreSQL | `localhost`, `5432`, `verdemango_db` |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales DB | `postgres` / `postgres` |
| `REDIS_HOST`, `REDIS_PORT` | Conexión Redis | `localhost`, `6379` |
| `JWT_SECRET` | Clave firma JWT | valor de desarrollo (cambiar en prod) |
| `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Expiración de tokens (ms) | 15 min / 7 días |
| `WOMPI_ENVIRONMENT` | `sandbox` o `production` | `sandbox` |
| `WOMPI_SANDBOX_*` / `WOMPI_PRODUCTION_*` | Llaves de la pasarela de pagos Wompi | — |
| `FRONTEND_URL` | URL de redirección post-pago | `http://localhost:3000` |

## Módulos y funcionalidades

### `auth`
Registro, login, refresh de tokens JWT, logout y perfil del usuario autenticado.

### `catalog`
CRUD de productos y categorías (admin), listado público con filtros/paginación/orden, productos destacados/relacionados, ratings y reseñas de productos.

### `orders`
Carrito de compras (invitado por sesión o usuario autenticado, con fusión al iniciar sesión), checkout con validación de stock/precio, gestión de órdenes (usuario y admin) con historial de estados.

### `payment`
Integración con la pasarela **Wompi** (Colombia) para procesar pagos; publica eventos de dominio (`PaymentCompletedEvent`) que consume el módulo `orders` para confirmar la orden — comunicación 100% en memoria vía Spring Events (sin broker externo).

### `recipes`
CRUD de recetas (admin) con pasos, ingredientes y nutrición; listado público, búsqueda, filtros por categoría/tag/dificultad, ratings de recetas.

### `common` (módulo `OPEN`)
Elementos compartidos entre todos los módulos: `ApiResponse`, `PageResponse`, constantes (`AppConstants`, `SecurityConstants`), enums de dominio compartidos (`Role`, `OrderStatus`, `PaymentStatus`), filtro JWT y utilidades de seguridad.

## Base de datos

Una **única base de datos** (`verdemango_db`) compartida por todos los módulos, versionada con Flyway:

| Migración | Contenido |
|---|---|
| `V1__auth_tables.sql` | Usuarios, refresh tokens, password reset |
| `V2__catalog_tables.sql` | Productos, categorías, ratings |
| `V3__order_tables.sql` | Carritos, órdenes, historial de estados |
| `V4__order_functions.sql` | Funciones/triggers de órdenes |
| `V5__payment_tables.sql` | Transacciones de pago |
| `V6__recipe_tables.sql` | Recetas, pasos, ingredientes, tags |
| `V7__seed_data.sql` | Datos de ejemplo |

Spring Modulith agrega además su propia tabla de tracking de eventos (`event_publication`), inicializada automáticamente (`modulith.events.jdbc.schema-initialization.enabled`).

## Tests

```bash
# Todos los tests
./gradlew :backend:app:test

# Build completo (compilar + test + verificar modularidad)
./gradlew :backend:app:build
```

`ModularityTests` verifica que la estructura de paquetes respete los límites de módulos de Spring Modulith y puede generar documentación (diagramas C4/UML) del sistema.

## Pruebas manuales de la API

Ver `@/Users/geovanny/Documents/Developer/Kotlin/verde-mango/postman/README.md` para la colección de Postman con todos los endpoints, variables de entorno y flujo recomendado de pruebas (registro → login → catálogo → carrito → checkout → órdenes → recetas).

## Convenciones de código

- Un módulo = un paquete de primer nivel bajo `com.geovannycode.verdemango`, con sub-paquetes `domain/repository/service/web`.
- Comunicación entre módulos únicamente vía eventos de dominio (`ApplicationEventPublisher`), nunca importando clases internas de otro módulo.
- DTOs de request con validación Bean Validation (`jakarta.validation`); DTOs de response inmutables (`data class`) con factory `from(...)`.
- Inyección de dependencias por constructor con propiedades `val`/`private final`.
