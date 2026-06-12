import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Bot } from "lucide-react";

const QUICK_REPLIES = [
  "Prendre un rendez-vous",
  "Modifier un rendez-vous",
  "Documents nécessaires",
];

function timeStr() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AgentIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Bonjour ! Je suis votre assistant administratif. Comment puis-je vous aider aujourd'hui ?",
      time: timeStr(),
      showQuick: true,
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || message;
    if (!msg.trim() || loading) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: msg, time: timeStr() },
    ]);
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
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-40">

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm leading-tight">
                Assistant Administratif IA
              </h3>
              <p className="text-blue-200 text-xs">Support intelligent des rendez-vous</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" title="En ligne" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[72%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Quick replies */}
                {msg.showQuick && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-9">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <p
                  className={`text-xs text-gray-400 mt-1 ${
                    msg.sender === "user" ? "text-right" : "ml-9"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white flex gap-2 items-center">
            <input
              type="text"
              placeholder="Écrire un message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !message.trim()}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:cursor-not-allowed"
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}