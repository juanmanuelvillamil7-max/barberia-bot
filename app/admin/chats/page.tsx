"use client";

import { useState, useEffect, useRef } from "react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  message_id?: string;
}

interface Conversation {
  phone_number: string;
  client_name: string | null;
  messages: ConversationMessage[];
  last_activity: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
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
  const prefix = last.role === "assistant" ? "Bot: " : "";
  return prefix + last.content.slice(0, 60) + (last.content.length > 60 ? "…" : "");
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected]);

  const filtered = conversations.filter((c) =>
    displayName(c).toLowerCase().includes(search.toLowerCase())
  );

  // Group messages by date for the thread view
  function groupByDate(messages: ConversationMessage[]) {
    const groups: { date: string; messages: ConversationMessage[] }[] = [];
    for (const msg of messages) {
      const date = formatDate(msg.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    }
    return groups;
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
        <div>
          {/* Back + header */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              onClick={() => setSelected(null)}
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

          {/* Message thread */}
          <div style={{ borderTop: "1px solid var(--dust)", paddingTop: "1.5rem" }}>
            {selected.messages.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Sin mensajes.</p>
            ) : (
              groupByDate(selected.messages).map((group) => (
                <div key={group.date}>
                  {/* Date divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--dust)" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--rule)", flexShrink: 0 }}>
                      {group.date}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--dust)" }} />
                  </div>

                  {group.messages.map((msg, i) => {
                    const isBot = msg.role === "assistant";
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isBot ? "flex-end" : "flex-start",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div style={{
                          maxWidth: "75%",
                          padding: "0.65rem 0.9rem",
                          background: isBot ? "var(--ink)" : "var(--dust)",
                          color: isBot ? "var(--cream)" : "var(--ink)",
                          fontFamily: "var(--font-body)",
                          fontSize: "0.88rem",
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                        }}>
                          {msg.content}
                        </div>
                        <span style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.58rem",
                          color: "var(--rule)",
                          marginTop: "0.2rem",
                          letterSpacing: "0.05em",
                        }}>
                          {isBot ? "Bot" : "Cliente"} · {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
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
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
              Cargando chats…
            </p>
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
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 400, color: "var(--ink)", margin: "0 0 0.2rem", lineHeight: 1.2 }}>
                      {displayName(conv)}
                    </p>
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
