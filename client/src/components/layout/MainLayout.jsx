import React, { useEffect, useCallback, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Space, theme, Tooltip } from 'antd';
import {
  GithubOutlined,
  PlusOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SyncOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons';
import RepoList from '../repo/RepoList';
import AddRepoModal from '../repo/AddRepoModal';
import CommitGraph from '../git/CommitGraph';
import FileStatus from '../git/FileStatus';
import Toolbar from './Toolbar';
import { useAppStore } from '../../store';
import { useRepo, useGitStatus, useGitBranch, useGitLog, useGitRemote } from '../../hooks';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const { token } = theme.useToken();
  const { darkMode, toggleDarkMode, currentRepo, branches, setRefreshCallback } = useAppStore();
  const { repos, loadRepos, addRepo, removeRepo, selectRepo } = useRepo();
  const { loadStatus } = useGitStatus();
  const { loadBranches } = useGitBranch();
  const { loadLog } = useGitLog();
  const { push, pull, fetch } = useGitRemote();
  const [addRepoModalVisible, setAddRepoModalVisible] = useState(false);

  // Load initial data
  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  // Load data when repo changes
  useEffect(() => {
    if (currentRepo?.id) {
      loadStatus();
      loadBranches();
      loadLog();
    }
  }, [currentRepo?.id, loadStatus, loadBranches, loadLog]);

  // Set up refresh callback - use a stable reference
  useEffect(() => {
    setRefreshCallback(async () => {
      if (currentRepo?.id) {
        await Promise.all([
          loadStatus(),
          loadBranches(),
          loadLog()
        ]);
      }
    });
  }, [currentRepo?.id, loadStatus, loadBranches, loadLog, setRefreshCallback]);

  const handleRepoMenuClick = ({ key }) => {
    const repo = repos.find(r => r.id === key);
    if (repo) {
      selectRepo(repo);
    }
  };

  const repoMenuItems = repos.filter(r => r.valid).map(repo => ({
    key: repo.id,
    label: repo.name
  }));

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Header */}
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        height: 48
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <GithubOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>MyGit</span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {currentRepo && (
            <Dropdown
              menu={{ items: repoMenuItems, onClick: handleRepoMenuClick }}
              trigger={['click']}
            >
              <Button>
                {currentRepo.name} (branch: {branches?.current || 'unknown'})
              </Button>
            </Dropdown>
          )}
        </div>

        <Space>
          <Tooltip title="Fetch">
            <Button
              icon={<SyncOutlined />}
              onClick={() => fetch()}
              disabled={!currentRepo}
            />
          </Tooltip>
          <Tooltip title="Pull">
            <Button
              icon={<CloudDownloadOutlined />}
              onClick={() => pull()}
              disabled={!currentRepo}
            />
          </Tooltip>
          <Tooltip title="Push">
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => push()}
              disabled={!currentRepo}
            />
          </Tooltip>
          <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
            <Button
              icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleDarkMode}
            />
          </Tooltip>
          <Tooltip title="Settings">
            <Button icon={<SettingOutlined />} />
          </Tooltip>
        </Space>
      </Header>

      <Layout>
        {/* Sidebar - Repo List */}
        <Sider
          width={240}
          theme={darkMode ? 'dark' : 'light'}
          style={{
            borderRight: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <div style={{ padding: '8px' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAddRepoModalVisible(true)}
              block
            >
              Add Repository
            </Button>
          </div>
          <RepoList
            repos={repos}
            currentRepo={currentRepo}
            onSelect={selectRepo}
            onRemove={removeRepo}
          />
        </Sider>

        {/* Main Content */}
        <Layout>
          {/* Toolbar */}
          {currentRepo && <Toolbar />}

          {/* Commit Graph */}
          <Content style={{
            padding: '16px',
            background: token.colorBgLayout,
            overflow: 'auto'
          }}>
            {currentRepo ? (
              <CommitGraph />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: token.colorTextSecondary
              }}>
                <div style={{ textAlign: 'center' }}>
                  <GithubOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>Select or add a repository to get started</p>
                </div>
              </div>
            )}
          </Content>

          {/* Bottom Panel - File Status */}
          {currentRepo && (
            <div style={{
              height: 300,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgContainer
            }}>
              <FileStatus />
            </div>
          )}
        </Layout>
      </Layout>

      {/* Add Repository Modal */}
      <AddRepoModal
        visible={addRepoModalVisible}
        onClose={() => setAddRepoModalVisible(false)}
        onAdd={addRepo}
      />
    </Layout>
  );
}

export default MainLayout;
