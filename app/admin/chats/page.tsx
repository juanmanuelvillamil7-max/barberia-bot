"use client";

import { useState, useEffect, useRef } from "react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  message_id?: string;
  sent_by?: "bot" | "admin";
}

interface Conversation {
  phone_number: string;
  client_name: string | null;
  messages: ConversationMessage[];
  last_activity: string;
  bot_active: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function displayName(conv: Conversation): string {
  return conv.client_name ?? conv.phone_number;
}

function lastMessage(conv: Conversation): string {
  if (!conv.messages.length) return "";
  const last = conv.messages[conv.messages.length - 1];
  const prefix = last.role === "assistant"
    ? (last.sent_by === "admin" ? "Vos: " : "Bot: ")
    : "";
  const text = last.content.slice(0, 60);
  return prefix + text + (last.content.length > 60 ? "…" : "");
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/admin/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [selected]);

  const filtered = conversations.filter((c) =>
    displayName(c).toLowerCase().includes(search.toLowerCase())
  );

  function groupByDate(messages: ConversationMessage[]) {
    const groups: { date: string; messages: ConversationMessage[] }[] = [];
    for (const msg of messages) {
      const date = formatDate(msg.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.messages.push(msg);
      else groups.push({ date, messages: [msg] });
    }
    return groups;
  }

  async function handleToggleBot() {
    if (!selected) return;
    setToggling(true);
    const newVal = !selected.bot_active;
    try {
      await fetch("/api/admin/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: selected.phone_number, bot_active: newVal }),
      });
      const updated = { ...selected, bot_active: newVal };
      setSelected(updated);
      setConversations((prev) =>
        prev.map((c) => c.phone_number === selected.phone_number ? updated : c)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  }

  async function handleSend() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: selected.phone_number, message: draft.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        const updated: Conversation = {
          ...selected,
          bot_active: false,
          messages: [...selected.messages, data.message],
          last_activity: new Date().toISOString(),
        };
        setSelected(updated);
        setConversations((prev) =>
          prev.map((c) => c.phone_number === selected.phone_number ? updated : c)
        );
        setDraft("");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
          WhatsApp
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
          Chats
        </h1>
      </div>

      {selected ? (
        /* ── Thread view ── */
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                onClick={() => { setSelected(null); setDraft(""); }}
                style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.1em", color: "var(--stone)", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                Atrás
              </button>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                  {displayName(selected)}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--stone)", margin: "0.1rem 0 0" }}>
                  {selected.phone_number}
                </p>
              </div>
            </div>

            {/* Bot toggle */}
            <button
              onClick={handleToggleBot}
              disabled={toggling}
              style={{
                padding: "0.45rem 0.9rem",
                background: selected.bot_active ? "transparent" : "#B8922A",
                color: selected.bot_active ? "var(--ink)" : "#fff",
                border: `1px solid ${selected.bot_active ? "var(--dust)" : "#B8922A"}`,
                fontFamily: "var(--font-body)",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: toggling ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {selected.bot_active ? "Tomar control" : "Reactivar bot"}
            </button>
          </div>

          {/* Bot status bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            background: selected.bot_active ? "var(--dust)" : "#FFF8EC",
            marginBottom: "1rem",
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: selected.bot_active ? "var(--stone)" : "#B8922A",
              flexShrink: 0,
            }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: selected.bot_active ? "var(--stone)" : "#B8922A", margin: 0 }}>
              {selected.bot_active
                ? "Bot activo — respondiendo automáticamente"
                : "Modo humano — el bot está pausado"}
            </p>
          </div>

          {/* Messages */}
          <div style={{ borderTop: "1px solid var(--dust)", paddingTop: "1.25rem", minHeight: "200px" }}>
            {selected.messages.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Sin mensajes.</p>
            ) : (
              groupByDate(selected.messages).map((group) => (
                <div key={group.date}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--dust)" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--rule)", flexShrink: 0 }}>
                      {group.date}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--dust)" }} />
                  </div>

                  {group.messages.map((msg, i) => {
                    const isOutbound = msg.role === "assistant";
                    const isAdmin = msg.sent_by === "admin";
                    const bgColor = isOutbound
                      ? (isAdmin ? "#B8922A" : "var(--ink)")
                      : "var(--dust)";
                    const textColor = isOutbound ? "#fff" : "var(--ink)";
                    const label = isOutbound
                      ? (isAdmin ? "Vos" : "Bot")
                      : "Cliente";

                    return (
                      <div
                        key={i}
                        style={{ display: "flex", flexDirection: "column", alignItems: isOutbound ? "flex-end" : "flex-start", marginBottom: "0.75rem" }}
                      >
                        <div style={{
                          maxWidth: "75%",
                          padding: "0.65rem 0.9rem",
                          background: bgColor,
                          color: textColor,
                          fontFamily: "var(--font-body)",
                          fontSize: "0.88rem",
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                        }}>
                          {msg.content}
                        </div>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", color: "var(--rule)", marginTop: "0.2rem", letterSpacing: "0.05em" }}>
                          {label} · {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div style={{ borderTop: "1px solid var(--dust)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            {!selected.bot_active && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
                Responder como humano
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selected.bot_active ? "Escribí para tomar el control…" : "Escribí tu respuesta…"}
                rows={2}
                style={{
                  flex: 1,
                  padding: "0.6rem 0",
                  border: "none",
                  borderBottom: "1px solid var(--dust)",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                  color: "var(--ink)",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.4,
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                style={{
                  padding: "0.6rem 1rem",
                  background: draft.trim() ? "#B8922A" : "var(--dust)",
                  color: draft.trim() ? "#fff" : "var(--stone)",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                  alignSelf: "flex-end",
                }}
              >
                {sending ? "…" : "Enviar"}
              </button>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "var(--rule)", marginTop: "0.4rem" }}>
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      ) : (
        /* ── Conversation list ── */
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            style={{
              width: "100%",
              padding: "0.5rem 0",
              border: "none",
              borderBottom: "1px solid var(--dust)",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              color: "var(--ink)",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "1.5rem",
            }}
          />

          {loading ? (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Cargando chats…</p>
          ) : filtered.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
              {search ? "Sin resultados." : "Sin conversaciones guardadas."}
            </p>
          ) : (
            <div style={{ borderTop: "1px solid var(--dust)" }}>
              {filtered.map((conv) => (
                <button
                  key={conv.phone_number}
                  onClick={() => setSelected(conv)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    width: "100%",
                    padding: "1rem 0",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--dust)",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 400, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
                        {displayName(conv)}
                      </p>
                      {!conv.bot_active && (
                        <span style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.52rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#B8922A",
                          border: "1px solid #B8922A",
                          padding: "0.1rem 0.35rem",
                          flexShrink: 0,
                        }}>
                          Humano
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--stone)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lastMessage(conv)}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.08em", color: "var(--rule)", margin: "0 0 0.2rem" }}>
                      {formatDate(conv.last_activity)}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", color: "var(--rule)", margin: 0 }}>
                      {conv.messages.length} msgs
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
