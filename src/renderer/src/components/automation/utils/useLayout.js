import dagre from '@dagrejs/dagre'
import { Position, useVueFlow } from '@vue-flow/core'
import { ref } from 'vue'

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `@dagrejs/dagre` library to calculate the layout of the nodes and edges.
 */
export function useLayout() {
  const { findNode } = useVueFlow()

  const graph = ref(null)
  const previousDirection = ref('LR')
  const baseSpacing = 120 // 节点间距基础值
  const nodeWidth = 180 // 节点默认宽度
  const nodeHeight = 80 // 节点默认高度

  function layout(nodes, edges, direction) {
    // 创建新的dagre图实例
    const dagreGraph = new dagre.graphlib.Graph({
      multigraph: true,
      compound: true
    })

    graph.value = dagreGraph

    // 设置默认边标签
    dagreGraph.setDefaultEdgeLabel(() => ({}))

    // 设置图表配置
    const isHorizontal = direction === 'LR'
    dagreGraph.setGraph({
      rankdir: direction,
      ranksep: baseSpacing,
      nodesep: isHorizontal ? baseSpacing * 1.2 : baseSpacing * 0.8,
      edgesep: 20,
      marginx: 50,
      marginy: 50
    })

    previousDirection.value = direction

    // 添加节点到dagre图中
    for (const node of nodes) {
      try {
        // 尝试获取节点的实际尺寸
        const graphNode = findNode ? findNode(node.id) : null
        const width =
          graphNode && graphNode.dimensions ? graphNode.dimensions.width || nodeWidth : nodeWidth
        const height =
          graphNode && graphNode.dimensions ? graphNode.dimensions.height || nodeHeight : nodeHeight

        dagreGraph.setNode(node.id, {
          width,
          height,
          // 添加节点优先级，使布局更合理
          priority: node.data?.priority || 0
        })
      } catch (error) {
        // 如果获取节点尺寸失败，使用默认值
        console.warn('Failed to get node dimensions, using defaults:', error)
        dagreGraph.setNode(node.id, {
          width: nodeWidth,
          height: nodeHeight
        })
      }
    }

    // 添加边到dagre图中
    edges.forEach((edge, index) => {
      // 为每个边设置唯一ID，支持多条边连接相同的节点
      dagreGraph.setEdge(edge.source, edge.target, {
        id: edge.id || `edge-${edge.source}-${edge.target}-${index}`,
        // 边的优先级，影响边的路径计算
        priority: 1
      })
    })

    // 运行dagre布局算法
    dagre.layout(dagreGraph)

    // 处理布局结果，调整节点位置
    return nodes.map((node) => {
      try {
        const nodeWithPosition = dagreGraph.node(node.id)
        if (!nodeWithPosition) return node

        // 计算最终位置（dagre返回的是中心点位置，我们需要调整为左上角位置）
        const finalX = nodeWithPosition.x - nodeWithPosition.width / 2
        const finalY = nodeWithPosition.y - nodeWithPosition.height / 2

        // 根据布局方向设置连接点位置和边方向
        const targetPosition = isHorizontal ? Position.Left : Position.Top
        const sourcePosition = isHorizontal ? Position.Right : Position.Bottom

        return {
          ...node,
          // 设置连接点位置
          targetPosition,
          sourcePosition,
          // 更新节点位置，确保位置为有效数字
          position: {
            x: isNaN(finalX) ? 0 : finalX,
            y: isNaN(finalY) ? 0 : finalY
          }
        }
      } catch (error) {
        console.warn('Error processing node position:', error)
        return node
      }
    })
  }

  /**
   * 辅助方法：优化水平布局
   * @param {Array} nodes - 节点数组
   * @param {Array} edges - 边数组
   * @returns {Array} 处理后的节点数组
   */
  function optimizeHorizontalLayout(nodes, edges) {
    return layout(nodes, edges, 'LR')
  }

  /**
   * 辅助方法：优化垂直布局
   * @param {Array} nodes - 节点数组
   * @param {Array} edges - 边数组
   * @returns {Array} 处理后的节点数组
   */
  function optimizeVerticalLayout(nodes, edges) {
    return layout(nodes, edges, 'TB')
  }

  return {
    graph,
    layout,
    previousDirection,
    optimizeHorizontalLayout,
    optimizeVerticalLayout
  }
}
