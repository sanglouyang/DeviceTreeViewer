<template>
    <div>
        <div class="view-header">
            <h2 class="view-title">UART</h2>
            <span class="uart-count">共 {{ uartNodes.length }} 个 UART 节点</span>
        </div>

        <div v-if="!hasData" class="empty-state">
            <div class="empty-state-icon">🔌</div>
            <div class="empty-state-text">暂无设备树数据</div>
            <div class="empty-state-hint">请先加载设备树文件</div>
        </div>

        <div v-else-if="uartNodes.length === 0" class="empty-state">
            <div class="empty-state-icon">🔌</div>
            <div class="empty-state-text">未找到 UART 节点</div>
            <div class="empty-state-hint">设备树中不包含 serial@xxxxx 节点</div>
        </div>

        <div v-else class="uart-list">
            <UartNode v-for="node in uartNodes" :key="node.name" :node="node" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeviceTreeStore } from '../stores/deviceTree'
import UartNode from '../components/UartNode.vue'

defineOptions({ name: 'UART' })

const store = useDeviceTreeStore()

const hasData = computed(() => store.parser && store.parser.root)

const uartNodes = computed(() => {
    const nodes = store.findAllUartNodes()
    return nodes.sort((a, b) => {
        const numA = parseInt((a.label || '').replace('uart', '')) || 0
        const numB = parseInt((b.label || '').replace('uart', '')) || 0
        return numA - numB
    })
})
</script>

<style scoped>
.uart-count {
    font-size: 13px;
    color: var(--text-muted);
}

.uart-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>