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
export async function streamResponsesWithSession(input: string, session_id: string, model_name: string, useRAG: boolean, useNewsTool: boolean) {
  try {
    const response = await fetch(`${BASE_URL}/stream_response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, session_id, model_name, useRAG, useNewsTool }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const sessionIdFromHeader = response.headers.get('X-Session-ID');

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


/**
 * Fetches the available LLM model names from the backend.
 * @returns A promise that resolves to an array of strings representing the model names.
 */
export const fetchModelNames = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_llm_names`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: string[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching model names:', error);
    throw error;
  }
};



/**
 * Uploads a file to the server.
 * @param file The file to be uploaded.
 * @returns A promise that resolves to the server's response.
 */
// Assuming this is in your API service file (e.g., api.ts)

// Update the function to accept FormData
export const uploadFile = async (formData: FormData): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/upload_file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};


/**
 * Uploads website data for crawling and processing using FormData.
 * @param formData The FormData object containing website crawling parameters.
 * @returns A promise that resolves to the server's response.
 */
export const uploadWebsite = async (formData: FormData): Promise<any> => {
  console.log(formData)
  try {
    const response = await fetch(`${BASE_URL}/upload_website`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading website:', error);
    throw error;
  }
};


/**
 * Fetches the available Text Splitter names from the backend.
 * @returns A promise that resolves to an array of strings representing the text splitter names.
 */
export const fetchTextSplittersNames = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/get_text_splitters`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: string[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching text splitters names:', error);
    throw error;
  }
};