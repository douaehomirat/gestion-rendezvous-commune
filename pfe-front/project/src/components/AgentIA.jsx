import { useState } from "react";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";

export default function AgentIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Bonjour 👋, je suis votre assistant administratif. Comment puis-je vous aider ?"
    }
  ]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/chat",
        {
          message: currentMessage
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.data.response
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Une erreur est survenue lors de la connexion."
        }
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Fenêtre Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 text-white p-4">
            <h3 className="font-bold text-lg">
              Assistant Administratif IA
            </h3>
            <p className="text-sm opacity-90">
              Service d'aide aux rendez-vous
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">

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
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-white border shadow-sm rounded-2xl px-4 py-3 inline-block">
                Réflexion...
              </div>
            )}
          </div>

          {/* Zone saisie */}
          <div className="border-t p-3 flex gap-2 bg-white">

            <input
              type="text"
              placeholder="Écrivez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && sendMessage()
              }
              className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"
            >
              <Send size={18} />
            </button>

          </div>
        </div>
      )}
    </>
  );
}