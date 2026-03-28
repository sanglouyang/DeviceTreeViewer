<template>
    <div class="i2c-card" :class="{ selected }">
        <div class="i2c-header" @click.stop="toggle">
            <div class="i2c-title">
                <span class="i2c-toggle" :class="{ collapsed: !isExpanded }">
                    <svg viewBox="0 0 24 24" width="12" height="12">
                        <path fill="currentColor" d="M8 5l8 7-8 7z"/>
                    </svg>
                </span>
                <span class="i2c-icon">🖇</span>
                <span class="i2c-name">{{ node.name }}</span>
                <span v-if="node.label" class="i2c-label">{{ formatLabel(node.label) }}</span>
                <span class="i2c-status" :class="statusClass(node.properties.status)">
                    {{ statusText(node.properties.status) }}
                </span>
                <span v-if="pinctrlValues.length > 0" class="i2c-pinctrl-group">
                    <span v-for="pinctrl in pinctrlValues" :key="pinctrl" class="i2c-pinctrl">
                        {{ pinctrl }}
                    </span>
                </span>
            </div>
        </div>

        <div v-show="isExpanded" class="i2c-body" @click.stop="emit('select')">
            <div class="i2c-props">
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
    },
    selected: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['select'])

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
    return label.replace(/(i2c)(\d+)/i, '$1 $2').toUpperCase()
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
.i2c-card {
    background: var(--sidebar-hover);
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    transition: border-color 0.15s;
}

.i2c-card.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
}

.i2c-header {
    padding: 8px 12px;
    background: var(--properties-bg);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    user-select: none;
}

.i2c-header:hover {
    background: var(--sidebar-active);
}

.i2c-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.i2c-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    color: var(--text-muted);
}

.i2c-toggle.collapsed {
    transform: rotate(0deg);
}

.i2c-toggle:not(.collapsed) {
    transform: rotate(90deg);
}

.i2c-icon {
    font-size: 14px;
}

.i2c-name {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
}

.i2c-label {
    font-size: 12px;
    color: #fff;
    background: var(--primary-color);
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    min-width: 68px;
    text-align: center;
}

.i2c-status {
    font-size: 13px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 6px;
}

.i2c-pinctrl {
    font-size: 13px;
    font-weight: 600;
    color: var(--secondary-color);
    padding: 4px 12px;
    background: var(--bg-color);
    border-radius: 6px;
    border: 1px solid var(--secondary-color);
}

.i2c-pinctrl + .i2c-pinctrl {
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

.i2c-body {
    padding: 8px 12px;
}

.i2c-props {
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