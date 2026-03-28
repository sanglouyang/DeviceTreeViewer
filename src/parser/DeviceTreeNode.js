export class DeviceTreeProperty {
    constructor(name, value) {
        this.name = name
        this.value = value
    }

    toString() {
        return `${this.name} = ${this.value};`
    }
}

export class DeviceTreeNode {
    constructor(name, label = null, address = null) {
        this.name = name
        this.label = label
        this.address = address
        this.properties = {}
        this.children = {}
        this.parent = null
        this.phandle = null
    }

    addProperty(prop) {
        this.properties[prop.name] = prop
    }

    addChild(node) {
        node.parent = this
        this.children[node.name] = node
    }

    merge(other) {
        for (const name in other.properties) {
            this.properties[name] = other.properties[name]
        }
        for (const key in other.children) {
            this.addChild(other.children[key])
        }
    }

    findByLabel(label) {
        if (this.label === label) return this
        for (const key in this.children) {
            const found = this.children[key].findByLabel(label)
            if (found) return found
        }
        return null
    }

    dump(indent = 0) {
        const prefix = '  '.repeat(indent)
        const labelStr = this.label ? `${this.label}: ` : ''
        const addrStr = this.address ? `@${this.address}` : ''
        console.log(`${prefix}${labelStr}${this.name}${addrStr} {`)
        for (const name in this.properties) {
            console.log(`${prefix}  ${this.properties[name]}`)
        }
        for (const key in this.children) {
            this.children[key].dump(indent + 1)
        }
        console.log(`${prefix}}`)
    }

    setProperty(key, value) {
        this.properties[key] = new DeviceTreeProperty(key, value)
    }

    getProperty(key) {
        return this.properties[key] ? this.properties[key].value : null
    }

    getNodeCount() {
        let c = 1
        for (const key in this.children) {
            c += this.children[key].getNodeCount()
        }
        return c
    }
}