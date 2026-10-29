import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/notificationService.ts';

// Register service worker for PWA & Push Notifications
registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
