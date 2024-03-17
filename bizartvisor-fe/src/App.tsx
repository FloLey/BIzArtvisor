import React, { useState } from 'react';
import './App.css';
import Chatbot from './Components/Chatbot/Chatbot';
import History from './Components/History/History';
import { IMessage, Thread } from './API/api';

function App() {
  // State to manage the current chat thread, including the session ID and messages
  const [thread, setThread] = useState<Thread>({
    session_id: "new_session_id",
    messages: []
  });

  // Updates the entire thread (session ID and messages) with a new thread
  const updateThread = (newThread: Thread) => {
    setThread(newThread);
  };

  // Updates the session ID of the current thread
  const updateSessionId = (newSessionId: string) => {
    console.log(newSessionId); // Logging for debugging purposes
    setThread((prevThread) => ({
      ...prevThread,
      session_id: newSessionId,
    }));
  };

  // Updates the last bot message in the thread
  const updateBotMessage = (updatedMessage: IMessage) => {
    setThread(prevThread => {
      const newMessages = [...prevThread.messages];
      // Assumes the last message is the one being updated/streamed to
      newMessages[newMessages.length - 1] = updatedMessage; 
      return { ...prevThread, messages: newMessages };
    });
  };

  // Adds a new message to the current thread
  const addMessageToThread = (newMessage: IMessage) => {
    setThread((prevThread) => ({
      ...prevThread,
      messages: [...prevThread.messages, newMessage],
    }));
  };

  return (
    <div className="container">
      <div className="column">
        {/* History component displays session history and allows selecting a thread */}
        <History sessionId={thread.session_id} onHistoryItemClick={updateThread} />
      </div>
      <div className="middle-column">
        {/* Chatbot component for interacting with the bot, passing in handlers for updating the thread */}
        <Chatbot 
          thread={thread} 
          addMessage={addMessageToThread} 
          updateBotMessage={updateBotMessage} 
          updateSessionId={updateSessionId}
        />
      </div>
      <div className="column">
        {/* Placeholder for future settings or additional components */}
        Settings
      </div>
    </div>
  );
}

export default App;
