<template>
    <div class="ethernet-card">
        <div class="ethernet-header" @click="toggle">
            <div class="ethernet-title">
                <span class="ethernet-toggle" :class="{ collapsed: !isExpanded }">
                    <svg viewBox="0 0 24 24" width="12" height="12">
                        <path fill="currentColor" d="M8 5l8 7-8 7z"/>
                    </svg>
                </span>
                <span class="ethernet-icon">🌐</span>
                <span class="ethernet-name">{{ node.name }}</span>
                <span v-if="node.label" class="ethernet-label">{{ formatLabel(node.label) }}</span>
                <span class="ethernet-status" :class="statusClass(node.properties.status)">
                    {{ statusText(node.properties.status) }}
                </span>
                <span v-if="pinctrlValues.length > 0" class="ethernet-pinctrl-group">
                    <span v-for="pinctrl in pinctrlValues" :key="pinctrl" class="ethernet-pinctrl">
                        {{ pinctrl }}
                    </span>
                </span>
            </div>
        </div>

        <div v-show="isExpanded" class="ethernet-body">
            <div class="ethernet-props">
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
.ethernet-card {
    background: var(--sidebar-hover);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.ethernet-header {
    padding: 8px 12px;
    background: var(--properties-bg);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    user-select: none;
}

.ethernet-header:hover {
    background: var(--sidebar-active);
}

.ethernet-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.ethernet-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    color: var(--text-muted);
}

.ethernet-toggle.collapsed {
    transform: rotate(0deg);
}

.ethernet-toggle:not(.collapsed) {
    transform: rotate(90deg);
}

.ethernet-icon {
    font-size: 14px;
}

.ethernet-name {
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', monospace;
    color: var(--text-color);
}

.ethernet-label {
    font-size: 12px;
    color: #fff;
    background: var(--primary-color);
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    min-width: 68px;
    text-align: center;
}

.ethernet-status {
    font-size: 13px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 6px;
}

.ethernet-pinctrl {
    font-size: 13px;
    font-weight: 600;
    color: var(--secondary-color);
    padding: 4px 12px;
    background: var(--bg-color);
    border-radius: 6px;
    border: 1px solid var(--secondary-color);
}

.ethernet-pinctrl + .ethernet-pinctrl {
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

.ethernet-body {
    border-top: 1px solid var(--border-color);
    background: var(--properties-bg);
}

.ethernet-props {
    padding: 8px 12px;
}

.prop-row {
    display: flex;
    gap: 8px;
    padding: 4px 0;
    font-size: 12px;
    flex-wrap: wrap;
}

.prop-name {
    color: var(--primary-color);
    font-weight: 500;
}

.prop-eq {
    color: var(--text-muted);
}

.prop-value {
    color: var(--text-color);
    font-family: 'Consolas', 'Monaco', monospace;
    word-break: break-all;
}

.prop-value.is-code {
    color: var(--warning-color);
}
</style>