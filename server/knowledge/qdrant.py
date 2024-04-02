from datetime import datetime
import uuid
from typing import Optional, List

from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.retrievers import BaseRetriever
from openai import OpenAI
from pydantic.v1.main import ModelMetaclass
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import FieldCondition, MatchText
from qdrant_client.models import Distance, VectorParams
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from langchain_core.documents import Document

from const import TextSplitters

client = OpenAI()


def get_embedding(text, model="text-embedding-3-small"):
    return client.embeddings.create(input=[text], model=model).data[0].embedding


class QdrantManager:
    def __init__(self, collection_name: str, vector_dim: int = 1536, qdrant_url: str = "http://localhost:6333"):
        self.collection_name = collection_name
        print(qdrant_url)
        self.qdrant_client = QdrantClient(url=qdrant_url)
        self.vector_dim = vector_dim
        self.ensure_collection()

    def ensure_collection(self):
        try:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.vector_dim, distance=Distance.COSINE)
            )
        except Exception:
            pass

    def recursive_character_text_splitter(self, content: str, chunk_size: int, chunk_overlap: int):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )
        return [x.page_content for x in text_splitter.create_documents([content])]

    def semantic_chunker_text_splitter(self, content: str, number_of_chunks):
        text_splitter = SemanticChunker(OpenAIEmbeddings(), number_of_chunks=number_of_chunks)
        return [x.page_content for x in text_splitter.create_documents([content])]

    def process_content(self, content: str, source: str, context: Optional[str] = None, splitter=None,
                        splitter_args=None):
        if splitter and splitter_args:
            if splitter == TextSplitters.RECURSIVE_CHARACTER.value:
                expected_keys = {'chunk_size', 'chunk_overlap'}
                filtered_args = {k: int(v) for k, v in splitter_args.items() if k in expected_keys}
                content_parts = self.recursive_character_text_splitter(content, **filtered_args)

            elif splitter == TextSplitters.SEMANTIC_CHUNKER.value:
                expected_keys = {'number_of_chunks'}
                filtered_args = {k: int(v) for k, v in splitter_args.items() if k in expected_keys}
                content_parts = self.semantic_chunker_text_splitter(content, **filtered_args)

            else:
                raise ValueError("Invalid splitter specified.")
        else:
            content_parts = self.recursive_character_text_splitter(content, chunk_size=8100, chunk_overlap=0)

        # Remove existing data for this source
        search_results = self.qdrant_client.scroll(
            collection_name=self.collection_name,
            limit=10000,
            scroll_filter=models.Filter(
                must=[FieldCondition(key="source", match=MatchText(text=source))]
            ),
        )
        if search_results[0]:
            # Delete the found points
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=[result.id for result in search_results[0]]
            )

        content_parts = list(filter(lambda x: x != "", content_parts))
        points_to_upsert = []
        for content_part in content_parts:
            if context:
                content_part = f"{context}\n\n{content_part}"
            embedding = get_embedding(content_part)
            point_id = str(uuid.uuid4())
            current_datetime = datetime.now().isoformat()

            point_dict = {
                "id": point_id,
                "vector": embedding,
                "payload": {
                    "text": content_part,
                    "source": source,
                    "date": current_datetime,
                }
            }
            points_to_upsert.append(point_dict)

        if points_to_upsert:
            try:
                self.qdrant_client.upsert(collection_name=self.collection_name, points=points_to_upsert)
            except Exception as e:
                print(e)


class QdrantRetriever(BaseRetriever, metaclass=ModelMetaclass):
    top_k: int = 5
    collection_name: str
    qdrant_url:str

    @property
    def qdrant_client(self):
        return QdrantClient(url=self.qdrant_url)

    def _get_relevant_documents(
            self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        try:
            encoded_query = get_embedding(query)
            result = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=encoded_query,
                limit=self.top_k,
            )
            documents = [Document(
                page_content=x.payload["text"],
                metadata={
                    "id": x.id,
                    "score": x.score,
                    "date": x.payload["date"],
                    "source": x.payload["source"],
                }
            ) for x in result]
        except Exception as e:
            print(f"Failed to get context: {e}")
            return []
        return documents
