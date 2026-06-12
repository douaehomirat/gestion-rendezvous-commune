import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";

export default function AgentIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Bonjour 👋 Je suis votre assistant administratif. Comment puis-je vous aider ?",
    },
  ]);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { sender: "user", text: message };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/chat",
        {
          message: currentMessage,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.data.response || "Je n'ai pas compris la réponse.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Erreur serveur. Veuillez réessayer plus tard.",
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
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-full shadow-xl hover:scale-105 transition"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[560px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4">
            <h3 className="font-semibold text-lg">
              Assistant Administratif IA
            </h3>
            <p className="text-xs opacity-90">
              Support intelligent des rendez-vous
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm max-w-[75%] shadow-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border px-4 py-2 rounded-2xl text-sm shadow-sm animate-pulse">
                  L'IA réfléchit...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              placeholder="Écrire un message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className={`p-3 rounded-2xl transition ${
                loading
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}