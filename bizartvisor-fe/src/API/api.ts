const BASE_URL = 'http://localhost:5000';

// Function to fetch conversation history
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

export interface Thread {
  session_id: string;
  messages: IMessage[];
}

export interface IMessage {
  message: string;
  sender: 'user' | 'bot';
}

export const changeConversationThread = async (id: string): Promise<Thread> => {
  try {
    // Encode the ID for safe inclusion in the URL query string
    const encodedId = encodeURIComponent(id);
    // Adjust the fetch URL to use a query parameter for the ID
    const response = await fetch(`${BASE_URL}/change_message_thread?id=${encodedId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    // Transform the data to fit the Thread interface
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


export async function streamResponsesWithSession(input: string, session_id: string) {
  try {
    const response = await fetch(`${BASE_URL}/stream_response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, session_id }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const sessionIdFromHeader = response.headers.get('X-Session-ID');
    console.log(response)

    return { 
      sessionIdFromHeader, 
      contentStream: (async function* () {
        if (!response.body) {
          throw new Error("No response body");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          yield chunk;
        }
      })()
    };
  } catch (error) {
    console.error('Error streaming response:', error);
    throw error;
  }
}