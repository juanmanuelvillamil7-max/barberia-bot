export default function PrivacyPolicy() {
  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        lineHeight: "1.6",
        color: "#222",
      }}
    >
      <h1>Política de Privacidad — Barbería El Navajero Bot</h1>
      <p>
        <strong>Última actualización:</strong> mayo de 2026
      </p>

      <h2>1. Información que recopilamos</h2>
      <p>
        Al interactuar con nuestro asistente virtual de WhatsApp, recopilamos:
      </p>
      <ul>
        <li>Número de teléfono de WhatsApp</li>
        <li>Nombre proporcionado voluntariamente para agendar turnos</li>
        <li>Historial de conversación con el bot</li>
        <li>Fecha, hora y servicio de los turnos agendados</li>
      </ul>

      <h2>2. Uso de la información</h2>
      <p>La información recopilada se utiliza exclusivamente para:</p>
      <ul>
        <li>Gestionar reservas de turnos en la barbería</li>
        <li>Enviar confirmaciones y recordatorios de turnos</li>
        <li>Mejorar la experiencia del asistente virtual</li>
      </ul>

      <h2>3. Almacenamiento y seguridad</h2>
      <p>
        Los datos se almacenan en servidores seguros. El historial de
        conversación se elimina automáticamente después de 24 horas de
        inactividad. No compartimos tus datos con terceros salvo los necesarios
        para operar el servicio (WhatsApp/Meta, servicios de calendario).
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Podés solicitar la eliminación de tus datos en cualquier momento
        enviando un mensaje al bot con el texto "eliminar mis datos" o
        contactándonos directamente.
      </p>

      <h2>5. Contacto</h2>
      <p>
        Para consultas sobre privacidad contactanos por WhatsApp al mismo número
        del bot.
      </p>
    </main>
  );
}
