import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { initRuntimeSecurityGuard } from './utils/security';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize defense guard
initRuntimeSecurityGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

