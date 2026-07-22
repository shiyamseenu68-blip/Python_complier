import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

// Error boundary component to catch initialization errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App initialization error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          background: '#1a1b26',
          color: '#c0caf5'
        }}>
          <h1 style={{ color: '#f7768e' }}>Something went wrong</h1>
          <p style={{ marginTop: '16px', maxWidth: '500px', textAlign: 'center' }}>
            The application failed to load. This might be due to browser storage issues.
          </p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#7aa2f7',
              color: '#1a1b26',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Storage & Reload
          </button>
          {this.state.error && (
            <details style={{ marginTop: '20px', maxWidth: '600px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#7aa2f7' }}>Error details</summary>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                background: '#16161e', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#565f89'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
