import React from 'react';
import { List, Button, Tooltip, Tag, Empty } from 'antd';
import {
  DeleteOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

function RepoList({ repos, currentRepo, onSelect, onRemove }) {
  if (repos.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No repositories"
        />
      </div>
    );
  }

  return (
    <List
      dataSource={repos}
      renderItem={repo => (
        <List.Item
          key={repo.id}
          onClick={() => repo.valid && onSelect(repo)}
          style={{
            padding: '8px 12px',
            cursor: repo.valid ? 'pointer' : 'not-allowed',
            background: currentRepo?.id === repo.id ? '#e6f7ff' : 'transparent',
            borderLeft: currentRepo?.id === repo.id ? '3px solid #1890ff' : '3px solid transparent',
            opacity: repo.valid ? 1 : 0.6
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
            <FolderOutlined style={{ color: '#faad14' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontWeight: currentRepo?.id === repo.id ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {repo.name}
              </div>
              <div style={{
                fontSize: 12,
                color: '#999',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {repo.path}
              </div>
            </div>
            <Tooltip title={repo.valid ? 'Valid repo' : 'Invalid repo path'}>
              {repo.valid ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              )}
            </Tooltip>
            <Tooltip title="Remove from list">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(repo.id);
                }}
              />
            </Tooltip>
          </div>
        </List.Item>
      )}
    />
  );
}

export default RepoList;
