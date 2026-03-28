<template>
    <div>
        <div class="view-header">
            <h2 class="view-title">Ethernet</h2>
            <span class="ethernet-count">共 {{ ethernetNodes.length }} 个 Ethernet 节点</span>
        </div>

        <div v-if="!hasData" class="empty-state">
            <div class="empty-state-icon">🌐</div>
            <div class="empty-state-text">暂无设备树数据</div>
            <div class="empty-state-hint">请先加载设备树文件</div>
        </div>

        <div v-else-if="ethernetNodes.length === 0" class="empty-state">
            <div class="empty-state-icon">🌐</div>
            <div class="empty-state-text">未找到 Ethernet 节点</div>
            <div class="empty-state-hint">设备树中不包含 ethernet@xxxxx 节点</div>
        </div>

        <div v-else class="ethernet-list">
            <EthernetNode v-for="node in ethernetNodes" :key="node.name" :node="node" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeviceTreeStore } from '../stores/deviceTree'
import EthernetNode from '../components/EthernetNode.vue'

defineOptions({ name: 'Ethernet' })

const store = useDeviceTreeStore()

const hasData = computed(() => store.parser && store.parser.root)

const ethernetNodes = computed(() => {
    const nodes = store.findAllEthernetNodes()
    return nodes.sort((a, b) => {
        const numA = parseInt((a.label || '').replace('gmac', '')) || 0
        const numB = parseInt((b.label || '').replace('gmac', '')) || 0
        return numA - numB
    })
})
</script>

<style scoped>
.ethernet-count {
    font-size: 13px;
    color: var(--text-muted);
}

.ethernet-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>