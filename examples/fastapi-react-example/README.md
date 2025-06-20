# FastAPI + React dLLM Example

This directory contains a full-stack application demonstrating how to build a chat interface for dLLM using FastAPI as the backend and React (with Vite) as the frontend. This example showcases both streaming and diffusing modes, along with tool integration for web search.

## Demo Video
https://github.com/user-attachments/assets/2d57e225-2c8f-4271-9166-7afa7fde1ead

## Architecture

- **Backend**: FastAPI with Python, providing REST API endpoints
- **Frontend**: React with TypeScript, Vite, and Tailwind CSS
- **State Management**: Zustand for client-side state
- **UI Components**: Shadcn/ui components
- **Styling**: Tailwind CSS with dark/light mode support

## Features

### Backend Features
- **Streaming & Diffusing Support**: Both response modes from dLLM
- **Tool Integration**: Web search using Tavily API
- **API Key Validation**: Endpoint to validate Inception Labs API keys
- **CORS Support**: Configured for frontend communication
- **Error Handling**: Comprehensive error handling and status codes

### Frontend Features
- **Modern React UI**: Built with TypeScript and Vite
- **Real-time Streaming**: Live updates as responses are generated
- **Mode Switching**: Toggle between streaming and diffusing modes
- **Tool Integration**: Optional web search functionality
- **API Key Management**: Secure client-side key storage and validation
- **Dark/Light Mode**: Theme switching with system preference support
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: User-friendly error messages and notifications

## Project Structure

```
fastapi-react-example/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── lib/            # Utilities and stores
    │   └── ...
    ├── package.json        # Node.js dependencies
    └── ...
```

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- Inception Labs API key
- Tavily API key (optional, for web search)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd examples/fastapi-react-example/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   python main.py
   ```
   
   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd examples/fastapi-react-example/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## Usage

1. **Open the application** in your browser at `http://localhost:5173`
2. **Enter your API keys** in the settings dialog
3. **Validate your Inception Labs API key** using the validate button
4. **Choose your chat mode** (streaming or diffusing)
5. **Enable web search** if you have a Tavily API key
6. **Start chatting** with the dLLM!

## API Endpoints

### Backend Endpoints

- `POST /validate-api-key` - Validate an Inception Labs API key
- `POST /chat` - Main chat endpoint with streaming support

### Request/Response Examples

**Chat Request:**
```json
{
  "messages": [
    {"role": "user", "content": "What is quantum computing?"}
  ],
  "mode": "streaming",
  "inception_api_key": "your-key-here",
  "tavily_api_key": "optional-tavily-key",
  "tools_enabled": true,
  "max_tokens": 800
}
```

**Streaming Response:**
```
data: {"content": "Quantum computing is...", "mode": "streaming"}
data: {"content": "Quantum computing is a revolutionary...", "mode": "streaming"}
data: [DONE]
```

## Key Components

### Backend Components
- **`main.py`**: FastAPI application with chat and validation endpoints
- **`models.py`**: Pydantic models for request/response validation
- **Tool Integration**: Web search functionality using Tavily API

### Frontend Components
- **`ChatInterface.tsx`**: Main chat interface component
- **`ChatInput.tsx`**: Message input with mode switching
- **`Messages.tsx`**: Message display with markdown support
- **`ApiKeySetup.tsx`**: API key configuration and validation
- **`stores.ts`**: Zustand stores for state management

## Technologies Used

### Backend
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation using Python type annotations
- **Requests**: HTTP library for API calls
- **Uvicorn**: ASGI server for FastAPI

### Frontend
- **React 19**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful and accessible UI components
- **Zustand**: Lightweight state management
- **React Markdown**: Markdown rendering with syntax highlighting
- **Sonner**: Toast notifications

## Development Notes

- The backend uses streaming responses for real-time chat
- The frontend handles both streaming and diffusing modes differently
- Tool calls are processed in a two-step approach for diffusing mode
- API keys are stored securely in browser localStorage
- The application supports both light and dark themes
- Error handling is implemented at both frontend and backend levels 
