import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "@n8n/chat/style.css";


function ChatPopup() {
  useEffect(() => {
    import("@n8n/chat")
      .then(({ createChat }) => {
        console.log("Loaded @n8n/chat successfully");

        createChat({
          webhookUrl:
            "https://douae8.app.n8n.cloud/webhook/441e733c-530d-4e57-8bcc-c91a8ea9c3bf/chat",
          theme: {
            color: "#04122c",
            title: "Inventory Chatbot",
            position: "bottom-right",
          },
        });
      })
      .catch((error) => {
        console.error("Failed to load chat module:", error);
      });
  }, []);

  return (
    <div className="chat-page">
    

      {/* Logo flottant */}
      <div className="floating-logo">
       
         
        
      </div>
    </div>
  );
}

export default ChatPopup;