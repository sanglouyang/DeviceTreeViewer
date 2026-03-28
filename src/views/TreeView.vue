<template>
    <div>
        <div class="view-header">
            <h2 class="view-title">总览</h2>
            <span class="device-count">共 {{ totalNodes }} 个节点</span>
        </div>

        <div v-if="!hasData" class="empty-state">
            <div class="empty-state-icon">🌲</div>
            <div class="empty-state-text">暂无设备树数据</div>
            <div class="empty-state-hint">请先加载设备树文件</div>
        </div>

        <div v-else class="tree-view">
            <TreeNode
                :node="rootNode"
                :depth="0"
            />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeviceTreeStore } from '../stores/deviceTree'
import TreeNode from '../components/TreeNode.vue'

defineOptions({ name: 'Tree' })

const store = useDeviceTreeStore()

const hasData = computed(() => store.parser && store.parser.root)

const totalNodes = computed(() => {
    if (!store.parser || !store.parser.root) return 0
    return store.parser.root.getNodeCount()
})

const rootNode = computed(() => {
    if (!store.parser) return null
    return store.parser.root
})
</script>

<style scoped>
.tree-view {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    line-height: 1.6;
    width: 100%;
    overflow-x: auto;
}
</style>