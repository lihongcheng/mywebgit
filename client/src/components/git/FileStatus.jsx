import React, { useState } from 'react';
import { List, Button, Input, Checkbox, Tag, Empty, Spin, Space, Modal } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  FileOutlined,
  DiffOutlined
} from '@ant-design/icons';
import { useGitStatus, useGitCommit } from '../../hooks';

const { TextArea } = Input;

// Get status icon/color based on file status
function getStatusInfo(file) {
  const { index, working_dir } = file;

  // Staged files (index status)
  if (index && index !== ' ') {
    switch (index) {
      case 'M': return { color: 'orange', label: 'Modified', staged: true };
      case 'A': return { color: 'green', label: 'Added', staged: true };
      case 'D': return { color: 'red', label: 'Deleted', staged: true };
      case 'R': return { color: 'blue', label: 'Renamed', staged: true };
      case 'C': return { color: 'cyan', label: 'Copied', staged: true };
      default: return { color: 'default', label: index, staged: true };
    }
  }

  // Unstaged files (working_dir status)
  if (working_dir && working_dir !== ' ') {
    switch (working_dir) {
      case 'M': return { color: 'orange', label: 'Modified', staged: false };
      case 'A': return { color: 'green', label: 'Added', staged: false };
      case 'D': return { color: 'red', label: 'Deleted', staged: false };
      case '?': return { color: 'default', label: 'Untracked', staged: false };
      case '!': return { color: 'default', label: 'Ignored', staged: false };
      case 'U': return { color: 'red', label: 'Conflict', staged: false };
      default: return { color: 'default', label: working_dir, staged: false };
    }
  }

  return { color: 'default', label: 'Unknown', staged: false };
}

