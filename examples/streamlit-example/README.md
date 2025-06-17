# Streamlit Examples for dLLM

This directory contains two Streamlit applications that demonstrate how to build interactive chat interfaces with dLLM models from Inception Labs.

## Applications

### 1. `app.py` - AI Chat Assistant

## Demo Video
https://github.com/user-attachments/assets/89611c5c-ae79-457c-bf7f-e44c80b260a2

This is a versatile chat application that allows you to interact with the `mercury-coder` model. It showcases two different response generation modes:

-   **Streaming Mode:** Tokens are appended to the response as they are generated, providing a classic chatbot experience.
-   **Diffusing Mode:** The entire response is rewritten and refined with each update from the model, offering a unique look into the AI's "thought process".

**Features:**

-   Switch between Streaming and Diffusing modes.
-   Set the maximum number of tokens for the response.
-   Clear chat history.
-   Requires an Inception Labs API key.

### 2. `tool_use.py` - AI Chat with Tools

## Demo Video
https://github.com/user-attachments/assets/924422a9-847a-47b3-8535-a75b42d6351b

This more advanced application demonstrates how to use "tools" with the `mercury-coder` model. It integrates a web search tool using the Tavily API, allowing the model to access real-time information from the internet to answer questions.

**Features:**

-   Tool integration (web search).
-   A two-step process for tool use (non-diffusing for tool calls, diffusing for the final response).
-   Requires both an Inception Labs API key and a Tavily API key.

## Setup and How to Run

1.  **Install Dependencies:**
    Navigate to this directory in your terminal and install the required Python packages.

    ```bash
    cd examples/streamlit-example
    pip install -r requirements.txt
    ```

2.  **Run an Application:**
    You can run either of the applications using the `streamlit run` command:

    To run the AI Chat Assistant:
    ```bash
    streamlit run app.py
    ```

    To run the AI Chat with Tools:
    ```bash
    streamlit run tool_use.py
    ```

3.  **Configure in Browser:**
    -   Once the app is running, open the provided URL in your web browser.
    -   Use the sidebar to enter and validate your API key(s).
    -   For `tool_use.py`, make sure to enable the tools with the checkbox.
    -   Start chatting with the AI! 
