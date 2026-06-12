import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Building2, AlertTriangle, Clock } from "lucide-react";

const QUICK_REPLIES = ["Prendre un rendez-vous", "Créneaux disponibles"];

function timeStr() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Detect if a bot message contains available slots and render them as pills.
 * Slots are lines starting with "• HH:MM" or "- HH:MM" or "* HH:MM"
 */
function parseSlots(text) {
  const slotRegex = /^[\•\-\*]\s*(\d{1,2}[h:]\d{2})/m;
  return slotRegex.test(text);
}

function renderBotContent(text) {
  const lines = text.split("\n");
  const slotLines = [];
  const otherLines = [];

  lines.forEach((line) => {
    if (/^[\•\-\*]\s*\d{1,2}[h:]\d{2}/.test(line.trim())) {
      const match = line.trim().match(/\d{1,2}[h:]\d{2}/);
      if (match) slotLines.push(match[0].replace(":", "h"));
    } else {
      otherLines.push(line);
    }
  });

  const isWeekend =
    text.toLowerCase().includes("weekend") ||
    text.toLowerCase().includes("férié") ||
    text.toLowerCase().includes("fermé");

  return { slotLines, textContent: otherLines.join("\n").trim(), isWeekend };
}

export default function AgentIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Bonjour ! Je suis **CiviBot**, votre assistant administratif intelligent. Comment puis-je vous aider aujourd'hui ?",
      time: timeStr(),
      showQuick: true,
    },
  ]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  const sendMessage = async (text) => {
    const msg = text || message;
    if (!msg.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: msg, time: timeStr() }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/chat",
        { message: msg }
      );
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.data.response || "Je n'ai pas compris la réponse.",
          time: timeStr(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Erreur serveur. Veuillez réessayer plus tard.",
          time: timeStr(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 50,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1a56db, #1e40af)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(26,86,219,0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,86,219,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,86,219,0.4)";
        }}
        aria-label={isOpen ? "Fermer CiviBot" : "Ouvrir CiviBot"}
      >
        {isOpen ? (
          <X size={22} color="#fff" />
        ) : (
          <Building2 size={22} color="#fff" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "24px",
            width: "375px",
            height: "570px",
            background: "#fff",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "0.5px solid #e2e8f0",
            zIndex: 40,
            animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)  scale(1); }
            }
            @keyframes bounceTyping {
              0%,60%,100% { transform: translateY(0); }
              30%         { transform: translateY(-5px); }
            }
            .civibot-slot:hover {
              background: #1a56db !important;
              color: #fff !important;
              border-color: #1a56db !important;
            }
            .civibot-quick:hover {
              background: #1a56db !important;
              color: #fff !important;
            }
            .civibot-messages::-webkit-scrollbar { width: 4px; }
            .civibot-messages::-webkit-scrollbar-track { background: transparent; }
            .civibot-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          `}</style>

          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a56db 0%, #1e40af 100%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Building2 size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>
                CiviBot
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", margin: 0 }}>
                Assistant administratif intelligent
              </p>
            </div>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                color: "#a7f3d0",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#34d399",
                  display: "inline-block",
                }}
              />
              En ligne
            </span>
          </div>

          {/* Messages */}
          <div
            className="civibot-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "#f8fafc",
            }}
          >
            {messages.map((msg, i) => {
              const isUser = msg.sender === "user";
              const { slotLines, textContent, isWeekend } = isUser
                ? { slotLines: [], textContent: msg.text, isWeekend: false }
                : renderBotContent(msg.text);

              return (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-end",
                      flexDirection: isUser ? "row-reverse" : "row",
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#1a56db,#1e40af)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={13} color="#fff" />
                      </div>
                    )}

                    <div style={{ maxWidth: "78%" }}>
                      {/* Weekend/holiday banner */}
                      {!isUser && isWeekend && (
                        <div
                          style={{
                            background: "#fff7ed",
                            border: "0.5px solid #fed7aa",
                            borderRadius: "12px",
                            padding: "10px 12px",
                            display: "flex",
                            gap: "8px",
                            alignItems: "flex-start",
                            marginBottom: slotLines.length ? "8px" : "0",
                          }}
                        >
                          <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
                          <p style={{ fontSize: "12.5px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                            {textContent}
                          </p>
                        </div>
                      )}

                      {/* Normal bubble */}
                      {(!isWeekend || isUser) && textContent && (
                        <div
                          style={{
                            padding: "10px 13px",
                            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            background: isUser ? "linear-gradient(135deg,#1a56db,#1e40af)" : "#fff",
                            border: isUser ? "none" : "0.5px solid #e2e8f0",
                            color: isUser ? "#fff" : "#1e293b",
                            fontSize: "13px",
                            lineHeight: 1.55,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {textContent.replace(/\*\*(.*?)\*\*/g, "$1")}
                        </div>
                      )}

                      {/* Slot pills */}
                      {!isUser && slotLines.length > 0 && (
                        <div
                          style={{
                            background: "#eff6ff",
                            border: "0.5px solid #bfdbfe",
                            borderRadius: "12px",
                            padding: "10px 12px",
                            marginTop: textContent ? "6px" : "0",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#1d4ed8",
                              marginBottom: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Clock size={12} />
                            Créneaux disponibles
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {slotLines.map((slot, si) => (
                              <button
                                key={si}
                                className="civibot-slot"
                                onClick={() => sendMessage(`Je souhaite prendre un rendez-vous à ${slot}`)}
                                style={{
                                  background: "#fff",
                                  border: "0.5px solid #93c5fd",
                                  color: "#1d4ed8",
                                  borderRadius: "20px",
                                  padding: "4px 12px",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick replies */}
                  {msg.showQuick && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "8px",
                        marginLeft: "36px",
                      }}
                    >
                      {QUICK_REPLIES.map((q) => (
                        <button
                          key={q}
                          className="civibot-quick"
                          onClick={() => sendMessage(q)}
                          style={{
                            fontSize: "12px",
                            padding: "5px 13px",
                            borderRadius: "20px",
                            border: "0.5px solid #1a56db",
                            color: "#1a56db",
                            background: "transparent",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginTop: "4px",
                      textAlign: isUser ? "right" : "left",
                      paddingLeft: isUser ? "0" : "36px",
                    }}
                  >
                    {msg.time}
                  </p>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#1a56db,#1e40af)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={13} color="#fff" />
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "0.5px solid #e2e8f0",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "11px 14px",
                    display: "flex",
                    gap: "5px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#94a3b8",
                        display: "block",
                        animation: "bounceTyping 1.2s infinite",
                        animationDelay: `${idx * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "0.5px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              placeholder="Écrire un message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1,
                background: "#f1f5f9",
                border: "none",
                borderRadius: "20px",
                padding: "9px 15px",
                fontSize: "13px",
                outline: "none",
                color: "#1e293b",
                transition: "background 0.15s",
              }}
              onFocus={(e) => (e.target.style.background = "#e2e8f0")}
              onBlur={(e) => (e.target.style.background = "#f1f5f9")}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !message.trim()}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background:
                  loading || !message.trim()
                    ? "#e2e8f0"
                    : "linear-gradient(135deg,#1a56db,#1e40af)",
                border: "none",
                cursor: loading || !message.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              aria-label="Envoyer"
            >
              <Send size={15} color={loading || !message.trim() ? "#94a3b8" : "#fff"} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}