function FileStatus() {
  const { status, loading, stageFiles, unstageFiles, stageAll, unstageAll } = useGitStatus();
  const { commit } = useGitCommit();

  const [commitMessage, setCommitMessage] = useState('');
  const [selectedUnstaged, setSelectedUnstaged] = useState([]);
  const [selectedStaged, setSelectedStaged] = useState([]);
  const [diffModalVisible, setDiffModalVisible] = useState(false);
  const [diffContent, setDiffContent] = useState('');
  const [diffFile, setDiffFile] = useState('');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin />
      </div>
    );
  }

  if (!status) {
    return (
      <Empty description="No repository selected" style={{ marginTop: 48 }} />
    );
  }

  // Separate staged and unstaged files
  const stagedFiles = status.files.filter(f => f.index && f.index !== ' ' && f.index !== '?');
  const unstagedFiles = status.files.filter(f =>
    (f.working_dir && f.working_dir !== ' ') ||
    (f.index === '?' || f.working_dir === '?')
  );

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      Modal.error({ title: 'Error', content: 'Please enter a commit message' });
      return;
    }
    if (stagedFiles.length === 0) {
      Modal.error({ title: 'Error', content: 'No files staged for commit' });
      return;
    }
    await commit(commitMessage);
    setCommitMessage('');
  };

  const handleStageSelected = async () => {
    await stageFiles(selectedUnstaged);
    setSelectedUnstaged([]);
  };

  const handleUnstageSelected = async () => {
    await unstageFiles(selectedStaged);
    setSelectedStaged([]);
  };

  const viewDiff = async (file) => {
    // In a real app, this would fetch the diff from the API
    setDiffFile(file.path);
    setDiffContent(`Diff for ${file.path}\n\n(This is a placeholder - actual diff would be shown here)`);
    setDiffModalVisible(true);
  };

  const renderFileList = (files, isStaged, selected, setSelected) => (
    <List
      dataSource={files}
      style={{ maxHeight: 180, overflow: 'auto' }}
      renderItem={file => {
        const statusInfo = getStatusInfo(file);
        return (
          <List.Item
            style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
              <Checkbox
                checked={selected.includes(file.path)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected([...selected, file.path]);
                  } else {
                    setSelected(selected.filter(p => p !== file.path));
                  }
                }}
              />
              <FileOutlined />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.path}
              </span>
              <Tag color={statusInfo.color} style={{ margin: 0, fontSize: 11 }}>
                {statusInfo.label}
              </Tag>
              <Button
                type="text"
                size="small"
                icon={<DiffOutlined />}
                onClick={() => viewDiff(file)}
                title="View diff"
              />
              <Button
                type="text"
                size="small"
                icon={isStaged ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => isStaged ? unstageFiles([file.path]) : stageFiles([file.path])}
                title={isStaged ? 'Unstage' : 'Stage'}
              />
            </div>
          </List.Item>
        );
      }}
    />
  );

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Unstaged Files */}
      <div style={{ flex: 1, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '8px 12px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 500 }}>
            Unstaged Files ({unstagedFiles.length})
          </span>
          <Space>
            <Button
              size="small"
              onClick={handleStageSelected}
              disabled={selectedUnstaged.length === 0}
            >
              Stage Selected
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={stageAll}
              disabled={unstagedFiles.length === 0}
            >
              Stage All
            </Button>
          </Space>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderFileList(unstagedFiles, false, selectedUnstaged, setSelectedUnstaged)}
        </div>
      </div>

      {/* Staged Files */}
      <div style={{ flex: 1, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '8px 12px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 500 }}>
            Staged Files ({stagedFiles.length})
          </span>
          <Space>
            <Button
              size="small"
              onClick={handleUnstageSelected}
              disabled={selectedStaged.length === 0}
            >
              Unstage Selected
            </Button>
            <Button
              size="small"
              onClick={unstageAll}
              disabled={stagedFiles.length === 0}
            >
              Unstage All
            </Button>
          </Space>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderFileList(stagedFiles, true, selectedStaged, setSelectedStaged)}
        </div>
      </div>

      {/* Commit Panel */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '8px 12px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <span style={{ fontWeight: 500 }}>Commit</span>
        </div>
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column' }}>
          <TextArea
            placeholder="Commit message"
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            style={{ flex: 1, marginBottom: 12, minHeight: 80 }}
          />
          <Button
            type="primary"
            block
            icon={<CheckOutlined />}
            onClick={handleCommit}
            disabled={stagedFiles.length === 0}
          >
            Commit ({stagedFiles.length} file{stagedFiles.length !== 1 ? 's' : ''})
          </Button>

          {status.conflicted && status.conflicted.length > 0 && (
            <div style={{ marginTop: 12, padding: 8, background: '#fff2f0', borderRadius: 4 }}>
              <div style={{ color: '#ff4d4f', fontWeight: 500, marginBottom: 4 }}>
                Conflicts Detected!
              </div>
              <div style={{ fontSize: 12 }}>
                {status.conflicted.map(f => (
                  <Tag key={f} color="red">{f}</Tag>
                ))}
              </div>
            </div>
          )}

          {status.ahead > 0 && (
            <div style={{ marginTop: 12, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
              <div style={{ color: '#1890ff', fontSize: 12 }}>
                {status.ahead} commit{status.ahead > 1 ? 's' : ''} ahead of origin
              </div>
            </div>
          )}

          {status.behind > 0 && (
            <div style={{ marginTop: 12, padding: 8, background: '#fffbe6', borderRadius: 4 }}>
              <div style={{ color: '#faad14', fontSize: 12 }}>
                {status.behind} commit{status.behind > 1 ? 's' : ''} behind origin
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diff Modal */}
      <Modal
        title={`Diff: ${diffFile}`}
        open={diffModalVisible}
        onCancel={() => setDiffModalVisible(false)}
        footer={null}
        width={800}
      >
        <pre style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 4,
          maxHeight: 400,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 12
        }}>
          {diffContent}
        </pre>
      </Modal>
    </div>
  );
}

export default FileStatus;
