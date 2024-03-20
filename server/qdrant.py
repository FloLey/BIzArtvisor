import redis
from typing import List
from langchain_community.chat_message_histories import RedisChatMessageHistory


class RedisManager:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)

    def get_conversation_history(self) -> List[str]:
        """
        Retrieves the history of conversations stored in Redis.
        Returns a list of conversation identifiers.
        """
        history_items = [key.decode('utf-8').split(":", 1)[1] for key in self.redis.scan_iter("message_store:*")]
        return history_items

    def get_chat_message_history(self, session_id: str) -> RedisChatMessageHistory:
        """
        Retrieves chat message history for a given session.
        Assumes RedisChatMessageHistory can be initialized with session_id and works with the current Redis connection.
        """
        return RedisChatMessageHistory(session_id=session_id, redis_client=self.redis)
