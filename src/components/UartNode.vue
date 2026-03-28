<template>
    <div class="uart-card">
        <div class="uart-header" @click="toggle">
            <div class="uart-title">
                <span class="uart-toggle" :class="{ collapsed: !isExpanded }">
                    <svg viewBox="0 0 24 24" width="12" height="12">
                        <path fill="currentColor" d="M8 5l8 7-8 7z"/>
                    </svg>
                </span>
                <span class="uart-icon">🔌</span>
                <span class="uart-name">{{ node.name }}</span>
                <span v-if="node.label" class="uart-label">{{ formatLabel(node.label) }}</span>
                <span class="uart-status" :class="statusClass(node.properties.status)">
                    {{ statusText(node.properties.status) }}
                </span>
                <span v-if="pinctrlValues.length > 0" class="uart-pinctrl-group">
                    <span v-for="pinctrl in pinctrlValues" :key="pinctrl" class="uart-pinctrl">
                        {{ pinctrl }}
                    </span>
                </span>
            </div>
        </div>

        <div v-show="isExpanded" class="uart-body">
            <div class="uart-props">
                <div v-for="[key, value] in propertyEntries()" :key="key" class="prop-row">
                    <span class="prop-name">{{ key }}</span>
                    <span class="prop-eq">=</span>
                    <span class="prop-value" :class="{ 'is-code': isCodeKey(key) }">{{ formatValue(value) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeviceTreeStore } from '../stores/deviceTree'

const props = defineProps({
    node: {
        type: Object,
        required: true
    }
})

const store = useDeviceTreeStore()

const isExpanded = computed(() => store.isNodeExpanded(props.node.name))

function toggle() {
    store.toggleNode(props.node.name)
}

function propertyEntries() {
    if (!props.node.properties) return []
    return Object.entries(props.node.properties)
}

function isCodeKey(key) {
    return ['reg', 'interrupts', 'clocks', 'dmas', 'pinctrl-0'].includes(key)
}

function formatValue(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object' && value.name !== undefined) return value.name
    return String(value)
}

function getPinctrlValues(value) {
    const str = formatValue(value)
    const matches = str.matchAll(/&(\w+)/g)
    return Array.from(matches).map(m => m[1])
}

const pinctrlValues = computed(() => {
    return getPinctrlValues(props.node.properties['pinctrl-0'])
})

function formatLabel(label) {
    return label.replace(/(\d+)/g, ' $1 ').trim().toUpperCase()
}

function statusText(status) {
    if (!status) return '未配置'
    const val = typeof status === 'object' ? status.name : status
    const lower = String(val).toLowerCase().replace(/^["']|["']$/g, '').trim()
    if (lower === 'okay' || lower === 'ok') return '已启用'
    if (lower === 'disabled') return '已禁用'
    if (lower === 'reserved') return '保留'
    return val
}

function statusClass(status) {
    if (!status) return 'status-unknown'
    const val = typeof status === 'object' ? status.name : status
    const lower = String(val).toLowerCase().replace(/^["']|["']$/g, '').trim()
    if (lower === 'okay' || lower === 'ok') return 'status-okay'
    if (lower === 'disabled') return 'status-disabled'
    return 'status-unknown'
}
</script>

<style scoped>
.uart-card {
    background: var(--sidebar-hover);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.uart-header {
    padding: 8px 12px;
    background: var(--properties-bg);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    user-select: none;
}

.uart-header:hover {
    background: var(--sidebar-active);
}

.uart-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.uart-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    color: var(--text-muted);
}

.uart-toggle.collapsed {
    transform: rotate(0deg);
}

.uart-toggle:not(.collapsed) {
    transform: rotate(90deg);
}

.uart-icon {
    font-size: 14px;
}

.uart-name {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
}

.uart-label {
    font-size: 12px;
    color: #fff;
    background: var(--primary-color);
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    min-width: 68px;
    text-align: center;
}

.uart-status {
    font-size: 13px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 6px;
}

.uart-pinctrl {
    font-size: 13px;
    font-weight: 600;
    color: var(--secondary-color);
    padding: 4px 12px;
    background: var(--bg-color);
    border-radius: 6px;
    border: 1px solid var(--secondary-color);
}

.uart-pinctrl + .uart-pinctrl {
    margin-left: 4px;
}

.status-okay {
    background: var(--status-okay-bg);
    color: var(--status-okay-text);
}

.status-disabled {
    background: var(--status-disabled-bg);
    color: var(--status-disabled-text);
}

.status-unknown {
    background: var(--sidebar-hover);
    color: var(--text-muted);
}

.uart-body {
    padding: 8px 12px;
}

.uart-props {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.prop-row {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', monospace;
}

.prop-name {
    color: var(--primary-color);
    font-weight: 500;
    flex-shrink: 0;
}

.prop-eq {
    color: var(--text-muted);
    flex-shrink: 0;
}

.prop-value {
    color: var(--text-color);
    word-break: break-all;
}

.prop-value.is-code {
    color: var(--secondary-color);
}
</style>