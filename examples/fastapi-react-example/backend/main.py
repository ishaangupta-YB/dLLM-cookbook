from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import requests
import json
import time
from typing import Dict, Any, Generator, Tuple, List
from models import ChatRequest, ApiKeyValidation, Message

app = FastAPI(title="dLLM Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def search_web(query: str, api_key: str, max_results: int = 3) -> Dict[str, Any]:
    """Search the web using Tavily API"""
    try:
        response = requests.post(
            'https://api.tavily.com/search',
            headers={'Content-Type': 'application/json'},
            json={
                'api_key': api_key,
                'query': query,
                'search_depth': 'basic',
                'include_answer': True,
                'max_results': max_results,
                'include_raw_content': False
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            
            results = []
            for result in data.get('results', []):
                results.append({
                    'title': result.get('title', ''),
                    'url': result.get('url', ''),
                    'content': result.get('content', '')
                })
            
            return {
                'answer': data.get('answer', ''),
                'results': results,
                'query': query
            }
        else:
            return {"error": f"Search failed with status: {response.status_code}"}
            
    except Exception as e:
        return {"error": f"Search error: {str(e)}"}

def get_tools():
    """Get tools definition"""
    return [{
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information on any topic",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "max_results": {"type": "integer", "description": "Max results (default: 3)", "default": 3}
                },
                "required": ["query"]
            }
        }
    }]

def get_tool_calls_without_diffusing(messages: List[Dict], api_key: str) -> Tuple[str, List[Dict]]:
    """Step 1: Get tool calls without diffusing"""
    try:
        payload = {
            "model": "mercury-coder",
            "messages": messages,
            "max_tokens": 800,
            "stream": True,
            "diffusing": False,  # Key: No diffusing for tool calls
            "tools": get_tools()
        }
        
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json=payload,
            stream=True
        )
        
        if response.status_code != 200:
            return f"Error: API request failed with status {response.status_code}", []
        
        full_response = ""
        tool_calls = []
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data_str = line[6:]
                    if data_str.strip() == '[DONE]':
                        break
                    if data_str.startswith('{'):
                        try:
                            data = json.loads(data_str)
                            choice = data.get("choices", [{}])[0]
                            delta = choice.get("delta", {})
                            
                            # Handle content
                            if "content" in delta and delta["content"]:
                                content = delta["content"]
                                full_response += content
                            
                            # Handle tool calls
                            if "tool_calls" in delta and delta["tool_calls"]:
                                for tool_call in delta["tool_calls"]:
                                    index = tool_call.get("index", 0)
                                    
                                    while len(tool_calls) <= index:
                                        tool_calls.append({
                                            "id": "",
                                            "type": "function",
                                            "function": {"name": "", "arguments": ""}
                                        })
                                    
                                    if "id" in tool_call:
                                        tool_calls[index]["id"] = tool_call["id"]
                                    
                                    if "function" in tool_call:
                                        func = tool_call["function"]
                                        if "name" in func:
                                            tool_calls[index]["function"]["name"] = func["name"]
                                        if "arguments" in func:
                                            tool_calls[index]["function"]["arguments"] += func["arguments"]
                                            
                        except json.JSONDecodeError:
                            continue
        
        return full_response, tool_calls
        
    except Exception as e:
        return f"Error: {str(e)}", []

