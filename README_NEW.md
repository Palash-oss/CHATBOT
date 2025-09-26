# Healthcare AI Bot - Modern Web Interface

A modern, responsive healthcare AI chatbot with an intuitive web interface featuring symptom analysis, prevention tips, vaccination schedules, and nearby hospital locator.

## Features

- 🤖 **AI-Powered Healthcare Assistant** - Get instant guidance on symptoms, prevention, and health concerns
- 🗺️ **Interactive Hospital Locator** - Find nearby hospitals with real-time map integration
- 💬 **Modern Chat Interface** - Clean, intuitive chat experience with smooth animations
- 🌍 **Multi-Language Support** - Interface available in multiple languages
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Professional Design** - Clean, modern healthcare-focused UI with green color scheme

## Prerequisites

- Python 3.10 or higher
- Pinecone API key (for vector database)
- OpenAI API key (for GPT-4 model)
- PDF files for medical knowledge base

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd Build-a-Complete-Medical-Chatbot-with-LLMs-LangChain-Pinecone-Flask-AWS
```

### Step 2: Create Virtual Environment

Using conda:
```bash
conda create -n medibot python=3.10 -y
conda activate medibot
```

Or using venv:
```bash
python -m venv medibot_env
# On Windows:
medibot_env\Scripts\activate
# On Mac/Linux:
source medibot_env/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
PINECONE_API_KEY=your_pinecone_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 5: Prepare Medical Data

Place your medical PDF files in the `data/` directory. The system will process these PDFs to create the knowledge base.

### Step 6: Build the Vector Index

This step processes your PDFs and creates embeddings in Pinecone:

```bash
python store_index.py
```

This will:
- Load PDFs from the `data/` folder
- Split them into chunks
- Generate embeddings using HuggingFace
- Store them in Pinecone vector database

### Step 7: Run the Application

```bash
python app.py
```

The application will start on `http://localhost:8080`

## Using the Application

1. **Open your browser** and navigate to `http://localhost:8080`

2. **Test the Chatbot**:
   - Scroll to the "Test the Chatbot" section
   - Type your health-related questions
   - Press Enter or click Send
   - Receive AI-powered responses based on your medical knowledge base

3. **Find Nearby Hospitals**:
   - Scroll to the "Nearby Hospitals" section
   - Click "Get My Location" button
   - Allow location access when prompted
   - View hospitals on the interactive map
   - Click on hospital cards to open in Google Maps

4. **Explore Features**:
   - Browse through the Features section to understand capabilities
   - Use the navigation menu to jump between sections

## Project Structure

```
.
├── app.py                 # Main Flask application
├── store_index.py         # Script to build Pinecone index
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables (create this)
├── data/                 # Medical PDF files directory
├── src/
│   ├── helper.py         # Helper functions for PDF processing
│   └── prompt.py         # System prompts for AI
├── static/
│   ├── modern_style.css  # Modern UI styles
│   ├── app.js           # JavaScript for chat and map functionality
│   └── style.css        # (Old styles - can be removed)
└── templates/
    ├── index.html       # Modern main page template
    └── chat.html        # (Old template - can be removed)
```

## API Endpoints

- `GET /` - Main page with all features
- `POST /api/chat` - Chat endpoint for AI responses
  - Request: `{ "message": "your question" }`
  - Response: `{ "response": "AI response" }`

## Technology Stack

- **Backend**: Flask (Python web framework)
- **AI/ML**: 
  - OpenAI GPT-4 for conversation
  - HuggingFace Transformers for embeddings
  - LangChain for orchestration
- **Vector Database**: Pinecone
- **Frontend**: 
  - HTML5/CSS3/JavaScript
  - Leaflet.js for maps
  - Font Awesome for icons
- **Styling**: Custom CSS with modern design principles

## Troubleshooting

### Issue: "No module named 'xxx'"
**Solution**: Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: "API key not found"
**Solution**: Make sure your `.env` file exists and contains valid API keys

### Issue: "No PDFs found in data directory"
**Solution**: Place at least one PDF file in the `data/` folder before running `store_index.py`

### Issue: Map not showing
**Solution**: The map uses OpenStreetMap tiles. Ensure you have an internet connection.

### Issue: Chat not responding
**Solution**: 
1. Check that the Flask server is running
2. Verify API keys are correct
3. Ensure the Pinecone index was created successfully

## Docker Support (Optional)

Build and run with Docker:

```bash
# Build image
docker build -t healthcare-bot .

# Run container
docker run -p 8080:8080 --env-file .env healthcare-bot
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on the GitHub repository.