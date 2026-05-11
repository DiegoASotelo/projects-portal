# Checklist Adrenaline XL WorlCup 26, plan plataforma multiusuario

## Objetivo
Convertir la checklist actual en una plataforma multiusuario de pago, donde cada usuario tenga acceso a una checklist propia y el administrador pueda gestionar cuentas.

## Arquitectura recomendada
- Frontend web desplegado en Cloudflare Pages
- Backend API propio
- Base de datos relacional, mejor Postgres
- Auth con Google OAuth y email/password
- Panel admin separado o ruta protegida `/admin`
- Persistencia por usuario en servidor, no en localStorage como fuente principal

## MVP técnico
### Frontend
- Login con Google
- Login con email/password
- Estado de sesión real con token seguro
- Checklist ligada al `user_id`
- Logout
- Pantalla de cuenta bloqueada si admin desactiva usuario

### Backend
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/logout`
- `GET /me`
- `GET /checklist`
- `PUT /checklist/:cardId`
- `POST /admin/users`
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`

### Modelo de datos
#### users
- id
- email
- password_hash nullable
- google_sub nullable
- name
- role (`admin` | `user`)
- status (`active` | `disabled`)
- plan
- checklist_limit
- created_at
- updated_at

#### checklists
- id
- user_id
- collection_key
- created_at
- updated_at

#### checklist_cards
- id
- checklist_id
- card_number
- owned_count
- updated_at

## Gestión admin
El admin debe poder:
- crear cuentas
- activar cuentas
- desactivar cuentas
- borrar cuentas
- ver email, plan, estado y última actividad
- resetear acceso de usuario si hace falta

## Stack recomendado
### opción simple y barata
- Cloudflare Pages para frontend
- Supabase para Postgres + Auth + storage si queremos acelerar
- panel admin en la misma app con rol admin

### opción más controlada
- Frontend en Cloudflare Pages
- Backend Node/Fastify o Nest
- Postgres gestionado
- JWT + refresh tokens en cookies seguras

## Recomendación
Para arrancar rápido y cobrar antes:
- usar **Supabase**
- mantener frontend estático
- usar tabla propia para estado de checklist
- usar Google login y email/password en Supabase Auth
- hacer panel admin dentro de la misma app solo para tu usuario admin

## Próximos pasos
1. Crear proyecto Supabase
2. Configurar Google OAuth web
3. Crear esquema de usuarios y checklist
4. Rehacer frontend para usar backend real
5. Añadir panel admin mínimo
6. Añadir control de cuentas activas/desactivadas
7. Preparar cobro después
