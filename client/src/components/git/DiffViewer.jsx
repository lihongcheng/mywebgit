import React, { useEffect, useState } from 'react';
import { Spin, Empty, Select, Switch, Space, Typography, theme } from 'antd';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useAppStore } from '../../store';
import { useGitDiff } from '../../hooks';

const { Title } = Typography;

function DiffViewer({ file, cached = false }) {
  const { token } = theme.useToken();
  const { darkMode } = useAppStore();
  const { getDiff } = useGitDiff();
  const [diff, setDiff] = useState('');
  const [loading, setLoading] = useState(false);
  const [splitView, setSplitView] = useState(true);

  useEffect(() => {
    const loadDiff = async () => {
      if (!file) return;

      setLoading(true);
      try {
        const result = await getDiff({ file, cached });
        if (result) {
          setDiff(result);
        }
      } catch (error) {
        console.error('Failed to load diff:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiff();
  }, [file, cached, getDiff]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (!diff) {
    return <Empty description="No diff available" />;
  }

  // Parse git diff to extract old and new content
  const parseDiff = (diffText) => {
    const lines = diffText.split('\n');
    let oldContent = [];
    let newContent = [];
    let inOld = false;
    let inNew = false;

    lines.forEach(line => {
      if (line.startsWith('---')) {
        inOld = true;
        inNew = false;
        return;
      }
      if (line.startsWith('+++')) {
        inOld = false;
        inNew = true;
        return;
      }
      if (line.startsWith('@@')) {
        inOld = false;
        inNew = false;
        return;
      }

      if (line.startsWith('-') && !line.startsWith('---')) {
        oldContent.push(line.substring(1));
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        newContent.push(line.substring(1));
      } else if (line.startsWith(' ')) {
        oldContent.push(line.substring(1));
        newContent.push(line.substring(1));
      }
    });

    return {
      oldText: oldContent.join('\n'),
      newText: newContent.join('\n')
    };
  };

  const { oldText, newText } = parseDiff(diff);

  const lightStyles = {
    diffViewerBackground: '#ffffff',
    diffViewerColor: '#1f1f1f',
    addedBackground: '#e6ffed',
    addedColor: '#24292e',
    removedBackground: '#ffebe9',
    removedColor: '#24292e',
    wordAddedBackground: '#acf2bd',
    wordRemovedBackground: '#fdb8c0',
    addedGutterBackground: '#cdffd8',
    removedGutterBackground: '#ffdce0',
    gutterBackground: '#f7f7f7',
    gutterBackgroundDark: '#f0f0f0',
    highlightBackground: '#fffbdd',
    highlightGutterBackground: '#fff5b1',
    codeFoldGutterBackground: '#dbedff',
    codeFoldBackground: '#f1f8ff',
    emptyLineBackground: '#f7f7f7',
    gutterColor: '#212529',
    addedGutterColor: '#212529',
    removedGutterColor: '#212529',
    codeFoldContentColor: '#212529',
    diffViewerTitleBackground: '#fafbfc',
    diffViewerTitleColor: '#212529',
    diffViewerTitleBorderColor: '#e1e4e8'
  };

  const darkStyles = {
    diffViewerBackground: token.colorBgContainer,
    diffViewerColor: token.colorText,
    addedBackground: 'rgba(82, 196, 26, 0.15)',
    addedColor: token.colorText,
    removedBackground: 'rgba(255, 77, 79, 0.15)',
    removedColor: token.colorText,
    wordAddedBackground: 'rgba(82, 196, 26, 0.3)',
    wordRemovedBackground: 'rgba(255, 77, 79, 0.3)',
    addedGutterBackground: 'rgba(82, 196, 26, 0.2)',
    removedGutterBackground: 'rgba(255, 77, 79, 0.2)',
    gutterBackground: token.colorBgElevated,
    gutterBackgroundDark: token.colorBgElevated,
    highlightBackground: 'rgba(250, 173, 20, 0.15)',
    highlightGutterBackground: 'rgba(250, 173, 20, 0.2)',
    codeFoldGutterBackground: 'rgba(24, 144, 255, 0.15)',
    codeFoldBackground: 'rgba(24, 144, 255, 0.1)',
    emptyLineBackground: token.colorBgElevated,
    gutterColor: token.colorTextSecondary,
    addedGutterColor: token.colorTextSecondary,
    removedGutterColor: token.colorTextSecondary,
    codeFoldContentColor: token.colorTextSecondary,
    diffViewerTitleBackground: token.colorBgElevated,
    diffViewerTitleColor: token.colorText,
    diffViewerTitleBorderColor: token.colorBorderSecondary
  };

  const customStyles = {
    variables: {
      light: lightStyles,
      dark: darkStyles
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={5} style={{ margin: 0, color: token.colorText }}>{file}</Title>
        <Space>
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>Split View</span>
          <Switch
            checked={splitView}
            onChange={setSplitView}
            size="small"
          />
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: token.colorBgContainer }}>
        <ReactDiffViewer
          oldValue={oldText}
          newValue={newText}
          splitView={splitView}
          styles={customStyles}
          leftTitle="Original"
          rightTitle="Modified"
          useDarkTheme={darkMode}
          hideLineNumbers={false}
          showDiffOnly={false}
        />
      </div>
    </div>
  );
}

export default DiffViewer;
