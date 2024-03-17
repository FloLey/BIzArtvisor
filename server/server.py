import redis
from flask_cors import CORS

from flask import Flask, Response, jsonify, request
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel

from llms import LLMAssistant
from datetime import datetime

REDIS_PORT = 6379
REDIS_HOST = 'localhost'
REDIS_DB = 0

REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
model = ChatAnthropic(temperature=0, model_name="claude-3-haiku-20240307")

app = Flask(__name__)
CORS(app, expose_headers=["X-Session-ID"])

llm_assistant = LLMAssistant(model=model, redis_url=REDIS_URL, session_id=None)


@app.route('/get_conversation_history')
def get_history():
    r = redis.StrictRedis(host='localhost', port=6379, db=0)
    history_items = []
    for key in r.scan_iter("message_store:*"):
        history_items.append(key.decode('utf-8').split(":", 1)[1])

    return jsonify(history_items)


class Message(BaseModel):
    content: str
    type: str


class Conversation(BaseModel):
    session_id: str
    messages: list[Message]


@app.route('/change_message_thread')
def change_message_thread():
    id = request.args.get('id')
    if not id:
        return jsonify({'error': 'ID parameter is required.'}), 400
    llm_assistant.set_session_id(id)
    conversation_history = llm_assistant.get_message_history(id)
    session_id = conversation_history.session_id
    messages = []
    for msg in conversation_history.messages:
        content = msg.content
        type = "human" if msg.type == "human" else "ai"
        messages.append(Message(content=content, type=type))
    conversation = Conversation(session_id=session_id, messages=messages)
    return jsonify(conversation.dict())


@app.route('/stream_response', methods=['POST'])
def stream_response_route():
    input_data = request.json.get('input', '')
    session_id = request.json.get('session_id', '')
    if session_id == "new_session_id":
        now = datetime.now()
        llm_assistant.set_session_id(now.strftime("%m/%d/%Y-%H:%M:%S"))
    response = Response(llm_assistant.stream_response(input_data), content_type='text/plain')
    # Set a custom header with the session ID
    response.headers['X-Session-ID'] = llm_assistant.session_id
    print(response.headers)
    return response


if __name__ == '__main__':
    app.run(debug=True)
