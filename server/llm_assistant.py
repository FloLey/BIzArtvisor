import os
from typing import Optional
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import RedisChatMessageHistory
import langchain_anthropic.chat_models as cm

from qdrant import QdrantRetriever
from redis_db import RedisManager

os.environ['LANGCHAIN_TRACING_V2'] = 'true'

from const import model_registry

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

    def __init__(self, redis_manager: RedisManager, model_name: str, session_id: Optional[str]):
        """Initializes the assistant with Redis connection, model, and session identifiers."""
        self.redis_manager = redis_manager
        self.model_name = model_name
        self.session_id = session_id
        self.chat_prompt = _init_chat_prompt()

    def get_message_history(self, session_id: Optional[str] = None) -> RedisChatMessageHistory:
        """Retrieves the message history for a given session from Redis."""
        if session_id is None:
            session_id = self.session_id
        return self.redis_manager.get_chat_message_history(session_id)

    def stream_response(self, input_text: str, qdrant_retriever: QdrantRetriever, use_rag = False):
        """Streams responses from the language model for the given input text, utilizing the chat history."""
        model = model_registry[self.model_name]
        def get_history_callable(session_id: str) -> BaseChatMessageHistory:
            return self.get_message_history(session_id)

        def format_docs(docs):
            formatted_docs = []
            for doc in docs:
                # Extract metadata values
                date = doc.metadata.get("date", "Unknown date")
                source = doc.metadata.get("source", "Unknown source")

                # Format each document string with its date and source
                formatted_doc = f"Date: {date}\nSource: {source}\n\n{doc.page_content}"
                formatted_docs.append(formatted_doc)

            # Join all formatted documents with a separator
            return "\n\n----------------\n\n".join(formatted_docs)

        if use_rag:
            contextualize_q_system_prompt = "Given a chat history and the latest user question \
            which might reference context in the chat history, formulate a standalone question \
            which can be understood without the chat history. Do NOT answer the question, \
            just reformulate it if needed and otherwise return it as is."
            contextualize_q_prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", contextualize_q_system_prompt),
                    MessagesPlaceholder(variable_name="history"),
                    ("human", "{input}"),
                ]
            )
            contextualize_q_chain = contextualize_q_prompt | model | StrOutputParser()

            qa_system_prompt = """You are an assistant for question-answering tasks. \
Use the following pieces of retrieved context to answer the question. \
If you don't know the answer, just say that you don't know. \
Use three sentences maximum and keep the answer concise.\

{context}"""
            qa_prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", qa_system_prompt),
                    MessagesPlaceholder(variable_name="history"),
                    ("human", "{input}"),
                ]
            )

            def contextualized_question(input: dict):
                if input.get("history"):
                    return contextualize_q_chain
                else:
                    return input["input"]

            rag_chain = (
                    RunnablePassthrough.assign(
                        context=contextualized_question | qdrant_retriever | format_docs
                    )
                    | qa_prompt
                    | model
            )
            with_message_history = RunnableWithMessageHistory(
                rag_chain,
                get_history_callable,
                input_messages_key="input",
                history_messages_key="history",
            )

        else:
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
