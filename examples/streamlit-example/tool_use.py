import streamlit as st
import requests
import json
import time
from typing import Generator, Dict, Any

st.set_page_config(
    page_title="AI Chat with Tools",
    page_icon="🔧",
    layout="wide"
)

if "messages" not in st.session_state:
    st.session_state.messages = []
if "api_key" not in st.session_state:
    st.session_state.api_key = ""
if "tavily_api_key" not in st.session_state:
    st.session_state.tavily_api_key = ""
if "chat_mode" not in st.session_state:
    st.session_state.chat_mode = "streaming"
if "api_key_valid" not in st.session_state:
    st.session_state.api_key_valid = None
if "validating" not in st.session_state:
    st.session_state.validating = False
if "tools_enabled" not in st.session_state:
    st.session_state.tools_enabled = False

def validate_api_key(api_key: str) -> dict:
    """Validate the API key by making an actual API request"""
    if not api_key or len(api_key.strip()) < 10:
        return {"valid": False, "error": "API key is too short"}
    
    try:
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
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

def search_web(query: str, api_key: str) -> str:
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
                'max_results': 3
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            
            result = f"**Search Results for: {query}**\n\n"
            
            if data.get('answer'):
                result += f"**Quick Answer:** {data['answer']}\n\n"
            
            if data.get('results'):
                result += "**Sources:**\n"
                for i, item in enumerate(data['results'][:3], 1):
                    title = item.get('title', 'No title')
                    content = item.get('content', '')[:150] + "..." if len(item.get('content', '')) > 150 else item.get('content', '')
                    url = item.get('url', '')
                    result += f"{i}. **{title}**\n   {content}\n   🔗 {url}\n\n"
            
            return result
        else:
            return f"Search failed with status: {response.status_code}"
            
    except Exception as e:
        return f"Search error: {str(e)}"

def get_tools():
    """Get tools definition"""
    return [
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "Search the web for current information, news, weather, or any topic",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query"
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    ]

def stream_response_with_tools(messages: list, api_key: str, tools_enabled: bool) -> Generator[str, None, None]:
    """Stream response with optional tools"""
    try:
        request_data = {
            'model': 'mercury-coder',
            'messages': messages,
            'max_tokens': 800,
            'stream': True
        }
        
        if tools_enabled and st.session_state.tavily_api_key:
            request_data['tools'] = get_tools()
        
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json=request_data,
            stream=True
        )
        
        if response.status_code != 200:
            yield f"Error: API request failed with status {response.status_code}"
            return

        accumulated_content = ""
        tool_calls_data = []
        
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
                            if 'choices' in data and len(data['choices']) > 0:
                                choice = data['choices'][0]
                                delta = choice.get('delta', {})
                                
                                content = delta.get('content', '')
                                if content:
                                    accumulated_content += content
                                    yield accumulated_content
                                
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
                                    for tool_call in tool_calls_data:
                                        if tool_call['function']['name'] == 'web_search':
                                            try:
                                                args = json.loads(tool_call['function']['arguments'])
                                                query = args.get('query', '')
                                                if query and st.session_state.tavily_api_key:
                                                    yield accumulated_content + "\n\n🔍 **Searching...**\n\n"
                                                    search_result = search_web(query, st.session_state.tavily_api_key)
                                                    yield accumulated_content + f"\n\n{search_result}"
                                            except:
                                                yield accumulated_content + "\n\n❌ **Search failed**\n\n"
                                    return
                                        
                        except json.JSONDecodeError:
                            continue
                            
    except Exception as e:
        yield f"Error: {str(e)}"

def diffuse_response_with_tools(messages: list, api_key: str, tools_enabled: bool) -> Generator[str, None, None]:
    """Diffuse response with optional tools"""
    try:
        request_data = {
            'model': 'mercury-coder',
            'messages': messages,
            'max_tokens': 800,
            'stream': True,
            'diffusing': True
        }
        
        if tools_enabled and st.session_state.tavily_api_key:
            request_data['tools'] = get_tools()
        
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json=request_data,
            stream=True
        )
        
        if response.status_code != 200:
            yield f"Error: API request failed with status {response.status_code}"
            return
        
        current_content = ""
        tool_calls_data = []
        
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
                            if 'choices' in data and len(data['choices']) > 0:
                                choice = data['choices'][0]
                                delta = choice.get('delta', {})
                                
                                content = delta.get('content', '')
                                if content is not None:
                                    current_content = content
                                    yield current_content
                                
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
                                    for tool_call in tool_calls_data:
                                        if tool_call['function']['name'] == 'web_search':
                                            try:
                                                args = json.loads(tool_call['function']['arguments'])
                                                query = args.get('query', '')
                                                if query and st.session_state.tavily_api_key:
                                                    yield current_content + "\n\n🔍 **Searching...**\n\n"
                                                    search_result = search_web(query, st.session_state.tavily_api_key)
                                                    yield current_content + f"\n\n{search_result}"
                                            except:
                                                yield current_content + "\n\n❌ **Search failed**\n\n"
                                    return
                                        
                        except json.JSONDecodeError:
                            continue
                            
    except Exception as e:
        yield f"Error: {str(e)}"
