import React, { useState, useEffect } from 'react';
import { Thread, changeConversationThread, fetchConversationHistory } from '../../API/api';
import './History.scss';

// Define interface for component props
interface HistoryProps {
  onHistoryItemClick: (thread: Thread) => void;
  sessionId: string;
}

// The History component handles displaying and interacting with a list of conversation history
const History: React.FC<HistoryProps> = ({ onHistoryItemClick, sessionId }) => {
  // State to hold the conversation history
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  // Fetch conversation history whenever the sessionId changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchConversationHistory();
        // Sort data in descending order based on string comparison
        const sortedData = data.sort((a, b) => b.localeCompare(a)); 
        setConversationHistory(sortedData); 
      } catch (error) {
        console.error('Failed to fetch conversation history:', error);
      }
    };

    fetchData();
  }, [sessionId]); // Dependency array includes sessionId to refetch on change

  // Handle clicking an item in the history list
  const handleItemClick = async (item: string) => {
    try {
      const thread: Thread = await changeConversationThread(item);
      onHistoryItemClick(thread);
    } catch (error) {
      console.error('Error changing thread:', error);
    }
  };

  // Handle clicking the "New Chat" button
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
          <li key={item}
              className={`historyItem ${item === sessionId ? 'activeHistoryItem' : ''}`}
              onClick={() => handleItemClick(item)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default History;
