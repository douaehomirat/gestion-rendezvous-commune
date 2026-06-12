import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { X, Send, Building2, AlertTriangle, Clock, ChevronDown } from "lucide-react";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";
const QUICK_REPLIES = ["Prendre un rendez-vous", "Créneaux disponibles"];

// ─── Utils ─────────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0");

const timeStr = () => {
  const d = new Date();
  return `${d.getHours()}:${pad(d.getMinutes())}`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isPastTime = (date, time) => {
  if (!date || !time) return false;
  return new Date(`${date}T${time}:00`) < new Date();
};

const MOROCCAN_HOLIDAYS = new Set([
  "01-01","01-11","05-01","07-30",
  "08-14","08-20","08-21","11-06","11-18",
]);

const isWeekend = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
};

const isHoliday = (dateStr) => {
  const parts = dateStr.split("-");
  return MOROCCAN_HOLIDAYS.has(`${parts[1]}-${parts[2]}`);
};

const isBlocked = (dateStr) => isWeekend(dateStr) || isHoliday(dateStr);

const formatDateFR = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-MA", {
    weekday: "long", day: "numeric", month: "long",
  });
};

const nextWorkday = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  let ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  while (isBlocked(ds)) {
    d.setDate(d.getDate() + 1);
    ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  return ds;
};

// ─── API helpers ───────────────────────────────────────────────────────────────

const fetchSlots = async (departmentId, date) => {
  try {
    const res = await axios.get(`${API}/availability/auto`, {
      params: { departmentId, date },
    });
    return (res.data || [])
      .filter((s) => s.availableAgents > 0)
      .filter((s) => !isPastTime(date, s.time))
      .map((s) => s.time)
      .sort();
  } catch {
    return [];
  }
};

const detectDept = (msg, departments) => {
  const lower = msg.toLowerCase();
  return (
    departments.find((d) => lower.includes(d.name.toLowerCase())) ||
    departments.find((d) =>
      d.name.toLowerCase().split(" ").some((w) => w.length > 3 && lower.includes(w))
    ) ||
    null
  );
};

const wantsSlots = (msg) => {
  const lower = msg.toLowerCase();
  return (
    lower.includes("créneau") || lower.includes("disponible") ||
    lower.includes("rendez-vous") || lower.includes("rdv") ||
    lower.includes("heure") || lower.includes("quand") ||
    lower.includes("prendre")
  );
};

// ─── Build slot cards from real API ───────────────────────────────────────────

const buildSlotCards = async (userMsg, departments) => {
  if (!wantsSlots(userMsg) || departments.length === 0) return [];

  const today = todayStr();
  const tomorrow = tomorrowStr();
  const detectedDept = detectDept(userMsg, departments);
  const cards = [];

  if (detectedDept) {
    // Show today + tomorrow for that specific department
    const dates = [];
    if (!isBlocked(today)) dates.push(today);
    const nxt = !isBlocked(tomorrow) ? tomorrow : nextWorkday();
    if (nxt !== today) dates.push(nxt);

    for (const date of dates) {
      const slots = await fetchSlots(detectedDept.id, date);
      cards.push({ deptName: detectedDept.name, date, slots });
    }
  } else {
    // No department specified → show all departments for today (or next workday)
    const date = !isBlocked(today) ? today : (!isBlocked(tomorrow) ? tomorrow : nextWorkday());
    for (const dept of departments) {
      const slots = await fetchSlots(dept.id, date);
      if (slots.length > 0) {
        cards.push({ deptName: dept.name, date, slots });
      }
    }
  }

  return cards;
};

// ─── SlotDisplay ──────────────────────────────────────────────────────────────

