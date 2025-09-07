import { createRoot } from 'react-dom/client'
import MinimalApp from './MinimalApp'

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<MinimalApp />);
} else {
  console.error("Failed to find the root element");
}