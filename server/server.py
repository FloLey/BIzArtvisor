import os
import redis
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from pydantic import BaseModel
from datetime import datetime

from llm_assistant import LLMAssistant
from llms import Llms, LlmNames

# Configuration for Redis connection
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Initialize the Flask application and enable Cross-Origin Resource Sharing (CORS)
app = Flask(__name__)
CORS(app, expose_headers=["X-Session-ID"])

# Initialize the Language Model Assistant with a model, Redis URL, and a default session ID
llm_assistant = LLMAssistant(model_name=LlmNames.CLAUDE_3_HAIKU.value, redis_url=REDIS_URL, session_id=None)
print(llm_assistant.model_name)

class Message(BaseModel):
    """Pydantic model for a message, consisting of content and type."""
    content: str
    type: str


class Conversation(BaseModel):
    """Pydantic model for a conversation, containing a session ID and a list of messages."""
    session_id: str
    messages: list[Message]


@app.route('/')
def get_root():
    """Retrieves the history of conversations stored in Redis."""
    greeting = "hello, you shouldn't be here"
    return jsonify(greeting)


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
    messages = [Message(content=msg.content, type="human" if msg.type == "human" else "ai") for msg in
                conversation_history.messages]
    conversation = Conversation(session_id=session_id, messages=messages)
    return jsonify(conversation.dict())


@app.route('/stream_response', methods=['POST'])
def stream_response_route():
    """Streams the response from the language model for the given input text."""
    input_data = request.json.get('input', '')
    session_id = request.json.get('session_id', '')
    model_name = request.json.get('model_name', '')
    if llm_assistant.model_name != model_name:
        print(model_name)
        llm_assistant.set_model(model_name)

    if session_id == "new_session_id":
        llm_assistant.set_session_id(datetime.now().strftime("%m/%d/%Y-%H:%M:%S"))

    response = Response(llm_assistant.stream_response(input_data), content_type='text/plain')
    response.headers['X-Session-ID'] = llm_assistant.session_id
    return response

@app.route('/get_llm_names')
def get_llm_names():
    """Returns a list of all available LLM names."""
    llm_names = [model.value for model in LlmNames]
    return jsonify(llm_names)

if __name__ == '__main__':
    app.run(debug=True)
