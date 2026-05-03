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
    if (BARBERIA_CONFIG.diasLaborales.includes(d.getDay())) {
      dates.push(d.toISOString().split("T")[0]);
    }
  }
  return dates;
}

const STEP_LABELS = ["Servicio", "Fecha", "Horario", "Confirmar"];

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
  const [error, setError] = useState<string | null>(null);

  const availableDates = generateAvailableDates();

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(console.error);
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/availability?date=${selectedDate}&duration=${selectedService.duration_minutes}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, selectedService]);

  useEffect(() => {
    if (step === 3) loadSlots();
  }, [step, loadSlots]);

  async function handleConfirm(name: string, email: string) {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setClientName(name);
    setError(null);
    setBookingLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: name, clientEmail: email, date: selectedDate, time: selectedTime, serviceId: selectedService.id, serviceName: selectedService.name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al confirmar. Intentá de nuevo."); return; }
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
    setError(null);
  }

  function goNext() { setStep((p) => (p < 4 ? ((p + 1) as Step) : p)); }
  function goPrev() { setStep((p) => (p > 1 ? ((p - 1) as Step) : p)); setError(null); }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "2rem 1.5rem 1.5rem", maxWidth: "480px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.35rem" }}>
          {BARBERIA_CONFIG.horarioAtencion.inicio}–{BARBERIA_CONFIG.horarioAtencion.fin}hs · Lun–Sáb
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0, lineHeight: 1.1 }}>
          {BARBERIA_CONFIG.nombre}
        </h1>
      </header>

      {/* Progress — steps 1–4 only */}
      {step <= 4 && (
        <div style={{ maxWidth: "480px", width: "100%", margin: "0 auto", padding: "0 1.5rem", boxSizing: "border-box", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "0.6rem" }}>
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "2px",
                  background: i < step ? "var(--ink)" : "var(--dust)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--stone)" }}>
              {STEP_LABELS[step - 1]}
            </span>
            {step > 1 && (
              <button
                onClick={goPrev}
                style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.1em", color: "var(--stone)", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                Atrás
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: "0 1.5rem 2rem", maxWidth: "480px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {error && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--ink)", borderLeft: "2px solid var(--ink)", paddingLeft: "0.75rem", marginBottom: "1.5rem" }}>
            {error}
          </p>
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
            clientEmail={bookingResult.client_email}
            appointmentId={bookingResult.id}
            onNewBooking={handleNewBooking}
          />
        )}
      </main>
    </div>
  );
}
