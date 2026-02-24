import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--error-color)'
        }}>
          <h1>Something went wrong</h1>
          <pre style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: 16,
            borderRadius: 4,
            overflow: 'auto',
            maxWidth: 600,
            margin: '16px auto',
            textAlign: 'left',
            fontSize: 12,
            border: '1px solid var(--border-color)'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              background: 'var(--primary-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 4
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
