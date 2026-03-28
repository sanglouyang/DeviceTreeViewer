import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DeviceTreeParser } from '../parser/DeviceTreeParser'

export const useDeviceTreeStore = defineStore('deviceTree', () => {
    const rawData = ref('')
    const parser = ref(null)
    const isLoading = ref(false)
    const error = ref(null)
    const expandedNodes = ref(new Set())

    const totalNodes = computed(() => {
        if (!parser.value || !parser.value.root) return 0
        return parser.value.root.getNodeCount()
    })

    function toggleNode(nodeName) {
        if (expandedNodes.value.has(nodeName)) {
            expandedNodes.value.delete(nodeName)
        } else {
            expandedNodes.value.add(nodeName)
        }
    }

    function isNodeExpanded(nodeName) {
        return expandedNodes.value.has(nodeName)
    }

    async function parseDeviceTree(content) {
        isLoading.value = true
        error.value = null

        await new Promise(resolve => requestAnimationFrame(resolve))

        try {
            rawData.value = content
            const p = new DeviceTreeParser()
            p.parse(content)
            parser.value = p

            if (typeof window !== 'undefined') {
                window.deviceTree = p.root
                window.deviceTreeObj = p
                console.log('deviceTree 已构建完成，可在控制台访问 window.deviceTree')
            }
        } catch (e) {
            error.value = '解析设备树失败: ' + e.message
        } finally {
            isLoading.value = false
        }
    }

    async function loadFromFile(file) {
        isLoading.value = true
        error.value = null

        const reader = new FileReader()
        reader.onload = async (e) => {
            await parseDeviceTree(e.target.result)
        }
        reader.onerror = () => {
            error.value = '文件读取失败'
            isLoading.value = false
        }
        reader.readAsText(file)
    }

    function clearData() {
        rawData.value = ''
        parser.value = null
        error.value = null
        expandedNodes.value.clear()
    }

    function findByLabel(label) {
        if (!parser.value) return null
        return parser.value.findByLabel(label)
    }

    function findAllUartNodes() {
        if (!parser.value || !parser.value.root) return []
        const results = []
        function traverse(node) {
            if (!node) return
            if (node.name && node.name.startsWith('serial@')) {
                results.push(node)
            }
            for (const key in node.children) {
                traverse(node.children[key])
            }
        }
        traverse(parser.value.root)
        return results
    }

    function findAllI2cNodes() {
        if (!parser.value || !parser.value.root) return []
        const results = []
        function traverse(node) {
            if (!node) return
            if (node.name && node.name.startsWith('i2c@')) {
                results.push(node)
            }
            for (const key in node.children) {
                traverse(node.children[key])
            }
        }
        traverse(parser.value.root)
        return results
    }

    function findAllCanNodes() {
        if (!parser.value || !parser.value.root) return []
        const results = []
        function traverse(node) {
            if (!node) return
            if (node.name && node.name.startsWith('can@')) {
                results.push(node)
            }
            for (const key in node.children) {
                traverse(node.children[key])
            }
        }
        traverse(parser.value.root)
        return results
    }

    function findAllEthernetNodes() {
        if (!parser.value || !parser.value.root) return []
        const results = []
        function traverse(node) {
            if (!node) return
            if (node.name && node.name.startsWith('ethernet@')) {
                results.push(node)
            }
            for (const key in node.children) {
                traverse(node.children[key])
            }
        }
        traverse(parser.value.root)
        return results
    }

    function dump() {
        if (parser.value) {
            parser.value.dump()
        }
    }

    return {
        rawData,
        parser,
        isLoading,
        error,
        totalNodes,
        expandedNodes,
        toggleNode,
        isNodeExpanded,
        parseDeviceTree,
        loadFromFile,
        clearData,
        findByLabel,
        findAllUartNodes,
        findAllI2cNodes,
        findAllCanNodes,
        findAllEthernetNodes,
        dump
    }
})