import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {AuthProvider} from './contexts/AuthContext';
import {TranslationProvider} from './contexts/TranslationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TranslationProvider>
        <App />
      </TranslationProvider>
    </AuthProvider>
  </StrictMode>,
);
