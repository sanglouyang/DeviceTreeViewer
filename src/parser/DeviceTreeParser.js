export class DTSNode {
    constructor(name, label = null) {
        this.name = name
        this.label = label
        this.properties = {}
        this.children = {}
        this.labeledChildren = {}
        this.parent = null
        this.startLine = 0
        this.endLine = 0
    }

    addChild(child) {
        child.parent = this
        this.children[child.name] = child
        if (child.label) {
            this.labeledChildren[child.label] = child
        }
    }

    addProperty(key, value) {
        this.properties[key] = value
    }

    mergePropertiesFrom(otherNode) {
        for (const [key, value] of Object.entries(otherNode.properties)) {
            this.properties[key] = value
        }
    }

    mergeFrom(otherNode) {
        for (const [key, value] of Object.entries(otherNode.properties)) {
            this.properties[key] = value
        }
        for (const [childName, childNode] of Object.entries(otherNode.children)) {
            if (this.children[childName] && childName === 'aliases') {
                this.children[childName].mergeFrom(childNode)
            } else {
                childNode.parent = this
                this.children[childName] = childNode
            }
        }
        for (const [label, labeledNode] of Object.entries(otherNode.labeledChildren)) {
            if (this.labeledChildren[label]) {
                this.labeledChildren[label].mergeFrom(labeledNode)
            } else {
                this.labeledChildren[label] = labeledNode
            }
        }
    }

    setProperty(key, value) {
        this.properties[key] = value
    }

    getProperty(key) {
        return this.properties[key] || null
    }

    findByLabel(label) {
        if (this.label === label) return this
        for (const key in this.children) {
            const found = this.children[key].findByLabel(label)
            if (found) return found
        }
        return null
    }

    getNodeCount() {
        let c = 1
        for (const key in this.children) {
            c += this.children[key].getNodeCount()
        }
        return c
    }

    dump(indent = 0) {
        const prefix = '  '.repeat(indent)
        const labelStr = this.label ? `${this.label}: ` : ''
        console.log(`${prefix}${labelStr}${this.name} {`)
        for (const key in this.properties) {
            console.log(`${prefix}  ${key} = ${this.properties[key]};`)
        }
        for (const key in this.children) {
            this.children[key].dump(indent + 1)
        }
        console.log(`${prefix}}`)
    }
}

export class DeviceTree {
    constructor() {
        this.root = null
        this.nodesByLabel = new Map()
    }

    findByLabel(label) {
        return this.nodesByLabel.get(label)
    }

    getNodeCount() {
        if (!this.root) return 0
        return this.root.getNodeCount()
    }

    dump() {
        if (this.root) {
            this.root.dump()
        }
    }
}

export class DeviceTreeParser {
    constructor() {
        this.content = ''
        this.tokens = []
        this.pos = 0
        this.root = null
        this.stack = []
        this.currentNode = null
        this.nodesByLabel = new Map()
    }

    parse(content) {
        this.content = content
        this.tokens = []
        this.pos = 0
        this.root = null
        this.stack = []
        this.currentNode = null
        this.nodesByLabel = new Map()
        this.pendingOverlays = []

        this.tokenize()
        this.parseNodes()
        this.applyPendingOverlays()
        this.flattenOverlays(this.root)

        return this.root
    }

    addPendingOverlay(overlayNode) {
        this.pendingOverlays.push(overlayNode)
    }

    findNodeByLabel(node, label) {
        if (!node) return null
        if (node.label === label) return node
        if (node.labeledChildren && node.labeledChildren[label]) {
            return node.labeledChildren[label]
        }
        for (const key in node.children) {
            const found = this.findNodeByLabel(node.children[key], label)
            if (found) return found
        }
        return null
    }

    applyPendingOverlays() {
        let applied = true
        while (applied) {
            applied = false
            const remaining = []
            for (const overlay of this.pendingOverlays) {
                const label = overlay.overlayLabel
                let targetNode = label === '/' ? this.root : this.nodesByLabel.get(label)
                if (!targetNode) {
                    targetNode = this.findNodeByLabel(this.root, label)
                }
                if (targetNode) {
                    for (const [key, value] of Object.entries(overlay.properties)) {
                        targetNode.properties[key] = value
                    }
                    applied = true
                } else {
                    remaining.push(overlay)
                }
            }
            this.pendingOverlays = remaining
        }
    }

