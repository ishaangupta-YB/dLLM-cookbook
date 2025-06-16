from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    mode: str 
    inception_api_key: str
    tavily_api_key: Optional[str] = None
    tools_enabled: bool = False
    max_tokens: int = 800

class ApiKeyValidation(BaseModel):
    api_key: str