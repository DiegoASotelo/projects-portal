# Auth architecture limpia

## Objetivo
Separar claramente:
- Auth de Supabase para iniciar sesión
- perfiles en `app_users`
- membresías en `project_memberships`
- datos de checklist por usuario

## Modelo correcto
- `auth.users`
  - identidad de login
- `public.app_users`
  - perfil mínimo: `id`, `email`, `display_name`
- `public.project_memberships`
  - `project_id`, `user_id`, `role`, `status`, `plan`, trial dates
- `public.checklists`
  - checklist del usuario
- `public.checklist_cards`
  - progreso por cromo

## Regla clave
Los usuarios NO acceden a la base como usuarios libres.
Acceden a la app, la app usa su sesión Auth, y RLS decide qué filas puede leer o escribir.

## RLS deseado
### `app_users`
- usuario lee/edita solo su perfil
- admin del proyecto puede leer perfiles de usuarios con membership en ese proyecto

### `project_memberships`
- usuario lee solo su membership
- admin del proyecto puede leer todas las memberships de ese proyecto
- admin del proyecto puede actualizar plan/status de memberships de ese proyecto

### `checklists`
- usuario lee/escribe solo sus checklists

### `checklist_cards`
- usuario lee/escribe solo cards de checklists propias

## Admin UI
No crear una auth paralela.
El admin es un usuario Auth normal cuyo `role='admin'` en `project_memberships` habilita la vista admin.
