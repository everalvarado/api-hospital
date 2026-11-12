# API Hospitalaria

Node.js + **Express 5** + **Sequelize** + PostgreSQL · puerto **3001** · base **hospital_db**.

Toma como base la API original (`app.js`, `config`, morgan, nodemon, `sync` + `seedInicial`)
y le agrega roles, control de peso y talla, horarios, países y las reglas del diagrama.

```
API/
├── .env              ← conexión (DB_NAME=hospital_db, DB_PASSWORD, PORT=3001, JWT_SECRET)
├── .gitignore
├── package.json      ← npm start · npm run dev (nodemon) · npm run db:reset
├── render.yaml       ← despliegue en Render (base + API)
├── api.http          ← ejemplos de cada ruta (extensión REST Client)
└── src/
    ├── app.js        ← dispara el servidor, define las rutas (app.use), sync + seed
    ├── config/
    │   ├── index.js      ← require('./config') devuelve la conexión
    │   └── database.js   ← conexión con PostgreSQL (Sequelize)
    ├── models/       ← un modelo por tabla (mayúscula y singular) + index.js con TODAS las relaciones
    ├── controllers/  ← un controlador por recurso
    ├── routes/       ← auth.js medicos.js turnos.js control.js paises.js horarios.js …
    ├── middlewares/  ← token JWT, permisos por rol, manejo de errores
    ├── utils/        ← agenda (horarios y cupos), roles, consulta de turnos
    └── database/
        ├── crearBase.js           ← crea hospital_db si no existe
        ├── reset.js               ← npm run db:reset (borra y recrea todo)
        └── seeders/seedInicial.js ← regla de aprobación (trigger) + datos iniciales
```

## Uso
```bash
npm install
npm run dev        # http://localhost:3001  (crea base, tablas y datos la primera vez)
```

## Rutas

Los nombres son los mismos que la API original
(`/auth`, `/medicos`, `/turnos`, `/control`, `/paises`, `/horarios`). Las rutas
privadas llevan el header `Authorization: Bearer <token>` que devuelve el login.

| Método y ruta | Quién | Qué hace |
|---------------|-------|----------|
| `GET /` | público | Estado de la API y lista de rutas |
| `GET /health` | público | Prueba la conexión con la base |
| `POST /auth/login` | público | `{ usuario, contraseña, rol? }` → token. Sin `rol`, entra con el rol principal |
| `POST /auth/registro-paciente` | público | Alta de paciente (dni, nombre, apellido, sexo, fecha_nacimiento, teléfono, email, dirección, ciudad, id_pais, obra_social, numero_afiliado, usuario, contraseña) |
| `GET /auth/me` | logueado | Datos del token |
| `GET /medicos?especialidad=` | público | Médicos con sus especialidades |
| `POST /medicos/login` | público | Login de médicos `{ usuario, contraseña }` (ej. med001 / med123) |
| `GET /medicos/:id` | público | Médico con especialidades y horarios |
| `GET /medicos/:id/turnos?fecha=&estado=` | médico (el propio), enfermero, admin | Agenda del médico |
| `GET /medicos/:id/pacientes/:idPaciente` | médico, admin | Ficha del paciente con controles y turnos |
| `POST /medicos/:id/especialidades` · `DELETE /medicos/:id/especialidades/:idEsp` | admin | Asignar / quitar especialidad |
| `GET /turnos?fecha=&estado=&id_medico=&id_paciente=` | logueado | Paciente y médico ven solo los suyos |
| `POST /turnos` | paciente | `{ id_medico, id_especialidad, fecha, hora, motivo, prioridad_comunidad }` |
| `PATCH /turnos/:id/aprobar` | enfermero | `{ id_consultorio }`; exige control verificado (Regla 1) |
| `PATCH /turnos/:id/cancelar` | paciente, enfermero, admin | Cancelar |
| `PATCH /turnos/:id/atender` | médico | Marcar como atendido |
| `GET /turnos/prioridad` | admin | Turnos con prioridad por día (Regla 2) |
| `GET /control?id_paciente=` | logueado | Controles de peso y talla |
| `POST /control` · `PATCH /control/:id/verificar` | enfermero | Registrar / verificar control |
| `GET /paises` | público | Países · `POST` y `DELETE /paises/:id` solo admin |
| `GET /horarios?id_medico=` | público | Horarios de atención |
| `GET /horarios/disponibles?id_medico=&fecha=` | logueado | Turnos libres del día |
| `POST /horarios` · `DELETE /horarios/:id` | admin | Cargar / quitar horarios |
| `/especialidades`, `/consultorios`, `/personas`, `/usuarios`, `/estadisticas/resumen`, `/perfil` | según rol | Rutas extra que usan los paneles |

En `api.http` hay ejemplos listos para probar con la extensión REST Client.
