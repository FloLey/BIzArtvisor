import React, { useEffect, useRef } from "react";
import "./Chat.scss";
import { IMessage } from "../../API/api";
import botAvatar from "../../Images/bizart.png"; // Import the image
import ReactMarkdown from "react-markdown";

interface Props {
  messages: IMessage[];
}

const Chats: React.FC<Props> = ({ messages }) => {
  const dummyRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enable autoscroll to the latest message
    if (dummyRef.current) {
      dummyRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="message-container" ref={bodyRef}>
      {messages.map((chat, index) => (
        <div key={index} className={`message ${chat.sender}`}>
          {chat.sender === 'bot' && (
            <img src={botAvatar} alt="Bot Avatar" className="bot-avatar" />
          )}
          {/* Use ReactMarkdown to render the message */}
          <ReactMarkdown className="text">{chat.message}</ReactMarkdown>
        </div>
      ))}
      <div ref={dummyRef}></div> {/* Dummy div for autoscroll */}
    </div>
  );
};

export default Chats;
