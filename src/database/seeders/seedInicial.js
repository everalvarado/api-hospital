// =============================================================
//  SEED INICIAL
//  1) Crea en PostgreSQL la regla de aprobación de turnos (trigger).
//  2) Si la base está vacía, carga roles, usuarios, médicos, especialidades,
//     consultorios, países, horarios, controles y turnos de ejemplo.
//
//  Usuarios iniciales:
//    Administrador: admin / admin123
//    Médicos:       med001 ... med005 / med123
//    Enfermera:     enfermera / enfermera123
//    Pacientes:     juan / paciente123 · sofia / paciente123
// =============================================================
const bcrypt = require('bcryptjs');
const sequelize = require('../../config');
const {
  Rol, Persona, Usuario, PersonaRol, Especialidad, MedicoEspecialidad,
  Consultorio, Pais, HorarioMedico, PesoTalla, Turno,
} = require('../../models');

// ------------------------------------------------------------------
// REGLAS 1 y 3 (en la base de datos):
//  * Un turno solo puede aprobarse si el paciente tiene un control de
//    PESO_TALLA verificado previo a la fecha del turno.
//  * Al aprobarse, el turno se asocia al control verificado más reciente.
// ------------------------------------------------------------------
const FUNCION_APROBACION = `
CREATE OR REPLACE FUNCTION fn_validar_aprobacion_turno()
RETURNS TRIGGER AS $$
DECLARE
    v_control INT;
BEGIN
    IF NEW.estado = 'Aprobado'
       AND (TG_OP = 'INSERT' OR OLD.estado IS DISTINCT FROM 'Aprobado') THEN
        SELECT id_control INTO v_control
          FROM peso_talla
         WHERE id_paciente   = NEW.id_paciente
           AND verificado    = TRUE
           AND fecha_control <= NEW.fecha
         ORDER BY fecha_control DESC, id_control DESC
         LIMIT 1;
        IF v_control IS NULL THEN
            RAISE EXCEPTION 'No se puede aprobar el turno: el paciente no tiene un control de peso y talla verificado.'
                  USING ERRCODE = 'P0001';
        END IF;
        NEW.id_control := v_control;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

async function crearReglas() {
  await sequelize.query(FUNCION_APROBACION);
  await sequelize.query('DROP TRIGGER IF EXISTS trg_validar_aprobacion_turno ON turno;');
  await sequelize.query(`CREATE TRIGGER trg_validar_aprobacion_turno
    BEFORE INSERT OR UPDATE OF estado ON turno
    FOR EACH ROW EXECUTE FUNCTION fn_validar_aprobacion_turno();`);
}

// Fecha 'YYYY-MM-DD' desplazada n días desde hoy
const dia = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function cargarDatos(transaction) {
  const t = { transaction };

  // Roles
  const rol = {};
  for (const nombre_rol of ['Administrador', 'Enfermero', 'Médico', 'Paciente']) {
    rol[nombre_rol] = (await Rol.create({ nombre_rol }, t)).id_rol;
  }

  // Países
  const paises = {};
  for (const nombre of ['Argentina', 'Bolivia', 'Brasil', 'Chile', 'Paraguay', 'Perú', 'Uruguay', 'Venezuela', 'Otro']) {
    paises[nombre] = (await Pais.create({ nombre }, t)).id_pais;
  }

  // Especialidades
  const esp = {};
  for (const nombre of ['Clínica Médica', 'Pediatría', 'Cardiología', 'Ginecología', 'Traumatología']) {
    esp[nombre] = (await Especialidad.create({ nombre }, t)).id_especialidad;
  }

  // Consultorios
  const cons = {};
  for (const [numero, descripcion] of [[101, 'Planta baja - Clínica'], [102, 'Planta baja - Pediatría'],
    [201, 'Primer piso - Cardiología'], [202, 'Primer piso - Ginecología'], [203, 'Primer piso - Traumatología']]) {
    cons[numero] = (await Consultorio.create({ numero, descripcion }, t)).id_consultorio;
  }

  // Personas con usuario y roles
  async function crearPersona(datos, usuario, contrasena, roles) {
    const p = await Persona.create({ id_pais: paises.Argentina, ...datos }, t);
    await Usuario.create({ nombre_usuario: usuario, contrasena: await bcrypt.hash(contrasena, 10), id_persona: p.id_persona }, t);
    for (const id_rol of roles) await PersonaRol.create({ id_persona: p.id_persona, id_rol }, t);
    return p.id_persona;
  }

  await crearPersona({ dni: '20111222', nombre: 'Laura', apellido: 'Gómez', sexo: 'F', email: 'admin@hospital.com', ciudad: 'Corrientes' },
    'admin', 'admin123', [rol.Administrador]);
  const idEnfermera = await crearPersona({ dni: '28333444', nombre: 'Marta', apellido: 'Benítez', sexo: 'F', email: 'mbenitez@hospital.com', ciudad: 'Corrientes' },
    'enfermera', 'enfermera123', [rol.Enfermero]);

  // Médicos med001 ... med005 (contraseña med123) con especialidades y horarios
  // dia_semana: 0 = domingo, 1 = lunes ... 6 = sábado
  const MEDICOS = [
    { u: 'med001', dni: '25555666', nombre: 'Carlos', apellido: 'Fernández', sexo: 'M', esp: ['Clínica Médica', 'Cardiología'],
      horarios: [0, 1, 2, 3, 4, 5, 6].map((d) => [d, '08:00', '13:00', 101]) },
    { u: 'med002', dni: '27777888', nombre: 'Ana', apellido: 'Ríos', sexo: 'F', esp: ['Pediatría', 'Ginecología'],
      horarios: [[1, '08:00', '14:00', 102], [3, '08:00', '14:00', 102], [5, '08:00', '14:00', 102], [2, '14:00', '18:00', 202], [4, '14:00', '18:00', 202]] },
    { u: 'med003', dni: '26111333', nombre: 'Jorge', apellido: 'Sosa', sexo: 'M', esp: ['Traumatología'],
      horarios: [1, 2, 3, 4, 5].map((d) => [d, '08:00', '12:00', 203]) },
    { u: 'med004', dni: '29444555', nombre: 'Silvia', apellido: 'Acuña', sexo: 'F', esp: ['Clínica Médica'],
      horarios: [1, 2, 3, 4, 5].map((d) => [d, '14:00', '18:00', 101]) },
    { u: 'med005', dni: '24666777', nombre: 'Martín', apellido: 'Ledesma', sexo: 'M', esp: ['Cardiología'],
      horarios: [[2, '08:00', '12:00', 201], [4, '08:00', '12:00', 201], [6, '08:00', '12:00', 201]] },
  ];
  const med = {};
  for (const [i, m] of MEDICOS.entries()) {
    const id = await crearPersona({
      dni: m.dni, nombre: m.nombre, apellido: m.apellido, sexo: m.sexo,
      email: `${m.u}@hospital.com`, ciudad: 'Corrientes', matricula: `MP00${i + 1}`,
    }, m.u, 'med123', [rol['Médico']]);
    med[m.u] = id;
    for (const e of m.esp) await MedicoEspecialidad.create({ id_medico: id, id_especialidad: esp[e] }, t);
    for (const [dia_semana, hora_inicio, hora_fin, numero] of m.horarios) {
      await HorarioMedico.create({ id_medico: id, dia_semana, hora_inicio, hora_fin, duracion_minutos: 30, id_consultorio: cons[numero] }, t);
    }
  }

  // Pacientes
  const juan = await crearPersona({
    dni: '40999000', nombre: 'Juan', apellido: 'Pérez', sexo: 'M', fecha_nacimiento: '2001-05-15', telefono: '3794000005',
    email: 'jperez@mail.com', direccion: 'Paraje Las Lomas s/n', ciudad: 'Paraje Las Lomas', obra_social: 'IOSCOR', numero_afiliado: '458812',
  }, 'juan', 'paciente123', [rol.Paciente]);
  const sofia = await crearPersona({
    dni: '42123123', nombre: 'Sofía', apellido: 'López', sexo: 'F', fecha_nacimiento: '1999-09-09', telefono: '3794000006',
    email: 'slopez@mail.com', direccion: 'Mendoza 77', ciudad: 'Corrientes', obra_social: 'Sin obra social',
  }, 'sofia', 'paciente123', [rol.Paciente]);

  // Controles de peso y talla (Juan verificado; Sofía todavía no)
  await PesoTalla.create({ fecha_control: dia(-10), peso: 72.5, talla: 175, verificado: true, id_paciente: juan, id_enfermera: idEnfermera }, t);
  await PesoTalla.create({ fecha_control: dia(-2), peso: 71.8, talla: 175, verificado: true, id_paciente: juan, id_enfermera: idEnfermera }, t);
  await PesoTalla.create({ fecha_control: dia(-1), peso: 58.3, talla: 162, verificado: false, id_paciente: sofia, id_enfermera: idEnfermera }, t);

  // Turnos pendientes de ejemplo
  await Turno.create({ fecha: dia(1), hora: '08:00', estado: 'Pendiente', prioridad_comunidad: true, id_paciente: juan,
    id_medico: med.med001, id_especialidad: esp['Clínica Médica'], motivo: 'Control general y dolor de cabeza' }, t);
  await Turno.create({ fecha: dia(1), hora: '09:00', estado: 'Pendiente', prioridad_comunidad: false, id_paciente: sofia,
    id_medico: med.med001, id_especialidad: esp['Clínica Médica'], motivo: 'Control anual' }, t);
}

async function seedInicial() {
  await crearReglas();
  if (await Rol.count()) {
    console.log('Datos iniciales ya cargados');
    return;
  }
  await sequelize.transaction((transaction) => cargarDatos(transaction));
  console.log('Datos iniciales cargados (admin/admin123, med001..med005/med123, enfermera/enfermera123, juan/paciente123)');
}

module.exports = seedInicial;