st.title("🔧 AI Chat Assistant with Tools")
st.markdown("*AI chat with web search capabilities*")

with st.sidebar:
    st.header("⚙️ Configuration")
    
    api_key = st.text_input(
        "Inception Labs API Key",
        type="password",
        value=st.session_state.api_key,
        help="Enter your Inception Labs API key"
    )
    
    if api_key != st.session_state.api_key:
        st.session_state.api_key = api_key
        st.session_state.api_key_valid = None
    
    tavily_api_key = st.text_input(
        "Tavily API Key (for web search)",
        type="password",
        value=st.session_state.tavily_api_key,
        help="Enter your Tavily API key to enable web search"
    )
    
    if tavily_api_key != st.session_state.tavily_api_key:
        st.session_state.tavily_api_key = tavily_api_key
    
    tools_enabled = st.checkbox(
        "🔍 Enable Web Search",
        value=st.session_state.tools_enabled,
        disabled=not tavily_api_key,
        help="Allow AI to search the web for current information"
    )
    st.session_state.tools_enabled = tools_enabled
    
    col1, col2 = st.columns([1, 1])
    with col1:
        validate_clicked = st.button("🔍 Validate", disabled=not api_key or st.session_state.validating)
    with col2:
        if st.session_state.validating:
            st.write("⏳ Validating...")
    
    if validate_clicked and api_key:
        st.session_state.validating = True
        st.rerun()
    
    if st.session_state.validating and api_key:
        with st.spinner("Validating API key..."):
            validation_result = validate_api_key(api_key)
            st.session_state.api_key_valid = validation_result["valid"]
            st.session_state.validation_error = validation_result["error"]
            st.session_state.validating = False
        st.rerun()
    
    if st.session_state.api_key_valid is True:
        st.success("✅ Inception Labs API valid")
    elif st.session_state.api_key_valid is False:
        st.error(f"❌ {st.session_state.get('validation_error', 'Invalid API key')}")
    elif api_key:
        st.info("ℹ️ Click 'Validate' to verify your API key")
    
    if tavily_api_key:
        if tools_enabled:
            st.success("🔍 Web search enabled")
        else:
            st.info("🔍 Web search available (enable with checkbox)")
    else:
        st.warning("🔍 No Tavily key - web search disabled")
    
    st.divider()
    
    st.subheader("🔄 Chat Mode")
    mode = st.radio(
        "Select mode:",
        ["streaming", "diffusing"],
        index=0 if st.session_state.chat_mode == "streaming" else 1,
        help="Streaming: Progressive building | Diffusing: Dynamic rewriting"
    )   
    
    if mode != st.session_state.chat_mode:
        st.session_state.chat_mode = mode
     
    st.divider()
    
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

tools_status = " + Web Search" if st.session_state.tools_enabled else ""
st.subheader(f"💬 Chat ({st.session_state.chat_mode.title()} Mode{tools_status})")

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Type your message here...", disabled=not (st.session_state.api_key_valid is True)):
    if not (st.session_state.api_key_valid is True):
        st.error("❌ Please enter and validate your API key in the sidebar first.")
        st.stop()
    
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
        
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        api_messages = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
        
        try:
            if st.session_state.chat_mode == "streaming":
                full_response = ""
                for chunk in stream_response_with_tools(api_messages, st.session_state.api_key, st.session_state.tools_enabled):
                    full_response = chunk
                    message_placeholder.markdown(full_response + "▌")
                message_placeholder.markdown(full_response)
            else:
                with st.spinner("🔄 Diffusing response..."):
                    current_response = ""
                    for chunk in diffuse_response_with_tools(api_messages, st.session_state.api_key, st.session_state.tools_enabled):
                        current_response = chunk
                        message_placeholder.markdown(current_response + " ✨")
                        time.sleep(0.05)
                    message_placeholder.markdown(current_response)
                    full_response = current_response
            
            st.session_state.messages.append({"role": "assistant", "content": full_response})
            
        except Exception as e:
            error_msg = f"❌ Error: {str(e)}"
            message_placeholder.markdown(error_msg)
            st.session_state.messages.append({"role": "assistant", "content": error_msg})