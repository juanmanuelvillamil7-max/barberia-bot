import { Resend } from "resend";
import { BARBERIA_CONFIG } from "./config";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  return new Resend(apiKey);
}

export async function sendConfirmationEmail(
  to: string,
  clientName: string,
  service: string,
  date: string,
  startTime: string,
  price: number,
  appointmentId: string
): Promise<void> {
  const resend = getResendClient();

  const displayDate = new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayPrice = `$${price.toLocaleString("es-AR")}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://barberia-bot.vercel.app"}/cancelar/${appointmentId}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Turno Confirmado — ${BARBERIA_CONFIG.nombre}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${BARBERIA_CONFIG.nombre}</h1>
              <p style="color:#9ca3af;margin:8px 0 0;font-size:14px;">Confirmación de turno</p>
            </td>
          </tr>

          <!-- Check icon -->
          <tr>
            <td style="padding:32px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="display:inline-block;background:#d1fae5;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">✓</div>
              <h2 style="color:#111827;margin:16px 0 4px;font-size:20px;">¡Turno confirmado!</h2>
              <p style="color:#6b7280;margin:0;font-size:15px;">Hola <strong>${clientName}</strong>, tu reserva está lista.</p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Servicio</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${service}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Fecha</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${displayDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Hora</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${startTime}hs</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:0;">
                    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Precio</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${displayPrice}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cancel link -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="color:#6b7280;font-size:13px;margin:0 0 12px;">¿No podés asistir? Cancelá sin cargo con anticipación.</p>
              <a href="${cancelUrl}" style="color:#ef4444;font-size:13px;text-decoration:underline;">Cancelar este turno</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">${BARBERIA_CONFIG.nombre} · Buenos Aires, Argentina</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: `${BARBERIA_CONFIG.nombre} <noreply@resend.dev>`,
    to,
    subject: `Turno confirmado — ${service} el ${displayDate}`,
    html,
  });
}
