export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed";
  google_event_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  phone_number: string;
  messages: ConversationMessage[];
  last_activity: string;
  created_at: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface AvailableSlot {
  time: string;
  display: string;
}

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  googleEventId?: string;
  error?: string;
}

export interface BookingRequest {
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  serviceId: string;
  serviceName: string;
}

export interface AdminStats {
  turnosHoy: number;
  ingresosHoy: number;
  turnosSemana: number;
  ingresosMes: number;
  variacionMes: number | null;
  turnosDeHoy: Array<{
    date: string;
    status: "confirmed" | "cancelled" | "completed";
    client_name: string;
    start_time: string;
    end_time: string;
    service_name: string;
    price: number;
  }>;
}

export interface FinanceData {
  period: "week" | "month" | "today";
  ingresosPorDia: Array<{ date: string; total: number }>;
  desglosePorServicio: Array<{ name: string; total: number; count: number }>;
  totalPeriodo: number;
}

export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  created_at: string;
}

export interface ClientWithStats extends Client {
  total_cuts: number;
  last_visit: string | null;
}

export interface ServiceFormData {
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}
