from typing import Optional

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import RedisChatMessageHistory
import langchain_anthropic.chat_models as cm
from datetime import datetime


#FIX bug in langchain, can be removed after https://github.com/langchain-ai/langchain/pull/19034 is merged
cm._message_type_lookups = {
    "human": "user",
    "ai": "assistant",
    "AIMessageChunk": "assistant",
    "HumanMessageChunk": "user",
}


def _init_chat_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", "You're an assistant who's good at everything. Respond in 20 words or fewer"),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])


class LLMAssistant:
    def __init__(self, redis_url, model, session_id):
        self.redis_url = redis_url
        self.model = model
        self.session_id = session_id
        self.chat_prompt = _init_chat_prompt()

    def get_message_history(self, session_id: Optional[str] = None) -> RedisChatMessageHistory:
        if session_id is None:
            session_id = self.session_id
        return RedisChatMessageHistory(session_id, url=self.redis_url)

    def stream_response(self, input_text: str):
        def get_history_callable(session_id: str) -> BaseChatMessageHistory:
            return self.get_message_history(session_id)

        with_message_history = RunnableWithMessageHistory(
            self.chat_prompt | self.model,
            get_history_callable,
            input_messages_key="input",
            history_messages_key="history",
        )

        for response in with_message_history.stream({"input": input_text},
                                                    config={"configurable": {"session_id": self.session_id}}):
            yield response.content

    def set_session_id(self, new_session_id):
        self.session_id = new_session_id

    def set_model(self, model):
        self.model = model
