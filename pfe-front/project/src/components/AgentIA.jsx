import { useState } from "react";
import axios from "axios";

export default function AgentIA() {

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const sendMessage = async () => {

        if (!message.trim()) return;

        const userMessage = {
            sender: "user",
            text: message
        };

        setMessages(prev => [...prev, userMessage]);

        try {

            const response = await axios.post(
                "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/chat",
                {
                    message
                }
            );

            setMessages(prev => [
                ...prev,
                {
                    sender: "bot",
                    text: response.data.response
                }
            ]);

        } catch (error) {

            setMessages(prev => [
                ...prev,
                {
                    sender: "bot",
                    text: "Erreur de connexion."
                }
            ]);
        }

        setMessage("");
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg">

            <div className="bg-blue-600 text-white p-4 rounded-t-xl">
                Assistant Administratif
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-3">

                {messages.map((msg, index) => (

                    <div
                        key={index}
                        className={
                            msg.sender === "user"
                                ? "text-right"
                                : "text-left"
                        }
                    >

                        <span
                            className={
                                msg.sender === "user"
                                    ? "bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
                                    : "bg-gray-200 px-4 py-2 rounded-lg inline-block"
                            }
                        >
                            {msg.text}
                        </span>

                    </div>

                ))}

            </div>

            <div className="p-4 flex gap-2">

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-1 border rounded-lg px-4 py-2"
                />

                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Envoyer
                </button>

            </div>

        </div>
    );
}