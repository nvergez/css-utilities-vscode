import * as vscode from 'vscode';
import { CSSIndexer } from '../parser/indexer';
import { CSSClass } from '../parser/cssParser';

export class CompletionProvider implements vscode.CompletionItemProvider {
    constructor(private indexer: CSSIndexer) {}

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        
        if (!this.shouldProvideCompletions(document, position)) {
            return [];
        }

        const lineText = document.lineAt(position).text;
        const range = this.getClassNameRange(lineText, position.character);
        
        if (!range) {
            return [];
        }

        const query = lineText.substring(range.start, range.end);
        const config = vscode.workspace.getConfiguration('customCSSIntelliSense');
        const maxSuggestions = config.get<number>('maxSuggestions', 50);
        
        const classes = this.indexer.searchClasses(query, maxSuggestions);
        
        return classes.map(cssClass => this.createCompletionItem(cssClass, range, document, position));
    }

    private shouldProvideCompletions(document: vscode.TextDocument, position: vscode.Position): boolean {
        const lineText = document.lineAt(position).text;
        const beforeCursor = lineText.substring(0, position.character);
        
        const classAttributePatterns = [
            /className\s*=\s*["'][^"']*$/,
            /class\s*=\s*["'][^"']*$/,
            /classList\.(add|remove|toggle)\s*\(\s*["'][^"']*$/,
            /<\w+[^>]*\sclass\s*=\s*["'][^"']*$/,
            /<\w+[^>]*\sclassName\s*=\s*["'][^"']*$/
        ];

        return classAttributePatterns.some(pattern => pattern.test(beforeCursor));
    }

    private getClassNameRange(lineText: string, cursorPos: number): { start: number; end: number } | null {
        let start = cursorPos;
        let end = cursorPos;

        while (start > 0 && this.isClassNameChar(lineText[start - 1])) {
            start--;
        }

        while (end < lineText.length && this.isClassNameChar(lineText[end])) {
            end++;
        }

        if (start === end) {
            return { start, end };
        }

        return { start, end };
    }

    private isClassNameChar(char: string): boolean {
        return /[a-zA-Z0-9_-]/.test(char);
    }

    private createCompletionItem(
        cssClass: CSSClass,
        range: { start: number; end: number },
        _document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.CompletionItem {
        const item = new vscode.CompletionItem(cssClass.name, vscode.CompletionItemKind.Value);
        
        const config = vscode.workspace.getConfiguration('customCSSIntelliSense');
        const showCategory = config.get<boolean>('showCategory', true);
        const showUsageCount = config.get<boolean>('showUsageCount', true);

        item.detail = this.createDetailText(cssClass, showCategory);
        item.documentation = this.createDocumentation(cssClass, showUsageCount);
        
        const editRange = new vscode.Range(
            position.line,
            range.start,
            position.line,
            range.end
        );
        
        item.range = editRange;
        item.insertText = cssClass.name;
        
        item.sortText = this.createSortText(cssClass);
        
        switch (cssClass.category) {
            case 'Layout':
                item.kind = vscode.CompletionItemKind.Module;
                break;
            case 'Typography':
                item.kind = vscode.CompletionItemKind.Text;
                break;
            case 'Background':
                item.kind = vscode.CompletionItemKind.Color;
                break;
            default:
                item.kind = vscode.CompletionItemKind.Value;
        }

        return item;
    }

    private createDetailText(cssClass: CSSClass, showCategory: boolean): string {
        const parts: string[] = [];
        
        if (showCategory && cssClass.category) {
            parts.push(`[${cssClass.category}]`);
        }
        
        const primaryProperties = this.getPrimaryProperties(cssClass);
        if (primaryProperties.length > 0) {
            parts.push(primaryProperties.join('; '));
        }

        return parts.join(' ');
    }

    private createDocumentation(cssClass: CSSClass, showUsageCount: boolean): vscode.MarkdownString {
        const documentation = new vscode.MarkdownString();
        
        if (cssClass.description) {
            documentation.appendText(cssClass.description);
            documentation.appendText('\n\n');
        }

        documentation.appendCodeblock(this.formatCSSRule(cssClass), 'css');
        
        documentation.appendText('\n\n');
        documentation.appendText(`📍 Source: ${this.getRelativePath(cssClass.sourceFile)}:${cssClass.line}`);
        
        if (cssClass.category) {
            documentation.appendText(`\n🎯 Category: ${cssClass.category}`);
        }
        
        if (showUsageCount) {
            const usageCount = this.calculateUsageCount(cssClass.name);
            if (usageCount > 0) {
                documentation.appendText(`\n📊 Used ${usageCount} times in project`);
            }
        }

        return documentation;
    }

    private getPrimaryProperties(cssClass: CSSClass): string[] {
        const important = ['display', 'position', 'color', 'background-color', 'font-size', 'margin', 'padding'];
        const properties: string[] = [];
        
        for (const prop of important) {
            if (cssClass.properties[prop]) {
                const value = this.truncateValue(cssClass.properties[prop]);
                properties.push(`${prop}: ${value}`);
            }
        }
        
        const remaining = Object.keys(cssClass.properties)
            .filter(prop => !important.includes(prop))
            .slice(0, 3 - properties.length);
            
        for (const prop of remaining) {
            const value = this.truncateValue(cssClass.properties[prop]);
            properties.push(`${prop}: ${value}`);
        }

        return properties.slice(0, 3);
    }

    private formatCSSRule(cssClass: CSSClass): string {
        const properties = Object.entries(cssClass.properties)
            .map(([prop, value]) => `  ${prop}: ${value};`)
            .join('\n');
            
        return `.${cssClass.name} {\n${properties}\n}`;
    }

    private truncateValue(value: string, maxLength: number = 30): string {
        if (value.length <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + '...';
    }

    private getRelativePath(filePath: string): string {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        if (workspaceFolder) {
            return vscode.workspace.asRelativePath(filePath, false);
        }
        return filePath;
    }

    private calculateUsageCount(_className: string): number {
        return 0;
    }

    private createSortText(cssClass: CSSClass): string {
        let priority = 50;
        
        switch (cssClass.category) {
            case 'Layout':
                priority = 10;
                break;
            case 'Typography':
                priority = 20;
                break;
            case 'Spacing':
                priority = 30;
                break;
            case 'Background':
                priority = 40;
                break;
            default:
                priority = 50;
        }
        
        return `${priority.toString().padStart(2, '0')}_${cssClass.name}`;
    }
}