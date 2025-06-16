# Next.js dLLM Chat Example

This directory contains a full-featured chat application built with Next.js, TypeScript, and Tailwind CSS. It demonstrates how to build a modern, streaming-first chat interface for Inception Labs's dLLM models.

## Features

-   **Modern Tech Stack:** Built with Next.js App Router, React, and TypeScript.
-   **Streaming & Diffusing Modes:** Switch between progressive streaming (like ChatGPT) and dynamic diffusing (where the AI refines its answer in real-time).
-   **API Key Management:** Securely stores your Inception Labs API key in the browser's local storage.
-   **Responsive UI:** A clean, responsive interface that works on all screen sizes, built with **Shadcn UI** and **Tailwind CSS**.
-   **Light/Dark Mode:** Toggle between light and dark themes.
-   **State Management:** Uses **Zustand** for simple and powerful global state management.
-   **Error Handling:** Gracefully handles API errors and displays user-friendly notifications using **Sonner**.
-   **Stop Generation:** Cancel the AI's response generation at any time.
-   **Clear Chat History:** Easily start a new conversation.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
-   **UI Components:**
    -   `ChatInterface.tsx`: The main chat component.
    -   `APIKeySetup.tsx`: For managing the API key.
    -   `Messages.tsx`, `Message.tsx`, `ChatInput.tsx`: For the chat view and input.
-   **Backend:** A Next.js API route (`app/api/chat/route.ts`) that streams the response from the Inception Labs API.

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   An Inception Labs API key.

### Installation

1.  **Clone the repository and navigate to this directory:**

    ```bash
    cd examples/nextjs-example
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser. You will be prompted to enter your Inception Labs API key. Once entered, you can start chatting!

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