    tokenize() {
        const lines = this.content.split('\n')
        let lineNum = 0
        const tokens = []
        let inBlockComment = false

        for (let line of lines) {
            lineNum++
            const trimmed = line.trim()

            if (inBlockComment) {
                if (trimmed.includes('*/')) {
                    inBlockComment = false
                }
                continue
            }

            if (trimmed.includes('/*')) {
                inBlockComment = true
                if (trimmed.includes('*/')) {
                    inBlockComment = false
                }
                continue
            }

            if (trimmed.startsWith('#')) {
                continue
            }

            if (/^\/(delete-node|delete-property|omit-if-no-ref)\//.test(trimmed)) {
                continue
            }

            if (trimmed.startsWith('//')) {
                continue
            }

            let i = 0
            while (i < line.length) {
                const ch = line[i]
                if (ch === ' ' || ch === '\t') {
                    i++
                    continue
                }
                if (ch === '<' && i + 1 < line.length && line[i + 1] === '<') {
                    tokens.push({ type: '<<', value: '<<', line: lineNum })
                    i += 2
                    continue
                }
                if (ch === '>' && i + 1 < line.length && line[i + 1] === '>') {
                    tokens.push({ type: '>>', value: '>>', line: lineNum })
                    i += 2
                    continue
                }
                if ('{};=:[],<>&@'.includes(ch)) {
                    tokens.push({ type: ch, value: ch, line: lineNum })
                    i++
                    continue
                }
                if (ch === '"') {
                    let str = ''
                    i++
                    while (i < line.length && line[i] !== '"') {
                        str += line[i]
                        i++
                    }
                    if (i < line.length && line[i] === '"') {
                        i++
                    }
                    tokens.push({ type: 'STRING', value: str, line: lineNum })
                    continue
                }
                if (/[a-zA-Z0-9_\-\.\/,]/.test(ch)) {
                    let word = ''
                    while (i < line.length && /[a-zA-Z0-9_\-\.\/,]/.test(line[i])) {
                        word += line[i]
                        i++
                    }
                    tokens.push({ type: 'WORD', value: word, line: lineNum })
                    continue
                }
                i++
            }
        }
        this.tokens = tokens
    }

    peek() {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null
    }

    consume(type = null) {
        const token = this.peek()
        if (!token) {
            throw new Error('Unexpected end of tokens')
        }
        if (type !== null && token.type !== type) {
            throw new Error(`Expected token type ${type}, got ${token.type} at line ${token.line}`)
        }
        this.pos++
        return token
    }

