import React, { useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './store';

function App() {
  const { darkMode } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <MainLayout />
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
