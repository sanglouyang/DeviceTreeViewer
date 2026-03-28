<template>
    <div>
        <div class="view-header">
            <h2 class="view-title">CAN</h2>
            <span class="can-count">共 {{ canNodes.length }} 个 CAN 节点</span>
        </div>

        <div v-if="!hasData" class="empty-state">
            <div class="empty-state-icon">🔗</div>
            <div class="empty-state-text">暂无设备树数据</div>
            <div class="empty-state-hint">请先加载设备树文件</div>
        </div>

        <div v-else-if="canNodes.length === 0" class="empty-state">
            <div class="empty-state-icon">🔗</div>
            <div class="empty-state-text">未找到 CAN 节点</div>
            <div class="empty-state-hint">设备树中不包含 can@xxxxx 节点</div>
        </div>

        <div v-else class="can-list">
            <CanNode v-for="node in canNodes" :key="node.name" :node="node" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeviceTreeStore } from '../stores/deviceTree'
import CanNode from '../components/CanNode.vue'

defineOptions({ name: 'CAN' })

const store = useDeviceTreeStore()

const hasData = computed(() => store.parser && store.parser.root)

const canNodes = computed(() => {
    const nodes = store.findAllCanNodes()
    return nodes.sort((a, b) => {
        const numA = parseInt((a.label || '').replace('can', '')) || 0
        const numB = parseInt((b.label || '').replace('can', '')) || 0
        return numA - numB
    })
})
</script>

<style scoped>
.can-count {
    font-size: 13px;
    color: var(--text-muted);
}

.can-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>