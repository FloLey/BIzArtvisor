import React, { useState, useEffect } from 'react';
import { Thread, changeConversationThread, fetchConversationHistory } from '../../API/api';
import './History.scss';

interface HistoryProps {
  onHistoryItemClick: (thread: Thread) => void;
  sessionId: string
}

const History: React.FC<HistoryProps> = ({ onHistoryItemClick, sessionId }) => {
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("reload")
      try {
        const data = await fetchConversationHistory();
        console.log(data.length)
        const sortedData = data.sort((a, b) => b.localeCompare(a)); 
        setConversationHistory(sortedData); 
      } catch (error) {
        console.error('Failed to fetch conversation history:', error);
      }
    };

    fetchData();
  }, [sessionId]);

  const handleItemClick = async (item: string) => {
    try {
      const thread: Thread = await changeConversationThread(item);
      onHistoryItemClick(thread);

    } catch (error) {
      console.error('Error changing thread:', error);
    }
  };

  const handleNewChatClick = () => {
    const newThread: Thread = {
      session_id: "new_session_id",
      messages: [],
    };
    onHistoryItemClick(newThread);
  };

  return (
    <div>
      <button className="newChatButton" onClick={handleNewChatClick}>New Chat</button>
      <ul className="historyList">
        {conversationHistory.map((item, index) => (
          <li key={item} className={`historyItem ${item === sessionId ? 'activeHistoryItem' : ''}`} onClick={() => handleItemClick(item)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default History;