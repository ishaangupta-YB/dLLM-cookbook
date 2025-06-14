import streamlit as st
import requests
import json
import time
from typing import Generator

st.set_page_config(
    page_title="Inception Lab Demo",
    page_icon="🤖",
    layout="wide"
)

if "messages" not in st.session_state:
    st.session_state.messages = []
if "api_key" not in st.session_state:
    st.session_state.api_key = ""
if "chat_mode" not in st.session_state:
    st.session_state.chat_mode = "streaming"

def validate_api_key(api_key: str) -> bool:
    """Validate the API key by making a simple request"""
    if not api_key or len(api_key.strip()) < 10:
        return False
    return True

def stream_response(messages: list, api_key: str) -> Generator[str, None, None]:
    """Stream response"""
    try:
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json={
                'model': 'mercury-coder',
                'messages': messages,
                'max_tokens': 500,
                'stream': True
            },
            stream=True
        )
        
        if response.status_code != 200:
            yield f"Error: API request failed with status {response.status_code}"
            return

        accumulated_content = ""
        
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
                                delta = data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    accumulated_content += content
                                    yield accumulated_content
                        except json.JSONDecodeError:
                            continue
                            
    except Exception as e:
        yield f"Error: {str(e)}"

def diffuse_response(messages: list, api_key: str) -> Generator[str, None, None]:
    """Get diffusing response"""
    try:
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json={
                'model': 'mercury-coder',
                'messages': messages,
                'max_tokens': 500,
                'stream': True,
                'diffusing': True  
            },
            stream=True
        )
        
        if response.status_code != 200:
            yield f"Error: API request failed with status {response.status_code}"
            return
        
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
                                delta = data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content is not None:
                                    yield content
                        except json.JSONDecodeError:
                            continue
                            
    except Exception as e:
        yield f"Error: {str(e)}"

def get_non_streaming_response(messages: list, api_key: str) -> str:
    """Get non-streaming response for fallback"""
    try:
        response = requests.post(
            'https://api.inceptionlabs.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json={
                'model': 'mercury-coder',
                'messages': messages,
                'max_tokens': 500
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            return f"Error: API request failed with status {response.status_code}"
            
    except Exception as e:
        return f"Error: {str(e)}"

st.title("🤖 AI Chat Assistant")
st.markdown("*Experience AI chat with both streaming and diffusing modes*")
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
    
    if api_key:
        if validate_api_key(api_key):
            st.success("✅ API key format valid")
        else:
            st.error("❌ Invalid API key format")
    
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

col1, col2 = st.columns([3, 1])

with col1:
    st.subheader(f"💬 Chat ({st.session_state.chat_mode.title()} Mode)")
 

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Type your message here...", disabled=not validate_api_key(st.session_state.api_key)):
    if not validate_api_key(st.session_state.api_key):
        st.error("❌ Please enter a valid API key in the sidebar first.")
        st.stop()
    
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # Generate assistant response
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        
        # Prepare messages for API
        api_messages = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
        
        try:
            if st.session_state.chat_mode == "streaming":
                # Streaming mode - progressive building
                full_response = ""
                for chunk in stream_response(api_messages, st.session_state.api_key):
                    full_response = chunk
                    message_placeholder.markdown(full_response + "▌")
                message_placeholder.markdown(full_response)
                
            else:
                # Diffusing mode - dynamic rewriting
                with st.spinner("🔄 Diffusing response..."):
                    current_response = ""
                    for chunk in diffuse_response(api_messages, st.session_state.api_key):
                        current_response = chunk
                        message_placeholder.markdown(current_response + " ✨")
                        time.sleep(0.1)  # Small delay to show the diffusing effect
                    message_placeholder.markdown(current_response)
                    full_response = current_response
            
            # Add assistant response to chat history
            st.session_state.messages.append({"role": "assistant", "content": full_response})
            
        except Exception as e:
            error_msg = f"❌ Error: {str(e)}"
            message_placeholder.markdown(error_msg)
            st.session_state.messages.append({"role": "assistant", "content": error_msg})
 
 