function SlotDisplay({ slots, date, deptName, onBook }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? slots : slots.slice(0, 9);
  const isToday = date === todayStr();

  return (
    <div style={{
      background: "#eff6ff", border: "0.5px solid #bfdbfe",
      borderRadius: "14px", padding: "12px 14px", marginTop: "6px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
        <Clock size={13} color="#1d4ed8" />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1d4ed8" }}>
          {deptName}
        </span>
        <span style={{ fontSize: "11px", color: "#3b82f6", textTransform: "capitalize" }}>
          · {formatDateFR(date)}
        </span>
        {isToday && (
          <span style={{
            fontSize: "10px", background: "#dbeafe", color: "#1e40af",
            padding: "1px 8px", borderRadius: "20px", fontWeight: 700,
          }}>
            Aujourd'hui
          </span>
        )}
      </div>

      {slots.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", padding: "6px 0" }}>
          Aucun créneau disponible
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {visible.map((t, i) => (
              <SlotPill key={i} time={t} onClick={() => onBook(deptName, date, t)} />
            ))}
          </div>
          {slots.length > 9 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                marginTop: "8px", fontSize: "11px", color: "#1d4ed8",
                background: "transparent", border: "none", cursor: "pointer",
                padding: 0, fontWeight: 600,
              }}
            >
              <ChevronDown size={13} />
              Voir les {slots.length - 9} autres créneaux
            </button>
          )}
          <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "8px" }}>
            Cliquez sur un créneau pour démarrer la réservation
          </p>
        </>
      )}
    </div>
  );
}

function SlotPill({ time, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1a56db" : "#fff",
        border: `0.5px solid ${hovered ? "#1a56db" : "#93c5fd"}`,
        color: hovered ? "#fff" : "#1d4ed8",
        borderRadius: "20px", padding: "5px 14px",
        fontSize: "12px", fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s", letterSpacing: "0.3px",
      }}
    >
      {time}
    </button>
  );
}

// ─── BotMessage ───────────────────────────────────────────────────────────────

