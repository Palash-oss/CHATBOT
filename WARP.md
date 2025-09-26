# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project scope
- Medical RAG chatbot using Flask + LangChain + Pinecone + OpenAI. Local PDFs are chunked and embedded with Hugging Face; embeddings are stored in a Pinecone serverless index. The Flask app exposes a minimal chat UI that retrieves from Pinecone and answers via OpenAI.

Essential commands
- Create environment (example uses conda; any virtualenv works)
  - conda create -n medibot python=3.10 -y
  - conda activate medibot
  - pip install -r requirements.txt
- Configure secrets (used via python-dotenv)
  - Create .env at repo root with:
    - PINECONE_API_KEY=<your_key>
    - OPENAI_API_KEY=<your_key>
- Build index from local PDFs (expects PDFs under data/)
  - python store_index.py
- Run the web app locally
  - python app.py
  - App binds 0.0.0.0:8080 → open http://localhost:8080
- Docker (optional)
  - docker build -t medicalbot .
  - docker run --rm -p 8080:8080 --env-file .env medicalbot

Notes on linting and tests
- Linting: No linter/formatter config is present in this repo.
- Tests: No tests are present. If you add pytest-based tests, run a single test with:
  - pytest path/to/test_file.py::test_case_name -q

High-level architecture
- Data ingestion and preprocessing (offline, store_index.py)
  - Loads PDFs from data/ using langchain.document_loaders.DirectoryLoader + PyPDFLoader.
  - Minimizes metadata to only {"source"} (filter_to_minimal_docs in src/helper.py).
  - Splits documents with RecursiveCharacterTextSplitter(chunk_size=500, overlap=20).
  - Embeddings via HuggingFaceEmbeddings('sentence-transformers/all-MiniLM-L6-v2') → 384-dim vectors.
  - Pinecone:
    - Serverless index name: medical-chatbot
    - Dimension: 384, metric: cosine, cloud: aws, region: us-east-1
    - If missing, created at first run; text chunks upserted via LangChain’s PineconeVectorStore.from_documents.
- Serving and retrieval (online, app.py)
  - Environment is loaded from .env (python-dotenv).
  - Reconstructs the same embeddings model and connects to PineconeVectorStore.from_existing_index('medical-chatbot').
  - Defines retriever = docsearch.as_retriever(search_type="similarity", k=3).
  - LLM: ChatOpenAI(model="gpt-4o"). Prompt template (src/prompt.py) sets a concise medical assistant role and injects retrieved {context}.
  - Chains: create_stuff_documents_chain(chatModel, prompt) wrapped by create_retrieval_chain(retriever, ...).
- Web layer
  - Flask routes:
    - "/" renders templates/chat.html (Bootstrap UI, jQuery client).
    - "/get" (POST) reads form field msg and returns rag_chain.invoke({"input": msg})["answer"].
  - Frontend assets: templates/chat.html, static/style.css.

Operational prerequisites
- Data directory: Ensure data/ contains your source PDFs before running store_index.py.
- Pinecone/OpenAI access: Keys must be present in .env (or exported as environment variables) before index build or app run.

Key references from README.md
- Local run steps (env → pip install → .env → python store_index.py → python app.py → open localhost).
- AWS CI/CD (README-only): Mentions ECR repo and a GitHub Actions runner setup. Required GitHub Secrets listed:
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, ECR_REPO, PINECONE_API_KEY, OPENAI_API_KEY