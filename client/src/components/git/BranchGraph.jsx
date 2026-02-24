import React, { useEffect, useRef, useMemo } from 'react';
import G6 from '@antv/g6';

// Branch colors
const COLORS = {
  main: '#1890ff',
  develop: '#52c41a',
  feature: '#722ed1',
  release: '#13c2c2',
  hotfix: '#f5222d',
  default: '#fa8c16'
};

const getBranchColor = (branchName) => {
  const name = branchName.toLowerCase();
  if (name.includes('main') || name.includes('master')) return COLORS.main;
  if (name.includes('develop')) return COLORS.develop;
  if (name.includes('feature')) return COLORS.feature;
  if (name.includes('release')) return COLORS.release;
  if (name.includes('hotfix')) return COLORS.hotfix;
  return COLORS.default;
};

function BranchGraph({ commits, branches, width = 800, height = 400 }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);

  // Transform commit data into graph data
  const graphData = useMemo(() => {
    if (!commits || commits.length === 0) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const commitMap = new Map();

    // Create nodes for each commit
    commits.forEach((commit, index) => {
      const branchName = commit.refs?.[0]?.replace('HEAD -> ', '').replace('origin/', '') || 'main';
      commitMap.set(commit.hash, { ...commit, index });

      nodes.push({
        id: commit.hash,
        label: commit.shortHash || commit.hash.substring(0, 7),
        commit,
        x: 100 + (index * 80),
        y: 200,
        style: {
          fill: getBranchColor(branchName),
          stroke: '#fff',
          lineWidth: 2
        },
        labelCfg: {
          position: 'bottom',
          offset: 10
        }
      });
    });

    // Create edges (simplified - in reality would parse parent info)
    commits.forEach((commit, index) => {
      if (index < commits.length - 1) {
        edges.push({
          source: commit.hash,
          target: commits[index + 1].hash,
          style: {
            stroke: getBranchColor(commit.refs?.[0] || 'main'),
            lineWidth: 2,
            endArrow: false
          }
        });
      }
    });

    return { nodes, edges };
  }, [commits]);

  useEffect(() => {
    if (!containerRef.current || graphData.nodes.length === 0) return;

    // Destroy existing graph
    if (graphRef.current) {
      graphRef.current.destroy();
    }

    // Create new graph
    const graph = new G6.Graph({
      container: containerRef.current,
      width,
      height,
      modes: {
        default: ['drag-canvas', 'zoom-canvas']
      },
      layout: {
        type: 'dagre',
        rankdir: 'LR',
        nodesep: 30,
        ranksep: 80
      },
      defaultNode: {
        type: 'circle',
        size: 16,
        style: {
          fill: '#1890ff',
          stroke: '#fff',
          lineWidth: 2
        },
        labelCfg: {
          position: 'bottom',
          offset: 10,
          style: {
            fontSize: 10
          }
        }
      },
      defaultEdge: {
        type: 'cubic-horizontal',
        style: {
          stroke: '#1890ff',
          lineWidth: 2,
          endArrow: false
        }
      },
      nodeStateStyles: {
        hover: {
          fill: '#40a9ff',
          stroke: '#1890ff',
          lineWidth: 3
        },
        selected: {
          fill: '#1890ff',
          stroke: '#1890ff',
          lineWidth: 4
        }
      }
    });

    graph.data(graphData);
    graph.render();

    // Event handlers
    graph.on('node:mouseenter', (e) => {
      graph.setItemState(e.item, 'hover', true);
    });

    graph.on('node:mouseleave', (e) => {
      graph.setItemState(e.item, 'hover', false);
    });

    graphRef.current = graph;

    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
      }
    };
  }, [graphData, width, height]);

  if (!commits || commits.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} style={{ width, height, background: '#fafafa', borderRadius: 4 }} />
  );
}

export default BranchGraph;
