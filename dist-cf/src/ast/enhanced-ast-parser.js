import { readFile } from 'fs/promises';
export class EnhancedASTParser {
    async parseFile(filePath) {
        const start = performance.now();
        const content = await readFile(filePath, 'utf-8');
        const ext = filePath.split('.').pop()?.toLowerCase();
        let language = 'javascript';
        if (ext === 'ts' || ext === 'tsx')
            language = 'typescript';
        else if (ext === 'py')
            language = 'python';
        else if (ext === 'go')
            language = 'go';
        const ast = this.parseContent(content, language);
        const parseTimeMs = performance.now() - start;
        return { ast, parseTimeMs };
    }
    parseContent(content, language) {
        switch (language) {
            case 'javascript':
            case 'typescript':
                return this.extractJavaScript(content);
            case 'python':
                return this.extractPython(content);
            case 'go':
                return this.extractGo(content);
            default:
                return [];
        }
    }
    extractJavaScript(content) {
        const nodes = [];
        const funcRegex = /^\s*(export\s+)?(async\s+)?function\s+(\w+)\s*\(/gm;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'FunctionDecl',
                name: match[3],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const arrowRegex = /^\s*(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/gm;
        while ((match = arrowRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'FunctionDecl',
                name: match[3],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const classRegex = /^\s*(export\s+)?class\s+(\w+)/gm;
        while ((match = classRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'ClassDecl',
                name: match[2],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const importRegex = /^\s*import\s+.+\s+from\s+['"][^'"]+['"]/gm;
        while ((match = importRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'Import',
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const assignRegex = /^\s*(export\s+)?(const|let|var)\s+(\w+)\s*=/gm;
        while ((match = assignRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            if (!nodes.some(n => n.line === line && n.type === 'FunctionDecl')) {
                nodes.push({
                    type: 'Assignment',
                    name: match[3],
                    line,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    content: match[0],
                    children: []
                });
            }
        }
        return nodes;
    }
    extractPython(content) {
        const nodes = [];
        const funcRegex = /^\s*def\s+(\w+)\s*\(/gm;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'FunctionDecl',
                name: match[1],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const classRegex = /^\s*class\s+(\w+)/gm;
        while ((match = classRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'ClassDecl',
                name: match[1],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const importRegex = /^\s*(from\s+\S+\s+)?import\s+.+/gm;
        while ((match = importRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'Import',
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const assignRegex = /^\s*(\w+)\s*=/gm;
        while ((match = assignRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            if (!nodes.some(n => n.line === line && (n.type === 'FunctionDecl' || n.type === 'ClassDecl'))) {
                nodes.push({
                    type: 'Assignment',
                    name: match[1],
                    line,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    content: match[0],
                    children: []
                });
            }
        }
        return nodes;
    }
    extractGo(content) {
        const nodes = [];
        const funcRegex = /^\s*func\s+(\w+)\s*\(/gm;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'FunctionDecl',
                name: match[1],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const methodRegex = /^\s*func\s+\([^)]+\)\s+(\w+)\s*\(/gm;
        while ((match = methodRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'FunctionDecl',
                name: match[1],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const typeRegex = /^\s*type\s+(\w+)\s+(struct|interface)/gm;
        while ((match = typeRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'ClassDecl',
                name: match[1],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const importRegex = /^\s*import\s+(\([\s\S]*?\)|"[^"]+"|`[^`]+`)/gm;
        while ((match = importRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'Import',
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        const varRegex = /^\s*(var|const)\s+(\w+)/gm;
        while ((match = varRegex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            nodes.push({
                type: 'Assignment',
                name: match[2],
                line,
                column: match.index - content.lastIndexOf('\n', match.index),
                content: match[0],
                children: []
            });
        }
        return nodes;
    }
}
