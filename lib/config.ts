export const BARBERIA_CONFIG = {
  nombre: "Barbería El Navajero",
  profesional: "Martín",
  ciudad: "Buenos Aires",
  // 1=lunes, 2=martes, ..., 6=sábado (0=domingo excluido)
  diasLaborales: [1, 2, 3, 4, 5, 6],
  horarioAtencion: {
    inicio: "09:00",
    fin: "20:00",
  },
  slotMinutos: 15,
  diasMaxReserva: 14,
  timezone: "America/Argentina/Buenos_Aires",
  // Cuántos mensajes del historial enviar al modelo
  historialMensajes: 10,
  // Cuántos mensajes guardar en DB por conversación
  maxMensajesGuardados: 20,
  // Horas de inactividad para limpiar historial
  horasInactividad: 24,
};
