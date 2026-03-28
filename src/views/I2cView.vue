<template>
    <div>
        <div class="view-header">
            <h2 class="view-title">I2C</h2>
            <span class="i2c-count">共 {{ i2cNodes.length }} 个 I2C 节点</span>
        </div>

        <div class="i2c-body" :style="{ marginRight: showPanel ? '336px' : '0' }" @click="togglePanel">
            <div class="i2c-main">
                <div v-if="!hasData" class="empty-state">
                    <div class="empty-state-icon">🖇</div>
                    <div class="empty-state-text">暂无设备树数据</div>
                    <div class="empty-state-hint">请先加载设备树文件</div>
                </div>

                <div v-else-if="i2cNodes.length === 0" class="empty-state">
                    <div class="empty-state-icon">🖇</div>
                    <div class="empty-state-text">未找到 I2C 节点</div>
                    <div class="empty-state-hint">设备树中不包含 i2c@xxxxx 节点</div>
                </div>

                <div v-else class="i2c-list">
                    <I2cNode
                        v-for="node in i2cNodes"
                        :key="node.name"
                        :node="node"
                        :selected="selectedNode?.name === node.name"
                        @select="selectNode(node)"
                    />
                </div>
            </div>
        </div>

        <div v-if="showPanel" class="i2c-panel">
            <div class="panel-header">
                <h3 class="panel-title">{{ selectedNode?.label || selectedNode?.name }}</h3>
                <button class="panel-close" @click.stop="closePanel">✕</button>
            </div>
            <div class="panel-body">
                <div v-if="panelChildren.length === 0" class="panel-empty">
                    暂无挂载设备
                </div>
                <div v-else class="panel-children">
                    <div v-for="child in panelChildren" :key="child.name" class="panel-child">
                        <div class="child-name">{{ child.name }}</div>
                        <div v-if="child.label" class="child-label">{{ child.label }}</div>
                        <div v-if="child.properties?.compatible" class="child-compatible">
                            {{ formatValue(child.properties.compatible) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDeviceTreeStore } from '../stores/deviceTree'
import I2cNode from '../components/I2cNode.vue'

defineOptions({ name: 'I2C' })

const store = useDeviceTreeStore()

const hasData = computed(() => store.parser && store.parser.root)

const selectedNode = ref(null)
const showPanel = ref(false)

const panelChildren = computed(() => {
    if (!selectedNode.value?.children) return []
    return Object.values(selectedNode.value.children)
})

const i2cNodes = computed(() => {
    const nodes = store.findAllI2cNodes()
    return nodes.sort((a, b) => {
        const numA = parseInt((a.label || '').replace('i2c', '')) || 0
        const numB = parseInt((b.label || '').replace('i2c', '')) || 0
        return numA - numB
    })
})

function togglePanel() {
    if (!showPanel.value && !selectedNode.value && i2cNodes.value.length > 0) {
        selectedNode.value = i2cNodes.value[0]
    }
    showPanel.value = !showPanel.value
}

function selectNode(node) {
    if (selectedNode.value?.name === node.name) {
        selectedNode.value = null
        showPanel.value = false
    } else {
        selectedNode.value = node
        showPanel.value = true
    }
}

function closePanel() {
    showPanel.value = false
    selectedNode.value = null
}

function formatValue(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object' && value.name !== undefined) return value.name
    return String(value)
}
</script>

<style scoped>
.i2c-body {
    display: flex;
    gap: 16px;
}

.i2c-main {
    flex: 1;
    min-width: 0;
}

.i2c-count {
    font-size: 13px;
    color: var(--text-muted);
}

.i2c-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.i2c-panel {
    position: fixed;
    top: 126px;
    right: 24px;
    bottom: 24px;
    width: 320px;
    background: var(--sidebar-hover);
    border-radius: 6px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow);
    z-index: 5;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    background: var(--properties-bg);
    border-radius: 6px 6px 0 0;
    flex-shrink: 0;
}

.panel-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.panel-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 4px;
}

.panel-close:hover {
    background: var(--hover-bg);
    color: var(--text-color);
}

.panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

.panel-empty {
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    padding: 24px 0;
}

.panel-children {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.panel-child {
    background: var(--properties-bg);
    border-radius: 6px;
    padding: 12px;
}

.child-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-color);
    word-break: break-all;
}

.child-label {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
}

.child-compatible {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
    word-break: break-all;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
}

.empty-state-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-state-text {
    font-size: 16px;
    color: var(--text-color);
    margin-bottom: 8px;
}

.empty-state-hint {
    font-size: 13px;
    color: var(--text-muted);
}
</style>