    parseNodes() {
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos]
            if (token.type === 'WORD' && token.value.startsWith('/') && this.pos + 1 < this.tokens.length && this.tokens[this.pos + 1].type === ';') {
                this.pos += 2
                continue
            }
            break
        }

        while (this.pos < this.tokens.length) {
            this.parseNode()
        }
    }

    flattenOverlays(node) {
        if (!node) return

        const childKeys = Object.keys(node.children).reverse()
        for (const key of childKeys) {
            const child = node.children[key]
            this.flattenOverlays(child)
            if (child.name === '__overlay__') {
                node.mergePropertiesFrom(child)
                delete node.children[key]
            }
        }
    }

    parseNode() {
        let label = null
        let token = this.peek()

        while (token && token.type === 'WORD') {
            const next = this.tokens[this.pos + 1]
            if (next && next.type === ':') {
                if (label === null) {
                    label = token.value
                }
                this.consume()
                this.consume(':')
                token = this.peek()
            } else {
                break
            }
        }

        let name = ''
        let isOverlay = false
        let overlayLabel = ''

        if (token && token.type === '&') {
            this.consume('&')
            const refToken = this.peek()
            if (refToken && refToken.type === 'WORD') {
                overlayLabel = refToken.value
                this.consume()
                const next = this.peek()
                if (next && next.type === '@') {
                    this.consume('@')
                    const addr = this.consume('WORD')
                    name = '&' + overlayLabel + '@' + addr.value
                } else {
                    name = '&' + overlayLabel
                }
                const afterRef = this.peek()
                if (afterRef && afterRef.type === '{') {
                    isOverlay = true
                }
            } else if (refToken && refToken.type === '{') {
                name = '&'
                isOverlay = true
                overlayLabel = '/'
                this.consume('{')
            } else if (!refToken || refToken.type === ';') {
                name = '&'
            }
        } else if (token && token.type === 'WORD') {
            name = token.value
            this.consume()
            const next = this.peek()
            if (next && next.type === '@') {
                this.consume('@')
                const addr = this.consume('WORD')
                name = name + '@' + addr.value
            }
        } else if (token && token.type === '/') {
            name = '/'
            this.consume('/')
        } else {
            if (token) {
                this.pos++
            }
            return
        }

        if (isOverlay && overlayLabel && this.root) {
            const targetNode = overlayLabel === '/' ? this.root : this.nodesByLabel.get(overlayLabel)
            if (targetNode) {
                const savedCurrentNode = this.currentNode
                const savedStack = [...this.stack]

                this.currentNode = targetNode
                this.stack = [targetNode]

                if (overlayLabel !== '/') {
                    this.consume('{')
                }

                while (true) {
                    const tok = this.peek()
                    if (!tok) break
                    if (tok.type === '}') {
                        break
                    } else if (tok.type === 'WORD') {
                        const next = this.tokens[this.pos + 1]
                        if (next && (next.type === '=' || next.type === ';')) {
                            this.parseProperty()
                        } else {
                            this.parseNode()
                        }
                    } else if (tok.type === '&') {
                        this.parseNode()
                    } else {
                        this.pos++
                    }
                }

                if (this.peek() && this.peek().type === '}') {
                    this.consume('}')
                }
                const semicolon = this.peek()
                if (semicolon && semicolon.type === ';') {
                    this.consume(';')
                }

                this.currentNode = savedCurrentNode
                this.stack = savedStack
                return
            } else {
                const overlayNode = new DTSNode('&' + overlayLabel, null)
                overlayNode.overlayLabel = overlayLabel
                const savedCurrentNode = this.currentNode
                const savedStack = [...this.stack]

                this.currentNode = overlayNode
                this.stack = [overlayNode]

                if (overlayLabel !== '/') {
                    this.consume('{')
                }

                while (true) {
                    const tok = this.peek()
                    if (!tok) break
                    if (tok.type === '}') {
                        break
                    } else if (tok.type === 'WORD') {
                        const next = this.tokens[this.pos + 1]
                        if (next && (next.type === '=' || next.type === ';')) {
                            this.parseProperty()
                        } else {
                            this.parseNode()
                        }
                    } else if (tok.type === '&') {
                        this.parseNode()
                    } else {
                        this.pos++
                    }
                }

                if (this.peek() && this.peek().type === '}') {
                    this.consume('}')
                }
                const semicolon = this.peek()
                if (semicolon && semicolon.type === ';') {
                    this.consume(';')
                }

                this.currentNode = savedCurrentNode
                this.stack = savedStack
                this.addPendingOverlay(overlayNode)
                return
            }
        }

        const newNode = new DTSNode(name, label)
        newNode.startLine = token ? token.line : 0
        console.log('[parseNode] name:', name, 'stack.length:', this.stack.length)

        if (this.stack.length === 0) {
            if (!this.root) {
                this.root = newNode
                this.currentNode = newNode
                console.log('[Parser] Created root node:', name, 'label:', label)
            } else if (name === '/' || name.startsWith('/')) {
                console.log('[Parser] Merging to root. name:', name, 'newProps:', Object.keys(newNode.properties), 'newChildren:', Object.keys(newNode.children))

                const nextToken = this.peek()
                const hasBrace = nextToken && nextToken.type === '{'

                if (hasBrace) {
                    this.consume('{')

                    this.stack.push(newNode)
                    this.currentNode = newNode

                    while (true) {
                        const tok = this.peek()
                        if (!tok) break
                        if (tok.type === '}') {
                            this.consume('}')
                            break
                        } else if (tok.type === 'WORD') {
                            const next = this.tokens[this.pos + 1]
                            if (next && (next.type === '=' || next.type === ';')) {
                                this.parseProperty()
                            } else {
                                this.parseNode()
                            }
                        } else if (tok.type === '&') {
                            this.parseNode()
                        } else {
                            this.pos++
                        }
                    }

                    const semicolon = this.peek()
                    if (semicolon && semicolon.type === ';') {
                        this.consume(';')
                    }

                    this.stack.pop()
                    this.currentNode = this.stack.length > 0 ? this.stack[this.stack.length - 1] : this.root

                    this.root.mergeFrom(newNode)
                } else {
                    this.currentNode = this.root
                }
                return
            } else {
                this.root.children[name] = newNode
                newNode.parent = this.root
                if (label) {
                    this.nodesByLabel.set(label, newNode)
                }
                this.stack.push(newNode)
                this.currentNode = newNode

                const nextToken = this.peek()
                if (!nextToken || nextToken.type !== '{') {
                    this.stack.pop()
                    return
                }

                this.consume('{')

                while (true) {
                    const tok = this.peek()
                    if (!tok) break
                    if (tok.type === '}') {
                        break
                    } else if (tok.type === 'WORD') {
                        const next = this.tokens[this.pos + 1]
                        if (next && (next.type === '=' || next.type === ';')) {
                            this.parseProperty()
                        } else {
                            this.parseNode()
                        }
                    } else if (tok.type === '&') {
                        this.parseNode()
                    } else {
                        this.pos++
                    }
                }

                if (this.peek() && this.peek().type === '}') {
                    this.consume('}')
                }
                const semicolon = this.peek()
                if (semicolon && semicolon.type === ';') {
                    this.consume(';')
                }

                this.stack.pop()
                if (this.stack.length > 0) {
                    this.currentNode = this.stack[this.stack.length - 1]
                } else {
                    this.currentNode = this.root
                }
                return
            }
        } else {
            if (this.currentNode) {
                this.currentNode.addChild(newNode)
            }
        }

        this.currentNode = newNode

        if (label) {
            this.nodesByLabel.set(label, newNode)
        }

        this.stack.push(newNode)

        const nextToken = this.peek()
        if (!nextToken || nextToken.type !== '{') {
            this.stack.pop()
            return
        }

        this.consume('{')

        while (true) {
            const tok = this.peek()
            if (!tok) break
            if (tok.type === '}') {
                break
            } else if (tok.type === 'WORD') {
                const next = this.tokens[this.pos + 1]
                if (next && (next.type === '=' || next.type === ';')) {
                    this.parseProperty()
                } else {
                    this.parseNode()
                }
            } else if (tok.type === '&') {
                this.parseNode()
            } else {
                this.pos++
            }
        }

        if (this.peek() && this.peek().type === '}') {
            this.consume('}')
        }

        const semicolon = this.peek()
        if (semicolon && semicolon.type === ';') {
            this.consume(';')
        }

        const finishedNode = this.stack.pop()
        finishedNode.endLine = semicolon ? semicolon.line : (this.tokens[this.pos - 1] ? this.tokens[this.pos - 1].line : 0)

        if (this.stack.length > 0) {
            this.currentNode = this.stack[this.stack.length - 1]
        } else {
            this.currentNode = this.root
        }
    }

    parseProperty() {
        const keyToken = this.peek()
        console.log('[parseProperty] keyToken:', keyToken?.value, 'currentNode:', this.currentNode?.name)
        if (!keyToken || !this.currentNode) {
            let tok = this.peek()
            while (tok && tok.type !== ';') {
                tok = this.peek()
                if (!tok) break
                if (tok.type === ';') break
                this.pos++
                tok = this.peek()
            }
            if (tok && tok.type === ';') {
                this.consume(';')
            }
            return
        }

        this.consume('WORD')
        const key = keyToken.value

        const next = this.peek()
        let value = ''
        if (next && next.type === '=') {
            this.consume('=')
            value = this.parseValue()
        }

        this.consume(';')
        this.currentNode.addProperty(key, value)
    }

    parseValue() {
        let depth = 0
        let tokens = []
        while (true) {
            const tok = this.peek()
            if (!tok) {
                break
            }
            if (tok.type === ';' && depth === 0) {
                break
            }
            if (tok.type === '<' || tok.type === '[') {
                depth++
            } else if (tok.type === '>' || tok.type === ']') {
                depth--
            }

            if (tok.type === '&') {
                this.consume()
                const nextTok = this.peek()
                if (nextTok && nextTok.type === 'WORD') {
                    tokens.push({ type: 'REF', value: '&' + nextTok.value })
                    this.consume()
                } else {
                    tokens.push(tok)
                }
                continue
            }

            tokens.push(tok)
            this.consume()
        }

        let result = ''
        let prevType = ''
        for (const t of tokens) {
            const currType = t.type
            const isSymbol = ['<', '>', '[', ']', ';', ',', '=', ':'].includes(currType)
            const prevIsSymbol = ['<', '>', '[', ']', ';', ',', '=', ':'].includes(prevType)

            if (t.type === 'REF') {
                result += t.value
            } else if (t.type === 'STRING') {
                result += '"' + t.value + '"'
            } else if (isSymbol || prevIsSymbol) {
                result += t.value
            } else if (result) {
                result += ' ' + t.value
            } else {
                result += t.value
            }
            prevType = currType
        }
        return result.trim()
    }
}