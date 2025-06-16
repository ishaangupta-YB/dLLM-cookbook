import ChatInterface from './components/ChatInterface';
import './index.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="App">
        <ChatInterface />
      </div>
      <Toaster /> 
    </ThemeProvider>
  );
}

export default App;