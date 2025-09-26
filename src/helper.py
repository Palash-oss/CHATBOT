from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from typing import List
from langchain.schema import Document


#Extract Data From the PDF File
def load_pdf_file(data):
    loader= DirectoryLoader(data,
                            glob="*.pdf",
                            loader_cls=PyPDFLoader)

    documents=loader.load()

    return documents



def filter_to_minimal_docs(docs: List[Document]) -> List[Document]:
    """
    Normalize document metadata for better filtering during retrieval.
    Adds:
      - source: original loader source path
      - lang: two-letter code (en, or, hi) inferred from filename
      - doc_type: coarse type like 'hospital_list' or 'medical_book'
    """
    minimal_docs: List[Document] = []
    for doc in docs:
        src = doc.metadata.get("source") or ""
        filename = (src.split("/")[-1] or src.split("\\")[-1]) if src else ""

        # Infer language
        lang = "en"
        lower_name = filename.lower()
        if "odia" in lower_name or "oriya" in lower_name or "anubhuta" in lower_name:
            lang = "or"
        elif "hindi" in lower_name:
            lang = "hi"

        # Infer document type
        doc_type = "general"
        if "hospital" in lower_name:
            doc_type = "hospital_list"
        elif "medical" in lower_name or "book" in lower_name:
            doc_type = "medical_book"

        minimal_docs.append(
            Document(
                page_content=doc.page_content,
                metadata={
                    "source": src,
                    "lang": lang,
                    "doc_type": doc_type,
                }
            )
        )
    return minimal_docs



#Split the Data into Text Chunks
def text_split(extracted_data):
    text_splitter=RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=20)
    text_chunks=text_splitter.split_documents(extracted_data)
    return text_chunks



#Download the Embeddings from HuggingFace 
def download_hugging_face_embeddings():
    embeddings=HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')  #this model return 384 dimensions
    return embeddings