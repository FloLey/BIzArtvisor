import React, { useEffect, useRef, useCallback } from "react";
import "./Chat.scss"; // Importing styles
import { IMessage } from "../../API/api";
import botAvatar from "../../Images/bizart.png"; // Bot avatar image
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Components } from 'react-markdown';

interface Props {
  messages: IMessage[]; // Array of message objects
}

interface MarkdownWithLinksProps {
  text: string;
}

const MarkdownWithLinks: React.FC<MarkdownWithLinksProps> = ({ text }) => {
  const processedText = useCallback((text: string) => {
    const urlRegex = /\b(https?:\/\/\S+)\b/g;
    return text.replace(urlRegex, (match) => `[${match}](${match})`);
  }, []);

  const components: Components = {
    a: ({ node, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    ),
    code({ node, className, children, ...props }) {
      // This regex matches the language name in the class attribute
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        // SyntaxHighlighter for language-specific code blocks
        // 'match[1]' contains the detected language (e.g., js, ts, python)
        <SyntaxHighlighter style={oneLight} language={match[1]} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        // Regular <code> tag for inline code or non-language-specific code
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <ReactMarkdown components={components}>
      {processedText(text)}
    </ReactMarkdown>
  );
};


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
          {/* Render message text with markdown support and link processing */}
          <MarkdownWithLinks text={chat.message} />
        </div>
      ))}
      <div ref={dummyRef}></div> {/* Dummy div at the end for auto-scrolling */}
    </div>
  );
};

export default Chats;