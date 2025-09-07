import * as vscode from 'vscode';
import { CSSIndexer } from '../parser/indexer';

export class DefinitionProvider implements vscode.DefinitionProvider {
    constructor(private indexer: CSSIndexer) {}

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
        
        const className = this.getClassNameAtPosition(document, position);
        if (!className) {
            return null;
        }

        const cssClass = this.indexer.getClass(className);
        if (!cssClass) {
            return null;
        }

        const definitionLocation = new vscode.Location(
            vscode.Uri.file(cssClass.sourceFile),
            new vscode.Position(
                Math.max(0, cssClass.line - 1),
                Math.max(0, cssClass.column - 1)
            )
        );

        return definitionLocation;
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
}