import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Simple Error Boundary to show runtime errors in the UI instead of a blank screen
class ErrorBoundary extends React.Component<any, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('Render error:', error, info);
  }
  render() {
    if ((this.state as any).hasError) {
      return <div style={{ padding: 24, color: '#fff', background: '#111' }}>
        <h2 style={{ marginTop: 0 }}>An unexpected error occurred</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String((this.state as any).error)}</pre>
      </div>;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error hooks for uncaught errors & promise rejections
window.addEventListener('error', (e) => console.error('Global error:', e.message || e));
window.addEventListener('unhandledrejection', (e) => console.error('Unhandled rejection:', e.reason || e));

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);