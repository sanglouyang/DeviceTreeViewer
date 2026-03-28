<template>
    <div class="tree-level" :style="{ paddingLeft: (depth === 0 ? 0 : 16) + 'px' }">
        <div class="tree-node">
            <div class="node-row" @click="toggle">
                <span class="node-toggle" :class="{ expanded: isExpanded }">
                    <svg viewBox="0 0 24 24" width="12" height="12">
                        <path fill="currentColor" d="M8 5l8 7-8 7z"/>
                    </svg>
                </span>

                <svg class="node-icon" viewBox="0 0 24 24" width="14" height="14">
                    <path v-if="hasChildren && isExpanded" fill="#f59e0b" d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    <path v-else fill="#f59e0b" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>

                <span class="node-name" :class="{ 'is-root': node.name === '/' }">
                    {{ node.name }}
                </span>

                <span v-if="node.label" class="node-label">{{ node.label }}</span>

                <span v-if="statusText" class="node-status" :class="'status-' + statusType">
                    {{ statusText }}
                </span>
            </div>

            <div v-if="isExpanded" class="node-content">
                <div v-if="propertyEntries.length > 0" class="properties-block">
                    <div v-for="[key, value] in propertyEntries" :key="'prop-' + key" class="property-item">
                        <span class="property-name">{{ key }}</span>
                        <span v-if="value" class="property-separator"> = </span>
                        <span v-if="value" class="property-value">{{ formatPropertyValue(value) }}</span>
                        <span v-if="value" class="property-end">;</span>
                        <span v-else class="property-end">;</span>
                    </div>
                </div>

                <div class="children-block">
                    <TreeNode
                        v-for="([childName, child]) in childrenEntries"
                        :key="childName"
                        :node="child"
                        :depth="depth + 1"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    node: {
        type: Object,
        required: true
    },
    depth: {
        type: Number,
        default: 0
    }
})

const isExpanded = ref(props.depth === 0)

const childrenEntries = computed(() => {
    if (!props.node.children) return []
    return Object.entries(props.node.children)
})

const hasChildren = computed(() => childrenEntries.value.length > 0)

const propertyEntries = computed(() => {
    if (!props.node.properties) return []
    return Object.entries(props.node.properties).map(([key, val]) => [key, val?.name !== undefined ? val.name : val])
})

const statusText = computed(() => {
    const prop = props.node.properties?.status
    const status = prop?.name !== undefined ? prop.name : prop
    if (!status) return null
    return status
})

const statusType = computed(() => {
    const prop = props.node.properties?.status
    const status = prop?.name !== undefined ? prop.name : prop
    if (!status) return ''
    const lower = String(status).toLowerCase().replace(/^["']|["']$/g, '').trim()
    if (lower === 'okay' || lower === 'ok') return 'okay'
    if (lower === 'disabled' || lower === 'error') return 'disabled'
    return 'default'
})

function toggle() {
    isExpanded.value = !isExpanded.value
}

function formatPropertyValue(value) {
    return value
}
</script>

<style scoped>
.tree-level {
    width: 100%;
    min-width: max-content;
}

.tree-node {
    width: max-content;
    min-width: 100%;
}

.node-row {
    display: flex;
    align-items: center;
    padding-top: 4px;
    padding-bottom: 4px;
    padding-right: 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.15s;
    gap: 4px;
    box-sizing: border-box;
}

.node-row:hover {
    background-color: var(--node-hover);
}

.node-toggle {
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s;
}

.node-toggle.expanded {
    transform: rotate(90deg);
}

.node-toggle-placeholder {
    width: 12px;
    flex-shrink: 0;
}

.node-icon {
    flex-shrink: 0;
}

.node-name {
    color: var(--text-color);
    font-weight: 500;
    font-size: 13px;
    flex-shrink: 0;
}

.node-name.is-root {
    color: var(--primary-color);
    font-weight: 700;
}

.node-label {
    font-size: 11px;
    color: var(--primary-color);
    background: var(--sidebar-hover);
    padding: 1px 6px;
    border-radius: 3px;
    flex-shrink: 0;
}

.node-status {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
    flex-shrink: 0;
}

.node-status.status-okay {
    color: var(--status-okay-text) !important;
    background: var(--status-okay-bg) !important;
}

.node-status.status-disabled {
    color: var(--status-disabled-text) !important;
    background: var(--status-disabled-bg) !important;
}

.status-default {
    color: var(--text-muted);
    background: var(--sidebar-hover);
}

.node-content {
    margin-top: 2px;
}

.properties-block {
    margin: 6px 0;
    padding: 8px 12px;
    background: var(--properties-bg);
    border-radius: 6px;
    border-left: 3px solid var(--primary-color);
}

.property-item {
    display: flex;
    font-size: 12px;
    line-height: 1.8;
    padding: 2px 0;
    font-family: 'Consolas', 'Monaco', monospace;
}

.property-name {
    color: var(--primary-color);
    font-weight: 500;
    flex-shrink: 0;
}

.property-separator {
    color: var(--text-muted);
    margin: 0 8px;
    flex-shrink: 0;
}

.property-value {
    color: var(--text-color);
    word-break: break-all;
    background: var(--property-value-bg);
    padding: 0 4px;
    border-radius: 3px;
}

.property-end {
    color: var(--text-muted);
}

.children-block {
    margin-top: 2px;
}
</style>