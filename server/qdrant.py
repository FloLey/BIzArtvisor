import uuid
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchText
from qdrant_client.models import Distance, VectorParams
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from datetime import datetime


class QdrantManager:
    def __init__(self, collection_name: str, vector_dim: int, model_name: str = "WhereIsAI/UAE-Large-V1",
                 qdrant_url: str = "http://localhost:6333"):
        self.collection_name = collection_name
        self.qdrant_client = QdrantClient(url=qdrant_url)
        self.embed_model = HuggingFaceEmbedding(model_name=model_name, pooling="cls")
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

    def process_content(self, content: str, source: str) -> str:
        embedding = self.embed_model.get_text_embedding(content)

        filter_conditions = Filter(
            must=[FieldCondition(key="source", match=MatchText(text=source))]
        )
        search_results = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=embedding,
            query_filter=filter_conditions,
            limit=10
        )
        # Delete the found points
        self.qdrant_client.delete(
            collection_name=self.collection_name,
            points_selector=[result.id for result in search_results]  # Assuming the results have an 'id' field
        )

        # Generate a unique UUID for each point
        point_id = str(uuid.uuid4())
        current_datetime = datetime.now().isoformat()

        point_dict = {
            "id": point_id,
            "vector": embedding,
            "payload": {
                "text": content,
                "source": source,
                "date": current_datetime
            }
        }

        self.qdrant_client.upsert(collection_name=self.collection_name, points=[point_dict])
        return point_id
