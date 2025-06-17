# HTML Examples for dLLM

This directory contains two simple HTML examples demonstrating how to interact with dLLM models. Both examples are self-contained in a single HTML file and use a "Bring Your Own Key" (BYOK) approach.

## Examples

### 1. `streaming_example.html`

This example shows how to get a streaming response from a dLLM model through the OpenRouter API. As the model generates tokens, they are appended to the response area, showing the progressive build-up of the answer.

## Demo Video:
https://github.com/user-attachments/assets/80e446f8-8f74-419a-9cbf-bbcd599cde97



-   **API:** OpenRouter API
-   **Model:** `inception/mercury-coder-small-beta`
-   **Authentication:** Requires an OpenRouter API key.

### 2. `diffusion_example.html`

This example demonstrates the "diffusing" feature, which is unique to Inception Labs' models. Instead of just appending tokens, the entire response is rewritten and refined with each update from the model. This provides a fascinating look into the model's "thought process".

## Demo Video:
https://github.com/user-attachments/assets/74141f64-1764-4655-b9ac-93199287ae72



-   **API:** Inception Labs API (Direct)
-   **Model:** `mercury-coder`
-   **Authentication:** Requires an Inception Labs API key.

## How to Run

1.  Open either `streaming_example.html` or `diffusion_example.html` in your web browser.
2.  Enter the required API key in the input field.
3.  Type your query in the text area and click the "Send" button.
4.  Observe the response from the dLLM. 
