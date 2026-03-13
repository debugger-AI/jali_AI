import os
import logging
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent
RAG_DATA_DIR = PROJECT_ROOT / "RAG data"
CHROMA_DIR = PROJECT_ROOT / "data" / "chroma_db"

# ---------------------------------------------------------------------------
# PDF Loader
# ---------------------------------------------------------------------------
def load_pdfs(data_dir: Path) -> List[dict]:
    """Load all PDFs from RAG data directory and subdirectories."""
    documents = []
    
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.error("PyMuPDF not installed. Run: pip install PyMuPDF")
        return documents
    
    for pdf_path in data_dir.rglob("*.pdf"):
        try:
            doc = fitz.open(str(pdf_path))
            category = pdf_path.parent.name  # GBV or Nani
            page_count = len(doc)
            max_pages = min(page_count, 50)  # Cap large books to 50 pages for fast testing
            if page_count > 50:
                logger.info(f"  {pdf_path.name} has {page_count} pages, indexing first 50")
            
            for page_num in range(max_pages):
                page = doc[page_num]
                text = page.get_text().strip()
                if len(text) < 50:  # skip near-empty pages
                    continue
                    
                documents.append({
                    "text": text,
                    "metadata": {
                        "source": pdf_path.name,
                        "category": category,
                        "page": page_num + 1,
                    }
                })
            
            logger.info(f"Loaded {pdf_path.name} ({page_count} pages)")
            doc.close()
        except Exception as e:
            logger.error(f"Failed to load {pdf_path}: {e}")
    
    # Also load .docx files
    for docx_path in data_dir.rglob("*.docx"):
        try:
            text = docx_path.read_text(encoding="utf-8", errors="ignore")
            if len(text) > 50:
                documents.append({
                    "text": text,
                    "metadata": {
                        "source": docx_path.name,
                        "category": docx_path.parent.name,
                        "page": 1,
                    }
                })
                logger.info(f"Loaded {docx_path.name}")
        except Exception as e:
            logger.error(f"Failed to load {docx_path}: {e}")
    
    logger.info(f"Total documents loaded: {len(documents)}")
    return documents


# ---------------------------------------------------------------------------
# Text Chunker
# ---------------------------------------------------------------------------
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if len(chunk.strip()) > 30:
            chunks.append(chunk.strip())
        start = end - overlap
    return chunks


# ---------------------------------------------------------------------------
# Vector Store (ChromaDB)
# ---------------------------------------------------------------------------
class JaliVectorStore:
    """Manages document embeddings using ChromaDB with sentence-transformers."""
    
    def __init__(self, persist_dir: str = None):
        self.persist_dir = persist_dir or str(CHROMA_DIR)
        self._collection = None
        self._client = None
    
    def _get_collection(self):
        if self._collection is not None:
            return self._collection
        
        import chromadb
        from chromadb.config import Settings
        
        os.makedirs(self.persist_dir, exist_ok=True)
        
        self._client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        
        self._collection = self._client.get_or_create_collection(
            name="jali_health_docs",
            metadata={"hnsw:space": "cosine"}
        )
        
        return self._collection
    
    def ingest(self, documents: List[dict]) -> int:
        """Ingest documents into the vector store."""
        collection = self._get_collection()
        
        all_chunks = []
        all_metadatas = []
        all_ids = []
        
        for doc in documents:
            chunks = chunk_text(doc["text"])
            for i, chunk in enumerate(chunks):
                doc_id = f"{doc['metadata']['source']}_p{doc['metadata']['page']}_c{i}"
                all_chunks.append(chunk)
                all_metadatas.append(doc["metadata"])
                all_ids.append(doc_id)
        
        # Batch insert (ChromaDB handles embedding via its default model)
        import time
        batch_size = 100
        total = 0
        for i in range(0, len(all_chunks), batch_size):
            batch_chunks = all_chunks[i:i+batch_size]
            batch_meta = all_metadatas[i:i+batch_size]
            batch_ids = all_ids[i:i+batch_size]
            
            collection.upsert(
                documents=batch_chunks,
                metadatas=batch_meta,
                ids=batch_ids,
            )
            total += len(batch_chunks)
            logger.info(f"Ingested batch: {total}/{len(all_chunks)} chunks")
            time.sleep(0.1)  # small pause to avoid compaction internal error
        
        logger.info(f"Total chunks in store: {collection.count()}")
        return collection.count()
    
    def search(self, query: str, n_results: int = 5, category: str = None) -> List[dict]:
        """Search for relevant documents."""
        collection = self._get_collection()
        
        where_filter = {"category": category} if category else None
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter,
        )
        
        docs = []
        if results and results["documents"]:
            for i, doc_text in enumerate(results["documents"][0]):
                docs.append({
                    "text": doc_text,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                })
        
        return docs
    
    @property
    def count(self) -> int:
        return self._get_collection().count()


# ---------------------------------------------------------------------------
# Build the vector store from RAG data
# ---------------------------------------------------------------------------
def build_index():
    """One-time: load all PDFs and ingest into ChromaDB."""
    logger.info("Building RAG index from PDFs...")
    
    documents = load_pdfs(RAG_DATA_DIR)
    if not documents:
        logger.warning("No documents found. Check RAG data directory.")
        return 0
    
    store = JaliVectorStore()
    count = store.ingest(documents)
    logger.info(f"Index built with {count} chunks.")
    return count


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    count = build_index()
    print(f"\nDone. {count} chunks indexed.")
    
    # Quick test search
    store = JaliVectorStore()
    results = store.search("How to support GBV survivors in Kenya?", n_results=3)
    print(f"\nTest search returned {len(results)} results:")
    for r in results:
        print(f"  [{r['metadata'].get('category')}] {r['metadata'].get('source')} p.{r['metadata'].get('page')}")
        print(f"    {r['text'][:120]}...")
