import redis
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from pydantic import BaseModel
from datetime import datetime

from langchain_anthropic import ChatAnthropic
from llms import LLMAssistant

# Configuration for Redis connection
REDIS_HOST = 'localhost'
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Initialize the language model with specific settings
model = ChatAnthropic(temperature=0, model_name="claude-3-haiku-20240307")

# Initialize the Flask application and enable Cross-Origin Resource Sharing (CORS)
app = Flask(__name__)
CORS(app, expose_headers=["X-Session-ID"])

# Initialize the Language Model Assistant with a model, Redis URL, and a default session ID
llm_assistant = LLMAssistant(model=model, redis_url=REDIS_URL, session_id=None)


class Message(BaseModel):
    """Pydantic model for a message, consisting of content and type."""
    content: str
    type: str

class Conversation(BaseModel):
    """Pydantic model for a conversation, containing a session ID and a list of messages."""
    session_id: str
    messages: list[Message]


@app.route('/get_conversation_history')
def get_history():
    """Retrieves the history of conversations stored in Redis."""
    r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)
    history_items = [key.decode('utf-8').split(":", 1)[1] for key in r.scan_iter("message_store:*")]
    return jsonify(history_items)

@app.route('/change_message_thread')
def change_message_thread():
    """Changes the current message thread (session) to the one specified by the 'id' query parameter."""
    session_id = request.args.get('id')
    if not session_id:
        return jsonify({'error': 'ID parameter is required.'}), 400
    
    llm_assistant.set_session_id(session_id)
    conversation_history = llm_assistant.get_message_history(session_id)
    messages = [Message(content=msg.content, type="human" if msg.type == "human" else "ai") for msg in conversation_history.messages]
    conversation = Conversation(session_id=session_id, messages=messages)
    return jsonify(conversation.dict())

@app.route('/stream_response', methods=['POST'])
def stream_response_route():
    """Streams the response from the language model for the given input text."""
    input_data = request.json.get('input', '')
    session_id = request.json.get('session_id', '')
    if session_id == "new_session_id":
        llm_assistant.set_session_id(datetime.now().strftime("%m/%d/%Y-%H:%M:%S"))
    
    response = Response(llm_assistant.stream_response(input_data), content_type='text/plain')
    response.headers['X-Session-ID'] = llm_assistant.session_id
    return response

if __name__ == '__main__':
    app.run(debug=True)
