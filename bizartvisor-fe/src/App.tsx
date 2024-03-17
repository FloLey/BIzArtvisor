import React, { useState } from 'react';
import './App.css';
import Chatbot from './Components/Chatbot/Chatbot';
import History from './Components/History/History';
import { IMessage, Thread } from './API/api';

function App() {
  const [thread, setThread] = useState<Thread>({
    session_id: "new_session_id",
    messages: []
  });

  const updateThread = (newThread: Thread) => {
    setThread(newThread);
  };

  const updateSessionId = (newSessionId: string) => {
    console.log(newSessionId)
    setThread((prevThread) => ({
      ...prevThread,
      session_id: newSessionId,
    }));
  };
  

  const updateBotMessage = (updatedMessage: IMessage) => {
    setThread(prevThread => {
      const newMessages = [...prevThread.messages];
      newMessages[newMessages.length - 1] = updatedMessage; // Update the last message, assumes it's the one we're streaming to
      return { ...prevThread, messages: newMessages };
    });
  };

  const addMessageToThread = (newMessage: IMessage) => {
    setThread((prevThread) => ({
      ...prevThread,
      messages: [...prevThread.messages, newMessage],
    }));
  };

  return (
    <div className="container">
      <div className="column">
        <History sessionId={thread.session_id} onHistoryItemClick={updateThread} />
      </div>
      <div className="middle-column">
        <Chatbot thread={thread} addMessage={addMessageToThread} updateBotMessage={updateBotMessage} updateSessionId={updateSessionId}/>
      </div>
      <div className="column">Settings</div>
    </div>
  );
}

export default App;