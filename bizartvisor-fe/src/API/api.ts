const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000"
// Interfaces defining the structure of messages and threads
export interface IMessage {
  message: string;
  sender: 'user' | 'bot';
}

export interface Thread {
  session_id: string;
  messages: IMessage[];
}

/**
 * Fetches the conversation history from the backend.
 * @returns A promise that resolves to an array of strings representing conversation histories.
 */
export const fetchConversationHistory = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_conversation_history`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: string[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw error;
  }
};

/**
 * Changes the active conversation thread to the one specified by the given ID.
 * @param id The ID of the conversation thread to switch to.
 * @returns A promise that resolves to the new Thread object.
 */
export const changeConversationThread = async (id: string): Promise<Thread> => {
  try {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(`${BASE_URL}/change_message_thread?id=${encodedId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const thread: Thread = {
      session_id: data.session_id,
      messages: data.messages.map((msg: { content: string; type: string }) => ({
        message: msg.content,
        sender: msg.type === 'human' ? 'user' : 'bot'
      }))
    };
    return thread;
  } catch (error) {
    console.error('Error changing thread:', error);
    throw error;
  }
};

/**
 * Streams responses for a given input and session ID from the backend.
 * @param input The user's input message.
 * @param session_id The current session ID.
 * @returns An object containing the new session ID and a generator function for streaming the response content.
 */
export async function streamResponsesWithSession(input: string, session_id: string) {
  try {
    const response = await fetch(`${BASE_URL}/stream_response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, session_id }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const sessionIdFromHeader = response.headers.get('X-Session-ID');
    console.log(response);

    return { 
      sessionIdFromHeader, 
      contentStream: (async function* () {
        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          yield decoder.decode(value, { stream: true });
        }
      })()
    };
  } catch (error) {
    console.error('Error streaming response:', error);
    throw error;
  }
}
