import React, { useState } from 'react';
import { Modal, Input, Form, theme } from 'antd';

function AddRepoModal({ visible, onClose, onAdd }) {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onAdd(values.path, values.name);
      form.resetFields();
      onClose();
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      // Error is already handled in the hook
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add Repository"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Add"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ path: '', name: '' }}
      >
        <Form.Item
          name="path"
          label="Repository Path"
          rules={[{ required: true, message: 'Please enter the repository path' }]}
          extra="Enter the full path to your local git repository"
        >
          <Input
            placeholder="/Users/username/projects/my-repo"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="Display Name (Optional)"
          extra="If not provided, the folder name will be used"
        >
          <Input
            placeholder="My Project"
            autoComplete="off"
          />
        </Form.Item>
      </Form>

      <div style={{
        padding: 12,
        background: token.colorBgLayout,
        borderRadius: token.borderRadius,
        marginTop: 16
      }}>
        <strong>Example paths:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: token.colorTextTertiary }}>
          <li>/topath/projects/my-project</li>
          <li>C:\Users\username\projects\my-project (Windows)</li>
        </ul>
      </div>
    </Modal>
  );
}

export default AddRepoModal;
