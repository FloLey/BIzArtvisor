import React, { useState, useRef } from "react";
import "./Chatbot.scss";
import Chats from "../Chat/Chat";
import { IMessage, Thread, streamResponsesWithSession } from "../../API/api";


interface ChatbotProps {
  thread: Thread;
  addMessage: (newMessage: IMessage) => void;
  updateBotMessage: (newMessage: IMessage) => void;
  updateSessionId: (sessionId: string) => void
}

const Chatbot: React.FC<ChatbotProps> = ({ thread, addMessage, updateBotMessage, updateSessionId }) => {
  const [userResponse, setUserResponse] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserResponse(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      const target = textareaRef.current;
      target.style.height = 'inherit'; // Reset height
      target.style.height = `${target.scrollHeight}px`; // Set to scroll height
    }
  };
  

  const handleStreamedResponses = async (input: string) => {
    let botMessage: IMessage = {
      message: "Loading response...",
      sender: "bot",
    };
    addMessage(botMessage);

    let fullResponse = "";
    const { sessionIdFromHeader, contentStream } = await streamResponsesWithSession(input, thread.session_id);
  
    for await (const chunk of contentStream) {
      fullResponse += chunk;
      botMessage.message = fullResponse;
      updateBotMessage(botMessage); 
    }

    console.log(sessionIdFromHeader)
    if (sessionIdFromHeader) {
      updateSessionId(sessionIdFromHeader);
    }
};

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!userResponse.trim()) return;

    const newMessage: IMessage = {
      message: userResponse,
      sender: "user",
    };

    addMessage(newMessage);
    setUserResponse("");
    handleStreamedResponses(userResponse);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }
    
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      <Chats
        messages={thread.messages}
        />
      <form onSubmit={handleSubmit} className="form-container">
        <textarea
          ref={textareaRef}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          value={userResponse}
          style={{ resize: "none" }}
        ></textarea>
        <button type="submit">
          <i className="far fa-paper-plane"> Send</i>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
