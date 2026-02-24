import React, { useState, useCallback } from 'react';
import { Space, Button, Dropdown, Modal, Input, Select, Tooltip, Popconfirm, Checkbox, List, Spin, theme } from 'antd';
import {
  BranchesOutlined,
  TagOutlined,
  MergeCellsOutlined,
  SwapOutlined,
  InboxOutlined,
  UndoOutlined,
  PlusOutlined,
  ClearOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import { useGitBranch, useGitStatus } from '../../hooks';
import { gitApi } from '../../services/api';

// Simple notification helper
const notify = {
  success: (msg) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="position:fixed;top:16px;right:16px;padding:12px 24px;background:#52c41a;color:#fff;border-radius:4px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.15)">${msg}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
  error: (msg) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="position:fixed;top:16px;right:16px;padding:12px 24px;background:#ff4d4f;color:#fff;border-radius:4px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.15);max-width:400px">${msg}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
};

function Toolbar() {
  const { currentRepo, branches, setBranches } = useAppStore();
  const { createBranch, checkout, deleteBranch, loadBranches } = useGitBranch();
  const { loadStatus } = useGitStatus();

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergeBranch, setMergeBranch] = useState('');
  const [stashModalVisible, setStashModalVisible] = useState(false);
  const [stashMessage, setStashMessage] = useState('');
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagMessage, setTagMessage] = useState('');
  const [pruneModalVisible, setPruneModalVisible] = useState(false);
  const [staleBranches, setStaleBranches] = useState([]);
  const [selectedStaleBranches, setSelectedStaleBranches] = useState([]);
  const [loadingStale, setLoadingStale] = useState(false);
  const [deletingBranches, setDeletingBranches] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  if (!branches) return null;

  const currentBranch = branches.current;
  const localBranches = branches.local || [];
  const remoteBranches = branches.remote || [];

  // Branch menu
  const branchMenuItems = localBranches.map(b => ({
    key: b.name,
    label: b.name + (b.current ? ' (current)' : '')
  }));

  const handleBranchMenuClick = async ({ key }) => {
    if (key !== currentBranch) {
      await checkout(key);
    }
  };

  // Handle create branch
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      notify.error('Please enter a branch name');
      return;
    }
    await createBranch(newBranchName.trim());
    setBranchModalVisible(false);
    setNewBranchName('');
  };

  // Handle merge
  const handleMerge = async () => {
    if (!mergeBranch) {
      notify.error('Please select a branch to merge');
      return;
    }
    try {
      const result = await gitApi.merge(currentRepo.id, mergeBranch);
      if (result.success) {
        notify.success(`Merged ${mergeBranch} into ${currentBranch}`);
        loadStatus();
      } else if (result.conflict) {
        notify.error('Merge conflicts detected. Please resolve them.');
      }
    } catch (error) {
      notify.error(`Merge failed: ${error.message}`);
    }
    setMergeModalVisible(false);
    setMergeBranch('');
  };

  // Handle stash
  const handleStash = async () => {
    try {
      await gitApi.stash(currentRepo.id, { message: stashMessage });
      notify.success('Changes stashed');
      loadStatus();
    } catch (error) {
      notify.error(`Stash failed: ${error.message}`);
    }
    setStashModalVisible(false);
    setStashMessage('');
  };

  // Handle create tag
  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      notify.error('Please enter a tag name');
      return;
    }
    try {
      await gitApi.createTag(currentRepo.id, tagName.trim(), tagMessage.trim());
      notify.success(`Tag '${tagName}' created`);
    } catch (error) {
      notify.error(`Failed to create tag: ${error.message}`);
    }
    setTagModalVisible(false);
    setTagName('');
    setTagMessage('');
  };

  // Handle open prune modal
  const handleOpenPruneModal = async () => {
    setPruneModalVisible(true);
    setLoadingStale(true);
    setStaleBranches([]);
    setSelectedStaleBranches([]);

    try {
      const result = await gitApi.getStaleBranches(currentRepo.id, 'origin');
      setStaleBranches(result.staleBranches || []);
    } catch (error) {
      notify.error(`Failed to get stale branches: ${error.message}`);
    } finally {
      setLoadingStale(false);
    }
  };

  // Handle delete selected stale branches
  const handleDeleteStaleBranches = async () => {
    if (selectedStaleBranches.length === 0) {
      notify.error('Please select at least one branch to delete');
      return;
    }

    setDeletingBranches(true);
    try {
      const result = await gitApi.deleteBranches(currentRepo.id, selectedStaleBranches, forceDelete);
      const failed = result.results.filter(r => !r.success);

      if (failed.length > 0) {
        notify.error(`Failed to delete: ${failed.map(f => f.name).join(', ')}`);
      } else {
        notify.success(`Deleted ${selectedStaleBranches.length} branch(es)`);
      }

      // Directly fetch and update branches to ensure UI refresh
      try {
        const branchesResult = await gitApi.getBranches(currentRepo.id);
        setBranches(branchesResult.branches);
      } catch (e) {
        console.error('Failed to refresh branches:', e);
      }

      setPruneModalVisible(false);
      setSelectedStaleBranches([]);
      setForceDelete(false);
    } catch (error) {
      notify.error(`Failed to delete branches: ${error.message}`);
    } finally {
      setDeletingBranches(false);
    }
  };

  return (
    <>
      <div style={{
        padding: '8px 16px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {/* Branch selector */}
        <Dropdown
          menu={{ items: branchMenuItems, onClick: handleBranchMenuClick }}
          trigger={['click']}
        >
          <Button icon={<BranchesOutlined />}>
            {currentBranch || 'Select branch'}
          </Button>
        </Dropdown>

        <Button
          icon={<PlusOutlined />}
          onClick={() => setBranchModalVisible(true)}
          title="Create new branch"
        />

        <Tooltip title="Clear stale local branches (tracking deleted remote branches)">
          <Button
            icon={<ClearOutlined />}
            onClick={handleOpenPruneModal}
          />
        </Tooltip>

        <Space style={{ marginLeft: 16 }}>
          <Tooltip title="Merge branch">
            <Button
              icon={<MergeCellsOutlined />}
              onClick={() => setMergeModalVisible(true)}
            >
              Merge
            </Button>
          </Tooltip>

          <Tooltip title="Rebase">
            <Button icon={<SwapOutlined />}>
              Rebase
            </Button>
          </Tooltip>

          <Tooltip title="Stash changes">
            <Button
              icon={<InboxOutlined />}
              onClick={() => setStashModalVisible(true)}
            >
              Stash
            </Button>
          </Tooltip>

          <Tooltip title="Create tag">
            <Button
              icon={<TagOutlined />}
              onClick={() => setTagModalVisible(true)}
            >
              Tag
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Create Branch Modal */}
      <Modal
        title="Create New Branch"
        open={branchModalVisible}
        onOk={handleCreateBranch}
        onCancel={() => {
          setBranchModalVisible(false);
          setNewBranchName('');
        }}
      >
        <Input
          placeholder="Branch name"
          value={newBranchName}
          onChange={e => setNewBranchName(e.target.value)}
          onPressEnter={handleCreateBranch}
        />
      </Modal>

      {/* Merge Modal */}
      <Modal
        title="Merge Branch"
        open={mergeModalVisible}
        onOk={handleMerge}
        onCancel={() => {
          setMergeModalVisible(false);
          setMergeBranch('');
        }}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select branch to merge"
          value={mergeBranch}
          onChange={setMergeBranch}
          options={localBranches
            .filter(b => b.name !== currentBranch)
            .map(b => ({ value: b.name, label: b.name }))}
        />
      </Modal>

      {/* Stash Modal */}
      <Modal
        title="Stash Changes"
        open={stashModalVisible}
        onOk={handleStash}
        onCancel={() => {
          setStashModalVisible(false);
          setStashMessage('');
        }}
      >
        <Input
          placeholder="Stash message (optional)"
          value={stashMessage}
          onChange={e => setStashMessage(e.target.value)}
        />
      </Modal>

      {/* Tag Modal */}
      <Modal
        title="Create Tag"
        open={tagModalVisible}
        onOk={handleCreateTag}
        onCancel={() => {
          setTagModalVisible(false);
          setTagName('');
          setTagMessage('');
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Input
            placeholder="Tag name (e.g., v1.0.0)"
            value={tagName}
            onChange={e => setTagName(e.target.value)}
          />
        </div>
        <Input.TextArea
          placeholder="Tag message (optional, for annotated tag)"
          value={tagMessage}
          onChange={e => setTagMessage(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* Prune Stale Branches Modal */}
      <Modal
        title="Clear Stale Local Branches"
        open={pruneModalVisible}
        onOk={handleDeleteStaleBranches}
        onCancel={() => {
          setPruneModalVisible(false);
          setSelectedStaleBranches([]);
        }}
        okText="Delete Selected"
        okButtonProps={{
          danger: true,
          loading: deletingBranches,
          disabled: selectedStaleBranches.length === 0
        }}
        width={500}
      >
        {loadingStale ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
            <p style={{ marginTop: 12, color: '#888' }}>Fetching remote and scanning branches...</p>
          </div>
        ) : staleBranches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#52c41a' }}>
            <ClearOutlined style={{ fontSize: 32 }} />
            <p style={{ marginTop: 12 }}>No stale branches found!</p>
            <p style={{ color: '#888', fontSize: 12 }}>
              All local branches exist on remote. Local and remote are in sync.
            </p>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: 12, color: '#ff4d4f' }}>
              Found {staleBranches.length} local branch(es) that don't exist on remote:
            </p>
            <List
              dataSource={staleBranches}
              style={{ maxHeight: 300, overflow: 'auto' }}
              renderItem={item => (
                <List.Item style={{ padding: '8px 0' }}>
                  <Checkbox
                    checked={selectedStaleBranches.includes(item.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStaleBranches([...selectedStaleBranches, item.name]);
                      } else {
                        setSelectedStaleBranches(selectedStaleBranches.filter(n => n !== item.name));
                      }
                    }}
                  >
                    <strong>{item.name}</strong>
                    <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
                      (not on remote)
                    </span>
                  </Checkbox>
                </List.Item>
              )}
            />
            <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
              Note: Protected branches (main, master, develop, dev) and current branch are excluded.
            </div>
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <Checkbox
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
              >
                <span style={{ color: '#ff4d4f' }}>Force delete</span>
                <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>
                  (delete even if branch has unmerged changes)
                </span>
              </Checkbox>
            </div>
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                onClick={() => setSelectedStaleBranches(staleBranches.map(b => b.name))}
              >
                Select All
              </Button>
              <Button
                size="small"
                style={{ marginLeft: 8 }}
                onClick={() => setSelectedStaleBranches([])}
              >
                Deselect All
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default Toolbar;