function BotBubble({ msg, onBook }) {
  const isWeekendMsg =
    (msg.text || "").toLowerCase().includes("weekend") ||
    (msg.text || "").toLowerCase().includes("férié") ||
    (msg.text || "").toLowerCase().includes("fermé");

  // Remove raw bullet slot lines from Gemini text (shown via SlotDisplay instead)
  const cleanText = (msg.text || "")
    .split("\n")
    .filter((l) => !/^[\•\-\*]\s*\d{1,2}[h:]\d{2}/.test(l.trim()))
    .join("\n")
    .trim();

  return (
    <div>
      {isWeekendMsg ? (
        <div style={{
          background: "#fff7ed", border: "0.5px solid #fed7aa",
          borderRadius: "14px", padding: "10px 13px",
          display: "flex", gap: "8px", alignItems: "flex-start",
        }}>
          <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: 1.55 }}>
            {cleanText}
          </p>
        </div>
      ) : cleanText ? (
        <div style={{
          padding: "10px 13px",
          borderRadius: "16px 16px 16px 4px",
          background: "#fff", border: "0.5px solid #e2e8f0",
          color: "#1e293b", fontSize: "13px", lineHeight: 1.55,
          whiteSpace: "pre-wrap",
        }}>
          {cleanText}
        </div>
      ) : null}

      {(msg.slotCards || []).map((card, i) => (
        <SlotDisplay
          key={i}
          slots={card.slots}
          date={card.date}
          deptName={card.deptName}
          onBook={onBook}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgentIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Bonjour ! Je suis CiviBot, votre assistant administratif intelligent. Comment puis-je vous aider ?",
      time: timeStr(),
      showQuick: true,
    },
  ]);

  useEffect(() => {
    axios.get(`${API}/departments`)
      .then((r) => setDepartments(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  const handleBook = (deptName, date, time) => {
    const fmt = formatDateFR(date);
    sendMessage(`Je souhaite réserver un rendez-vous au département ${deptName} le ${fmt} à ${time}`);
  };

  const sendMessage = async (text) => {
    const msg = text || message;
    if (!msg.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: msg, time: timeStr() }]);
    setMessage("");
    setLoading(true);

    try {
      const [response, slotCards] = await Promise.all([
        axios.post(`${API}/chat`, { message: msg }),
        buildSlotCards(msg, departments),
      ]);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.data.response || "Je n'ai pas compris la réponse.",
          time: timeStr(),
          slotCards: slotCards.length > 0 ? slotCards : undefined,
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
          position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #1a56db, #1e40af)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
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
        {isOpen ? <X size={22} color="#fff" /> : <Building2 size={22} color="#fff" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "92px", right: "24px",
          width: "385px", height: "590px",
          background: "#fff", borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", border: "0.5px solid #e2e8f0",
          zIndex: 40, animation: "civibotUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <style>{`
            @keyframes civibotUp {
              from { opacity:0; transform:translateY(20px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
            @keyframes civibotDot {
              0%,60%,100% { transform:translateY(0); }
              30% { transform:translateY(-5px); }
            }
            .civibot-scroll::-webkit-scrollbar { width:4px; }
            .civibot-scroll::-webkit-scrollbar-track { background:transparent; }
            .civibot-scroll::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
            .civibot-qbtn:hover { background:#1a56db !important; color:#fff !important; }
          `}</style>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#1a56db 0%,#1e40af 100%)",
            padding: "14px 16px", display: "flex", alignItems: "center",
            gap: "10px", flexShrink: 0,
          }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Building2 size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>CiviBot</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", margin: 0 }}>
                Assistant administratif intelligent
              </p>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#a7f3d0" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
              En ligne
            </span>
          </div>

          {/* Messages */}
          <div className="civibot-scroll" style={{
            flex: 1, overflowY: "auto", padding: "14px",
            display: "flex", flexDirection: "column", gap: "14px",
            background: "#f8fafc",
          }}>
            {messages.map((msg, i) => {
              const isUser = msg.sender === "user";
              return (
                <div key={i}>
                  <div style={{
                    display: "flex", gap: "8px", alignItems: "flex-end",
                    flexDirection: isUser ? "row-reverse" : "row",
                  }}>
                    {!isUser && (
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "linear-gradient(135deg,#1a56db,#1e40af)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, alignSelf: "flex-end",
                      }}>
                        <Building2 size={13} color="#fff" />
                      </div>
                    )}
                    <div style={{ maxWidth: "82%" }}>
                      {isUser ? (
                        <div style={{
                          padding: "10px 13px",
                          borderRadius: "16px 16px 4px 16px",
                          background: "linear-gradient(135deg,#1a56db,#1e40af)",
                          color: "#fff", fontSize: "13px", lineHeight: 1.55,
                        }}>
                          {msg.text}
                        </div>
                      ) : (
                        <BotBubble msg={msg} onBook={handleBook} />
                      )}
                    </div>
                  </div>

                  {msg.showQuick && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", marginLeft: "36px" }}>
                      {QUICK_REPLIES.map((q) => (
                        <button
                          key={q}
                          className="civibot-qbtn"
                          onClick={() => sendMessage(q)}
                          style={{
                            fontSize: "12px", padding: "5px 13px", borderRadius: "20px",
                            border: "0.5px solid #1a56db", color: "#1a56db",
                            background: "transparent", cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <p style={{
                    fontSize: "10px", color: "#94a3b8", marginTop: "4px",
                    textAlign: isUser ? "right" : "left",
                    paddingLeft: isUser ? 0 : "36px",
                  }}>
                    {msg.time}
                  </p>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "linear-gradient(135deg,#1a56db,#1e40af)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Building2 size={13} color="#fff" />
                </div>
                <div style={{
                  background: "#fff", border: "0.5px solid #e2e8f0",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "11px 14px", display: "flex", gap: "5px", alignItems: "center",
                }}>
                  {[0,1,2].map((idx) => (
                    <span key={idx} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#94a3b8", display: "block",
                      animation: `civibotDot 1.2s infinite`,
                      animationDelay: `${idx * 0.18}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "0.5px solid #e2e8f0",
            background: "#fff", display: "flex", gap: "8px",
            alignItems: "center", flexShrink: 0,
          }}>
            <input
              type="text"
              placeholder="Écrire un message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1, background: "#f1f5f9", border: "none",
                borderRadius: "20px", padding: "9px 15px",
                fontSize: "13px", outline: "none", color: "#1e293b",
                transition: "background 0.15s",
              }}
              onFocus={(e) => (e.target.style.background = "#e2e8f0")}
              onBlur={(e) => (e.target.style.background = "#f1f5f9")}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !message.trim()}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: loading || !message.trim()
                  ? "#e2e8f0"
                  : "linear-gradient(135deg,#1a56db,#1e40af)",
                border: "none",
                cursor: loading || !message.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s",
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