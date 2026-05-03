"use client";

import { useState, useEffect, useCallback } from "react";
import { BARBERIA_CONFIG } from "@/lib/config";
import ServiceSelector from "@/components/booking/ServiceSelector";
import DaySelector from "@/components/booking/DaySelector";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import BookingSuccess from "@/components/booking/BookingSuccess";
import type { Service, AvailableSlot } from "@/types";

type Step = 1 | 2 | 3 | 4 | 5;

interface BookingResultData {
  id: string;
  client_name: string;
  client_email: string;
  appointment_date: string;
  start_time: string;
}

function generateAvailableDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= BARBERIA_CONFIG.diasMaxReserva; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    if (BARBERIA_CONFIG.diasLaborales.includes(dayOfWeek)) {
      dates.push(d.toISOString().split("T")[0]);
    }
  }

  return dates;
}

export default function ReservarPage() {
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResultData | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const availableDates = generateAvailableDates();

  // Load services on mount
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(console.error);
  }, []);

  // Load slots when date or service changes (step 3)
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res = await fetch(
        `/api/availability?date=${selectedDate}&duration=${selectedService.duration_minutes}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch (err) {
      console.error("loadSlots error:", err);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, selectedService]);

  useEffect(() => {
    if (step === 3) {
      loadSlots();
    }
  }, [step, loadSlots]);

  async function handleConfirm(name: string, email: string) {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setClientName(name);
    setClientEmail(email);
    setError(null);
    setBookingLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          clientEmail: email,
          date: selectedDate,
          time: selectedTime,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al confirmar el turno. Intentá de nuevo.");
        return;
      }

      setBookingResult(data.appointment);
      setStep(5);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setBookingLoading(false);
    }
  }

  function handleNewBooking() {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setBookingResult(null);
    setClientName("");
    setClientEmail("");
    setError(null);
  }

  function goNext() {
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  }

  function goPrev() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
    setError(null);
  }

  const canGoNext =
    (step === 1 && selectedService !== null) ||
    (step === 2 && selectedDate !== null) ||
    (step === 3 && selectedTime !== null);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f4f4f5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#111827",
          padding: "1rem 1.25rem",
          color: "#ffffff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
          {BARBERIA_CONFIG.nombre}
        </h1>
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>
          Lun–Sáb · {BARBERIA_CONFIG.horarioAtencion.inicio} a {BARBERIA_CONFIG.horarioAtencion.fin}hs
        </p>
      </header>

      {/* Progress bar — only steps 1-4 */}
      {step <= 4 && (
        <div
          style={{
            background: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.4rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
              Paso {step} de 4
            </p>
            {step > 1 && step < 5 && (
              <button
                onClick={goPrev}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ← Atrás
              </button>
            )}
          </div>
          <div
            style={{
              height: "4px",
              background: "#e5e7eb",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(step / 4) * 100}%`,
                background: "#3b82f6",
                borderRadius: "2px",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem 1.25rem",
          maxWidth: "480px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              color: "#991b1b",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {step === 1 && (
          <ServiceSelector
            services={services}
            selected={selectedService}
            onSelect={(s) => { setSelectedService(s); goNext(); }}
          />
        )}

        {step === 2 && (
          <DaySelector
            availableDates={availableDates}
            selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); goNext(); }}
          />
        )}

        {step === 3 && (
          <TimeSlotGrid
            slots={slots}
            selected={selectedTime}
            onSelect={(t) => { setSelectedTime(t); goNext(); }}
            loading={slotsLoading}
          />
        )}

        {step === 4 && selectedService && selectedDate && selectedTime && (
          <BookingConfirmation
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            onConfirm={handleConfirm}
            isLoading={bookingLoading}
          />
        )}

        {step === 5 && bookingResult && selectedService && selectedDate && selectedTime && (
          <BookingSuccess
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            clientName={clientName}
            clientEmail={clientEmail}
            appointmentId={bookingResult.id}
            onNewBooking={handleNewBooking}
          />
        )}
      </main>

      {/* Next button for steps that auto-advance on selection already, but just in case */}
      {canGoNext && step <= 3 && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            padding: "1rem 1.25rem",
          }}
        >
          <button
            onClick={goNext}
            style={{
              width: "100%",
              maxWidth: "480px",
              margin: "0 auto",
              display: "block",
              padding: "0.85rem",
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
