import React, { useEffect, useRef } from "react";
import "./Chat.scss"; // Importing styles
import { IMessage } from "../../API/api";
import botAvatar from "../../Images/bizart.png"; // Bot avatar image
import ReactMarkdown from "react-markdown";

interface Props {
  messages: IMessage[]; // Array of message objects
}

const Chats: React.FC<Props> = ({ messages }) => {
  const dummyRef = useRef<HTMLDivElement>(null); // Ref for the dummy div used for auto-scrolling
  const bodyRef = useRef<HTMLDivElement>(null); // Ref for the message container div

  useEffect(() => {
    // Auto-scroll to the latest message on update
    if (dummyRef.current) {
      dummyRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="message-container" ref={bodyRef}>
      {messages.map((chat, index) => (
        <div key={index} className={`message ${chat.sender}`}>
          {/* Conditionally render bot avatar for bot messages */}
          {chat.sender === 'bot' && (
            <img src={botAvatar} alt="Bot Avatar" className="bot-avatar" />
          )}
          {/* Render message text with markdown support */}
          <ReactMarkdown className="text">{chat.message}</ReactMarkdown>
        </div>
      ))}
      <div ref={dummyRef}></div> {/* Dummy div at the end for auto-scrolling */}
    </div>
  );
};

export default Chats;
