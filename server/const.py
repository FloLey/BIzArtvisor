from enum import Enum

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI


class Llms(Enum):
    ANTHROPIC_HAIKU = ChatAnthropic(model_name="claude-3-haiku-20240307", temperature=0)
    ANTHROPIC_OPUS = ChatAnthropic(model_name="claude-3-opus-20240307", temperature=0)
    ANTHROPIC_SONNET = ChatAnthropic(model_name="claude-3-sonnet-20240307", temperature=0)
    OPENAI_GPT4 = ChatOpenAI(model="gpt-4-0125-preview", temperature=0)
    OPENAI_GPT4_TURBO = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
    OPENAI_GPT3_5 = ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0)


class LlmNames(Enum):
    CLAUDE_3_HAIKU = "Claude 3 haiku"
    CLAUDE_3_OPUS = "Claude 3 opus"
    CLAUDE_3_SONNET = "Claude 3 sonnet"
    OPENAI_GPT4 = "OpenAI GPT4"
    OPENAI_GPT4_TURBO = "OpenAI GPT4 Turbo"
    OPENAI_GPT3_5_TURBO = "OpenAI GPT3.5 Turbo"


model_registry = {
    LlmNames.CLAUDE_3_HAIKU.value: Llms.ANTHROPIC_HAIKU.value,
    LlmNames.CLAUDE_3_OPUS.value: Llms.ANTHROPIC_OPUS.value,
    LlmNames.OPENAI_GPT4.value: Llms.ANTHROPIC_SONNET.value,
    LlmNames.CLAUDE_3_SONNET.value: Llms.OPENAI_GPT4.value,
    LlmNames.OPENAI_GPT4_TURBO.value: Llms.OPENAI_GPT4_TURBO.value,
    LlmNames.OPENAI_GPT3_5_TURBO.value: Llms.OPENAI_GPT3_5.value,
}


class TextSplitters(Enum):
    RECURSIVE_CHARACTER = "recursive_character"
    SEMANTIC_CHUNKER = "semantic_chunker"
    NONE = "None"