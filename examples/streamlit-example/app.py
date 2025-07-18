import streamlit as st
import requests
import json
import time
from typing import Generator

st.set_page_config(
    page_title="AI Chat Assistant",
    page_icon="🤖",
    layout="wide"
)

if "messages" not in st.session_state:
    st.session_state.messages = []
if "api_key" not in st.session_state:
    st.session_state.api_key = ""
if "chat_mode" not in st.session_state:
    st.session_state.chat_mode = "streaming"
if "api_key_valid" not in st.session_state:
    st.session_state.api_key_valid = None
if "validating" not in st.session_state:
    st.session_state.validating = False
if "max_tokens" not in st.session_state:
    st.session_state.max_tokens = 2000

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

def stream_response(messages: list, api_key: str, max_tokens: int) -> Generator[str, None, None]:
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
                'max_tokens': max_tokens,
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

def diffuse_response(messages: list, api_key: str, max_tokens: int) -> Generator[str, None, None]:
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
                'max_tokens': max_tokens,
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

st.title("🤖 AI Chat Assistant")
st.markdown("*Experience AI chat with both streaming and diffusing modes + token control*")

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
    
    # Validate button
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
        st.success("✅ API key is valid")
    elif st.session_state.api_key_valid is False:
        st.error(f"❌ {st.session_state.get('validation_error', 'Invalid API key')}")
    elif api_key:
        st.info("ℹ️ Click 'Validate' to verify your API key")
    
    
    st.subheader("🎛️ Token Settings")
    max_tokens = st.slider(
        "Max Tokens",
        min_value=50,
        max_value=32000,
        value=st.session_state.max_tokens,
        step=50,
        help="Maximum number of tokens in the response"
    )
    st.session_state.max_tokens = max_tokens
     
    
    
    st.subheader("🔄 Chat Mode")
    mode = st.radio(
        "Select mode:",
        ["streaming", "diffusing"],
        index=0 if st.session_state.chat_mode == "streaming" else 1,
        help="Streaming: Progressive building | Diffusing: Dynamic rewriting"
    )   
    
    if mode != st.session_state.chat_mode:
        st.session_state.chat_mode = mode
     
    
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

st.subheader(f"💬 Chat ({st.session_state.chat_mode.title()} Mode - {st.session_state.max_tokens} tokens)")

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
                # Streaming mode 
                full_response = ""
                for chunk in stream_response(api_messages, st.session_state.api_key, st.session_state.max_tokens):
                    full_response = chunk
                    message_placeholder.markdown(full_response + "▌")
                message_placeholder.markdown(full_response)
                
            else:
                # Diffusing mode 
                with st.spinner("🔄 Diffusing response..."):
                    current_response = ""
                    for chunk in diffuse_response(api_messages, st.session_state.api_key, st.session_state.max_tokens):
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

st.divider()
st.markdown(f"""
<div style='text-align: center; color: #666; font-size: 0.8em;'>
    <strong>Current Settings:</strong> {st.session_state.chat_mode.title()} Mode • {st.session_state.max_tokens} Max Tokens<br>
    <strong>Features:</strong> Real-time streaming • Dynamic diffusing • Adjustable response length
</div>
""", unsafe_allow_html=True)