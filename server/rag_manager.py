import os
from typing import Optional
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import RedisChatMessageHistory
import langchain_anthropic.chat_models as cm
os.environ['LANGCHAIN_TRACING_V2'] = 'true'

from llms import model_registry

# Temporary fix for a bug in langchain related to message type lookups.
# This fix assigns correct roles (user or assistant) to message chunks based on their origin.
cm._message_type_lookups = {
    "human": "user",
    "ai": "assistant",
    "AIMessageChunk": "assistant",
    "HumanMessageChunk": "user",
}


def _init_chat_prompt():
    """Initializes the chat prompt template with a system message and placeholders for message history and user
    input."""
    return ChatPromptTemplate.from_messages([
        ("system", "You're an helpful AI assistant. Respond as best as you can to the asked questions."),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])


class LLMAssistant:
    """A language model assistant class that handles interaction with users through a chat interface."""

    def __init__(self, redis_url: str, model_name: str, session_id: Optional[str]):
        """Initializes the assistant with Redis connection, model, and session identifiers."""
        self.redis_url = redis_url
        self.model_name = model_name
        self.session_id = session_id
        self.chat_prompt = _init_chat_prompt()

    def get_message_history(self, session_id: Optional[str] = None) -> RedisChatMessageHistory:
        """Retrieves the message history for a given session from Redis."""
        if session_id is None:
            session_id = self.session_id
        return RedisChatMessageHistory(session_id, url=self.redis_url)

    def stream_response(self, input_text: str):
        """Streams responses from the language model for the given input text, utilizing the chat history."""

        def get_history_callable(session_id: str) -> BaseChatMessageHistory:
            return self.get_message_history(session_id)

        model = model_registry[self.model_name]
        with_message_history = RunnableWithMessageHistory(
            self.chat_prompt | model,
            get_history_callable,
            input_messages_key="input",
            history_messages_key="history",
        )

        for response in with_message_history.stream({"input": input_text},
                                                    config={"configurable": {"session_id": self.session_id}}):
            yield response.content

    def set_session_id(self, new_session_id: str):
        """Updates the session identifier for the assistant."""
        self.session_id = new_session_id

    def set_model(self, model_name):
        """Updates the model used by the assistant."""
        self.model_name = model_name