def stream_inception_response(messages: List[Dict], api_key: str, diffusing: bool = False, tools: List[Dict] = None) -> Generator[str, None, None]:
    """Stream response from Inception API"""
    try:
        payload = {
            "model": "mercury-coder",
            "messages": messages,
            "max_tokens": 800,
            "stream": True,
            "diffusing": diffusing
        }
        
        if tools:
            payload["tools"] = tools
        
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json=payload,
            stream=True
        )
        
        if response.status_code != 200:
            yield f"data: {json.dumps({'error': f'API request failed with status {response.status_code}'})}\n\n"
            return
        
        if diffusing:
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str.strip() == '[DONE]':
                            yield "data: [DONE]\n\n"
                            break
                        if data_str.startswith('{'):
                            try:
                                data = json.loads(data_str)
                                if 'choices' in data and len(data['choices']) > 0:
                                    delta = data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content is not None:
                                        yield f"data: {json.dumps({'content': content, 'mode': 'diffusing'})}\n\n"
                            except json.JSONDecodeError:
                                continue
        else:
            # Streaming mode  
            accumulated_content = ""
            tool_calls_data = []
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str.strip() == '[DONE]':
                            yield "data: [DONE]\n\n"
                            break
                        if data_str.startswith('{'):
                            try:
                                data = json.loads(data_str)
                                if 'choices' in data and len(data['choices']) > 0:
                                    choice = data['choices'][0]
                                    delta = choice.get('delta', {})
                                    
                                    # Handle regular content
                                    content = delta.get('content', '')
                                    if content:
                                        accumulated_content += content
                                        yield f"data: {json.dumps({'content': accumulated_content, 'mode': 'streaming'})}\n\n"
                                    
                                    # Handle tool calls
                                    tool_calls = delta.get('tool_calls')
                                    if tool_calls is not None:
                                        for tool_call in tool_calls:
                                            idx = tool_call.get('index', 0)
                                            
                                            while len(tool_calls_data) <= idx:
                                                tool_calls_data.append({'function': {'name': '', 'arguments': ''}})
                                            
                                            if 'function' in tool_call:
                                                if 'name' in tool_call['function']:
                                                    tool_calls_data[idx]['function']['name'] = tool_call['function']['name']
                                                if 'arguments' in tool_call['function']:
                                                    tool_calls_data[idx]['function']['arguments'] += tool_call['function']['arguments']
                                    
                                    finish_reason = choice.get('finish_reason')
                                    if finish_reason == 'tool_calls' and tool_calls_data:
                                        search_text = '\n\n🔍 **Searching...**\n\n'
                                        yield f"data: {json.dumps({'content': accumulated_content + search_text, 'mode': 'streaming'})}\n\n"
                                        return 
                                        
                            except json.JSONDecodeError:
                                continue
                                
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.post("/validate-api-key")
async def validate_api_key(request: ApiKeyValidation):
    """Validate Inception Labs API key"""
    try:
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {request.api_key}'
            },
            json={
                'model': 'mercury-coder',
                'messages': [{"role": "user", "content": "Hi"}],
                'max_tokens': 1
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return {"valid": True, "error": None}
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get("error", f"API request failed with status {response.status_code}")
            except:
                error_msg = f"API request failed with status {response.status_code}"
            return {"valid": False, "error": error_msg}
            
    except requests.exceptions.Timeout:
        return {"valid": False, "error": "Request timed out"}
    except requests.exceptions.RequestException as e:
        return {"valid": False, "error": f"Network error: {str(e)}"}
    except Exception as e:
        return {"valid": False, "error": f"Unexpected error: {str(e)}"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint with streaming support"""
    
    def generate_response():
        try:
            messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
            
            if request.mode == "streaming":
                tools = get_tools() if request.tools_enabled and request.tavily_api_key else None
                
                if tools and request.tavily_api_key:
                    accumulated_content = ""
                    tool_calls_found = False
                    
                    for chunk in stream_inception_response(messages, request.inception_api_key, False, tools):
                        if chunk.startswith("data: "):
                            data_str = chunk[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                if 'content' in data:
                                    accumulated_content = data['content']
                                    yield chunk
                                    if "🔍 **Searching...**" in accumulated_content:
                                        tool_calls_found = True
                                        break
                            except:
                                continue
                    
                    if tool_calls_found:
                        assistant_response, tool_calls = get_tool_calls_without_diffusing(messages, request.inception_api_key)
                        
                        if tool_calls:
                            for tool_call in tool_calls:
                                if tool_call["function"]["name"] == "web_search":
                                    try:
                                        args = json.loads(tool_call["function"]["arguments"])
                                        query = args.get('query', '')
                                        search_result = search_web(query, request.tavily_api_key)
                                        
                                        if 'error' not in search_result:
                                            result_text = f"**Search Results for: {query}**\n\n"
                                            if search_result.get('answer'):
                                                result_text += f"**Quick Answer:** {search_result['answer']}\n\n"
                                            if search_result.get('results'):
                                                result_text += "**Sources:**\n"
                                                for i, item in enumerate(search_result['results'][:3], 1):
                                                    title = item.get('title', 'No title')
                                                    content = item.get('content', '')[:150] + "..." if len(item.get('content', '')) > 150 else item.get('content', '')
                                                    url = item.get('url', '')
                                                    result_text += f"{i}. **{title}**\n   {content}\n   🔗 {url}\n\n"
                                            
                                            final_content = accumulated_content.replace("🔍 **Searching...**", result_text)
                                            yield f"data: {json.dumps({'content': final_content, 'mode': 'streaming'})}\n\n"
                                        else:
                                            error_content = accumulated_content.replace("🔍 **Searching...**", f"❌ {search_result['error']}")
                                            yield f"data: {json.dumps({'content': error_content, 'mode': 'streaming'})}\n\n"
                                    except:
                                        error_content = accumulated_content.replace("🔍 **Searching...**", "❌ **Search failed**")
                                        yield f"data: {json.dumps({'content': error_content, 'mode': 'streaming'})}\n\n"
                else:
                    # Regular streaming without tools
                    for chunk in stream_inception_response(messages, request.inception_api_key, False, None):
                        yield chunk
                        
            else:
                # Diffusing mode with two-step approach
                if request.tools_enabled and request.tavily_api_key:
                    step1_text = '🔧 **Step 1: Checking if tools are needed...**\n\n'
                    yield f"data: {json.dumps({'content': step1_text, 'mode': 'diffusing'})}\n\n"
                    
                    # Step 1: Get tool calls without diffusing
                    assistant_response, tool_calls = get_tool_calls_without_diffusing(messages, request.inception_api_key)
                    
                    if tool_calls:
                        found_text = f'🔍 **Found {len(tool_calls)} tool call(s). Executing...**\n\n'
                        yield f"data: {json.dumps({'content': found_text, 'mode': 'diffusing'})}\n\n"
                        
                        # Execute tool calls
                        final_messages = messages.copy()
                        final_messages.append({
                            "role": "assistant", 
                            "content": assistant_response, 
                            "tool_calls": tool_calls
                        })
                        
                        search_results_text = ""
                        
                        for tool_call in tool_calls:
                            function_name = tool_call["function"]["name"]
                            arguments = tool_call["function"]["arguments"]
                            
                            if function_name == "web_search":
                                try:
                                    function_args = json.loads(arguments)
                                    query = function_args.get('query', '')
                                    
                                    searching_text = f'🔍 **Searching for: {query}**\n\n'
                                    yield f"data: {json.dumps({'content': searching_text, 'mode': 'diffusing'})}\n\n"
                                    
                                    search_result = search_web(query, request.tavily_api_key)
                                    
                                    final_messages.append({
                                        "role": "tool",
                                        "tool_call_id": tool_call["id"],
                                        "name": function_name,
                                        "content": json.dumps(search_result)
                                    })
                                    
                                    if 'error' not in search_result:
                                        search_results_text = "🔍 **Search completed!**\n\n"
                                        for i, result in enumerate(search_result.get('results', [])[:3], 1):
                                            title = result.get('title', 'No title')
                                            content = result.get('content', '')[:150] + "..." if len(result.get('content', '')) > 150 else result.get('content', '')
                                            url = result.get('url', '')
                                            search_results_text += f"{i}. **{title}**\n   {content}\n   🔗 {url}\n\n"
                                        search_results_text += "**AI Response:**\n\n"
                                        
                                        completed_text = '✅ **Search completed! Getting final response with diffusing...**\n\n'
                                        yield f"data: {json.dumps({'content': completed_text, 'mode': 'diffusing'})}\n\n"
                                    else:
                                        error_text = f'❌ **Search failed: {search_result["error"]}**\n\n'
                                        yield f"data: {json.dumps({'content': error_text, 'mode': 'diffusing'})}\n\n"
                                        return
                                        
                                except Exception as e:
                                    error_text = f'❌ **Error: {str(e)}**\n\n'
                                    yield f"data: {json.dumps({'content': error_text, 'mode': 'diffusing'})}\n\n"
                                    return
                        
                        # Step 2: Get final response with diffusing
                        step2_text = '✨ **Step 2: Generating diffused response...**\n\n'
                        yield f"data: {json.dumps({'content': step2_text, 'mode': 'diffusing'})}\n\n"
                        
                        for chunk in stream_inception_response(final_messages, request.inception_api_key, True, None):
                            if chunk.startswith("data: "):
                                data_str = chunk[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data = json.loads(data_str)
                                    if 'content' in data:
                                        complete_response = search_results_text + data['content']
                                        yield f"data: {json.dumps({'content': complete_response, 'mode': 'diffusing'})}\n\n"
                                except:
                                    continue
                    else:
                        no_tools_text = 'ℹ️ **No tools needed. Getting direct response with diffusing...**\n\n'
                        yield f"data: {json.dumps({'content': no_tools_text, 'mode': 'diffusing'})}\n\n"
                        for chunk in stream_inception_response(messages, request.inception_api_key, True, None):
                            yield chunk
                else:
                    # No tools enabled, direct diffusing
                    for chunk in stream_inception_response(messages, request.inception_api_key, True, None):
                        yield chunk
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)