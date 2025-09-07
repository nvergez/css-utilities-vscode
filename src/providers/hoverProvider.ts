import * as vscode from 'vscode';
import { CSSIndexer } from '../parser/indexer';
import { CSSClass } from '../parser/cssParser';

export class HoverProvider implements vscode.HoverProvider {
    constructor(private indexer: CSSIndexer) {}

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        const className = this.getClassNameAtPosition(document, position);
        if (!className) {
            return null;
        }

        const cssClass = this.indexer.getClass(className);
        if (!cssClass) {
            return null;
        }

        const hoverContent = this.createHoverContent(cssClass);
        const range = this.getClassNameRange(document, position, className);
        
        return new vscode.Hover(hoverContent, range);
    }

    private getClassNameAtPosition(document: vscode.TextDocument, position: vscode.Position): string | null {
        const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_-]+/);
        if (!range) {
            return null;
        }

        const word = document.getText(range);
        const lineText = document.lineAt(position.line).text;
        
        if (!this.isInClassAttribute(lineText, range.start.character)) {
            return null;
        }

        return word;
    }

    private isInClassAttribute(lineText: string, position: number): boolean {
        const beforePosition = lineText.substring(0, position);
        
        const classAttributePatterns = [
            /className\s*=\s*["'][^"']*$/,
            /class\s*=\s*["'][^"']*$/,
            /classList\.(add|remove|toggle)\s*\(\s*["'][^"']*$/
        ];

        return classAttributePatterns.some(pattern => pattern.test(beforePosition));
    }

    private getClassNameRange(document: vscode.TextDocument, position: vscode.Position, className: string): vscode.Range {
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        const startIndex = lineText.indexOf(className, 0);
        const endIndex = startIndex + className.length;
        
        return new vscode.Range(
            position.line,
            startIndex,
            position.line,
            endIndex
        );
    }

    private createHoverContent(cssClass: CSSClass): vscode.MarkdownString[] {
        const content: vscode.MarkdownString[] = [];
        
        const mainContent = new vscode.MarkdownString();
        mainContent.isTrusted = true;
        
        if (cssClass.description) {
            mainContent.appendText(`**${cssClass.description}**\n\n`);
        }
        
        mainContent.appendCodeblock(this.formatCSSRule(cssClass), 'css');
        
        this.addMetadata(mainContent, cssClass);
        
        content.push(mainContent);

        return content;
    }

    private formatCSSRule(cssClass: CSSClass): string {
        const properties = Object.entries(cssClass.properties)
            .map(([prop, value]) => `  ${prop}: ${value};`)
            .join('\n');
            
        return `.${cssClass.name} {\n${properties}\n}`;
    }

    private addMetadata(content: vscode.MarkdownString, cssClass: CSSClass): void {
        content.appendText('\n\n---\n\n');
        
        const sourcePath = this.getRelativePath(cssClass.sourceFile);
        const sourceLink = vscode.Uri.file(cssClass.sourceFile).with({
            fragment: `L${cssClass.line}`
        });
        
        content.appendMarkdown(`📍 **Source:** [${sourcePath}:${cssClass.line}](${sourceLink})\n\n`);
        
        if (cssClass.category) {
            content.appendText(`🎯 **Category:** ${cssClass.category}\n\n`);
        }
        
        const usageCount = this.calculateUsageCount(cssClass.name);
        if (usageCount > 0) {
            content.appendText(`📊 **Usage:** ${usageCount} times in project\n\n`);
        }
        
        const propertyCount = Object.keys(cssClass.properties).length;
        content.appendText(`⚙️ **Properties:** ${propertyCount} CSS declarations`);
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
}