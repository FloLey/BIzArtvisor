import React, { useState, useRef } from "react";
import "./Chatbot.scss";
import Chats from "../Chat/Chat";
import { IMessage, Thread, streamResponsesWithSession, uploadFile } from "../../API/api";

interface ChatbotProps {
  thread: Thread;
  addMessage: (newMessage: IMessage) => void;
  updateBotMessage: (newMessage: IMessage) => void;
  updateSessionId: (sessionId: string) => void;
  model: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ thread, addMessage, updateBotMessage, updateSessionId, model }) => {
  const [userResponse, setUserResponse] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserResponse(e.target.value);
    
    // Auto-resize textarea to fit content
    if (textareaRef.current) {
      const target = textareaRef.current;
      target.style.height = 'inherit'; // Reset height to default
      target.style.height = `${target.scrollHeight}px`; // Adjust height based on content
    }
  };

  const handleStreamedResponses = async (input: string) => {
    let botMessage: IMessage = {
      message: "Loading response...",
      sender: "bot",
    };
    addMessage(botMessage);

    let fullResponse = "";
    const { sessionIdFromHeader, contentStream } = await streamResponsesWithSession(input, thread.session_id, model);
  
    for await (const chunk of contentStream) {
      fullResponse += chunk;
      botMessage.message = fullResponse;
      updateBotMessage(botMessage);
    }

    if (sessionIdFromHeader) {
      updateSessionId(sessionIdFromHeader);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!userResponse.trim()) return; // Prevent empty messages

    const newMessage: IMessage = {
      message: userResponse,
      sender: "user",
    };

    addMessage(newMessage);
    setUserResponse(""); // Clear input field
    handleStreamedResponses(userResponse); // Send the message for streaming response
    
    // Reset textarea height after message is sent
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e); // Submit on Enter
    }
  };

  // Function to trigger file input
  const triggerFileInput = () => {
    document.getElementById('fileInput')?.click();
  };

  // Function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    try {
      const result = await uploadFile(file);
      console.log('Upload successful:', result);
      // Here, you might update your chat or UI to reflect the file upload success or content
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  

  return (
    <div className="chat-container">
      <Chats messages={thread.messages} />
      <form onSubmit={handleSubmit} className="form-container">
        <textarea
          ref={textareaRef}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          value={userResponse}
          style={{ resize: "none" }} // Disable manual resize
        ></textarea>
        <button type="submit">
          <i className="far fa-paper-plane"> Send</i>
        </button>
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button type="button" onClick={triggerFileInput}>
          <i className="fas fa-upload"> Upload</i>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
