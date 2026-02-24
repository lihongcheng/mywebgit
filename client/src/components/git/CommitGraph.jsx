import React, { useRef, useState, useMemo } from 'react';
import { List, Card, Tag, Empty, Spin, Typography, Tooltip, theme } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  BranchesOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../store';

const { Text } = Typography;

// Generate branch colors
const BRANCH_COLORS = [
  '#1890ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16',
  '#eb2f96', '#faad14', '#2f54eb', '#a0d911', '#f5222d'
];

// Parse refs string into array
function parseRefs(refs) {
  if (!refs) return [];
  if (Array.isArray(refs)) return refs;
  if (typeof refs === 'string') {
    return refs.split(',').map(r => r.trim()).filter(Boolean);
  }
  return [];
}

function CommitGraph() {
  const { token } = theme.useToken();
  const { commits, loading } = useAppStore();
  const containerRef = useRef(null);
  const [selectedCommit, setSelectedCommit] = useState(null);

  // Calculate branch positions and colors
  const branchInfo = useMemo(() => {
    if (!commits || commits.length === 0) return { branches: {}, positions: {} };

    const branchMap = {};
    const positions = {};
    let colorIndex = 0;

    // Simple branch detection based on commit patterns
    commits.forEach((commit, index) => {
      const refs = parseRefs(commit.refs);
      // Extract branch info from refs if available
      const branchName = refs.find(r => r.startsWith('HEAD') || !r.includes('/')) || 'main';

      if (!branchMap[branchName]) {
        branchMap[branchName] = {
          name: branchName,
          color: BRANCH_COLORS[colorIndex % BRANCH_COLORS.length],
          commits: []
        };
        colorIndex++;
      }

      branchMap[branchName].commits.push(index);
      positions[commit.hash] = Object.keys(branchMap).indexOf(branchName);
    });

    return { branches: branchMap, positions };
  }, [commits]);

  if (loading?.commits) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <Empty
        description="No commits found"
        style={{ marginTop: 48 }}
      />
    );
  }

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={containerRef} style={{ height: '100%', overflow: 'auto' }}>
      <List
        dataSource={commits}
        renderItem={(commit, index) => {
          const branchPosition = branchInfo.positions[commit.hash] || 0;
          const branchColor = BRANCH_COLORS[branchPosition % BRANCH_COLORS.length];
          const refs = parseRefs(commit.refs);

          return (
            <List.Item
              key={commit.hash}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                background: selectedCommit?.hash === commit.hash ? token.colorPrimaryBg : 'transparent',
                borderRadius: 4
              }}
              onClick={() => setSelectedCommit(commit)}
            >
              <Card
                size="small"
                style={{ width: '100%', border: 'none', boxShadow: 'none' }}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Branch line indicator */}
                  <div style={{
                    width: 4,
                    height: '100%',
                    minHeight: 40,
                    background: branchColor,
                    borderRadius: 2
                  }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Tooltip title={commit.hash}>
                        <Tag color="blue" style={{ fontFamily: 'monospace', margin: 0 }}>
                          {commit.shortHash || (commit.hash && commit.hash.substring(0, 7))}
                        </Tag>
                      </Tooltip>

                      {refs.length > 0 && refs.map((ref, i) => (
                        <Tag
                          key={i}
                          color={ref.includes('HEAD') ? 'green' : 'blue'}
                          icon={ref.includes('tag') ? <TagOutlined /> : <BranchesOutlined />}
                          style={{ margin: 0 }}
                        >
                          {ref.replace('tag: ', '').replace('HEAD -> ', '')}
                        </Tag>
                      ))}
                    </div>

                    <Text strong style={{ display: 'block', marginBottom: 4 }}>
                      {commit.message}
                    </Text>

                    <div style={{ display: 'flex', gap: 16, color: token.colorTextTertiary, fontSize: 12 }}>
                      <span>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {commit.author}
                      </span>
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatDate(commit.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />
    </div>
  );
}

export default CommitGraph;
