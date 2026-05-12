# Siguiente paso real para dejar Supabase operativo

## Ya está hecho
- Proyecto Supabase creado
- Google provider activo
- Email auth activo
- Schema multi-proyecto creado
- Proyecto `checklist-adrenalyn-xl-worldcup-26` insertado en base
- Frontend preparado con config pública

## Lo que queda
La app todavía está en modo mock para la lógica de sesión y datos. El siguiente paso es sustituir:
- creación/login mock
- panel admin mock
- checklist en localStorage

por:
- Supabase Auth
- tablas reales de Postgres
- lecturas/escrituras reales por usuario

## Orden recomendado
1. añadir cliente JS oficial de Supabase al proyecto
2. login real email/password
3. login real con Google
4. bootstrap de `app_users` tras login
5. bootstrap de `project_memberships`
6. crear o leer checklist del usuario
7. persistir `checklist_cards`
8. limitar trial y acceso por membresía
9. mover admin a queries reales
