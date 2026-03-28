<template>
    <div class="app-container">
        <header class="app-header">
            <h1 class="app-title">设备树查看器</h1>
            <div class="header-actions">
                <input
                    type="file"
                    ref="fileInput"
                    accept=".dts,.dtsi,.tmp,.txt"
                    @change="handleFileSelect"
                    style="display: none"
                />
                <button class="btn btn-primary" @click="triggerFileSelect">
                    加载文件
                </button>
                <button
                    class="btn btn-danger"
                    @click="clearData"
                    :disabled="!store.rawData"
                >
                    清空
                </button>
                <button
                    class="theme-toggle"
                    :class="{ active: themeStore.isDark }"
                    @click="themeStore.toggle()"
                >
                    <span class="icon-sun">☀️</span>
                    <span class="slider"></span>
                    <span class="icon-moon">🌙</span>
                </button>
            </div>
        </header>

        <div class="app-body">
            <nav class="sidebar">
                <ul class="nav-list">
                    <template v-for="item in navItems" :key="item.type || item.path">
                        <li v-if="item.type === 'divider'" class="nav-divider"></li>
                        <li v-else>
                            <router-link
                                :to="item.path"
                                class="nav-link"
                                :class="{ active: $route.path === item.path }"
                            >
                                <span class="nav-label">
                                    <span class="nav-icon">{{ item.icon }}</span>
                                    <span class="nav-text">{{ item.label }}</span>
                                </span>
                                <span class="nav-badge" v-if="item.count > 0">{{ item.count }}</span>
                            </router-link>
                        </li>
                    </template>
                </ul>
            </nav>

            <main class="main-content">
                <div v-if="store.error" class="alert alert-error">
                    {{ store.error }}
                </div>

                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDeviceTreeStore } from './stores/deviceTree'
import { useThemeStore } from './stores/theme'

const store = useDeviceTreeStore()
const themeStore = useThemeStore()
const fileInput = ref(null)

onMounted(() => {
    themeStore.init()
})

const navItems = computed(() => [
    {
        path: '/tree',
        label: '设备树总览',
        icon: '🌲',
        count: store.totalNodes
    },
    { type: 'divider' },
    {
        path: '/uart',
        label: 'UART',
        icon: '🔌',
        count: store.findAllUartNodes().length
    },
    {
        path: '/i2c',
        label: 'I2C',
        icon: '🖇',
        count: store.findAllI2cNodes().length
    },
    {
        path: '/can',
        label: 'CAN',
        icon: '🔗',
        count: store.findAllCanNodes().length
    },
    {
        path: '/ethernet',
        label: 'Ethernet',
        icon: '🌐',
        count: store.findAllEthernetNodes().length
    }
])

function triggerFileSelect() {
    fileInput.value?.click()
}

function handleFileSelect(event) {
    const file = event.target.files[0]
    if (file) {
        store.loadFromFile(file)
    }
}

function clearData() {
    store.clearData()
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}
</script>