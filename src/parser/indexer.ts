import * as vscode from 'vscode';
import * as fs from 'fs';
import { CSSParser, CSSClass } from './cssParser';

export interface IndexStatistics {
    classCount: number;
    fileCount: number;
    lastIndexed: Date;
}

export class CSSIndexer {
    private parser: CSSParser;
    private classIndex: Map<string, CSSClass> = new Map();
    private fileWatcher?: vscode.FileSystemWatcher;
    private statusBarItem: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext) {
        this.parser = new CSSParser();
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'customCSSIntelliSense.showStatistics';
        this.statusBarItem.show();
        this.updateStatusBar();
    }

    async initialize(): Promise<void> {
        console.log('Initializing CSS indexer...');
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            console.log('No workspace folder found');
            return;
        }

        console.log('Workspace folders:', workspaceFolders.map(f => f.uri.fsPath));
        await this.indexWorkspace();
        this.setupFileWatcher();
        this.updateStatusBar();
        
        console.log(`Indexed ${this.classIndex.size} CSS classes`);
    }

    private async indexWorkspace(): Promise<void> {
        const config = vscode.workspace.getConfiguration('customCSSIntelliSense');
        const includePatterns = config.get<string[]>('include', ['**/*.{css,scss,sass,less}']);
        const excludePatterns = config.get<string[]>('exclude', ['**/node_modules/**', '**/dist/**', '**/build/**']);

        console.log('Include patterns:', includePatterns);
        console.log('Exclude patterns:', excludePatterns);

        for (const pattern of includePatterns) {
            try {
                console.log(`Searching for files with pattern: ${pattern}`);
                const files = await vscode.workspace.findFiles(
                    pattern,
                    `{${excludePatterns.join(',')}}`
                );

                console.log(`Found ${files.length} files:`, files.map(f => f.fsPath));
                await Promise.all(files.map(file => this.indexFile(file.fsPath)));
            } catch (error) {
                console.error(`Error finding files for pattern ${pattern}:`, error);
            }
        }
    }

    private async indexFile(filePath: string): Promise<void> {
        try {
            console.log(`Indexing file: ${filePath}`);
            const content = fs.readFileSync(filePath, 'utf-8');
            console.log(`File content length: ${content.length}`);
            
            const result = await this.parser.parseCSS(content, filePath);
            console.log(`Parsed ${result.classes.length} classes from ${filePath}:`);
            result.classes.forEach(c => console.log(`  - ${c.name} (${c.category})`));
            
            this.removeClassesFromFile(filePath);
            
            result.classes.forEach(cssClass => {
                this.classIndex.set(cssClass.name, cssClass);
            });

            if (result.errors.length > 0) {
                console.warn(`Errors parsing ${filePath}:`, result.errors);
            }
        } catch (error) {
            console.error(`Failed to index file ${filePath}:`, error);
        }
    }

    private removeClassesFromFile(filePath: string): void {
        const classesToRemove: string[] = [];
        
        this.classIndex.forEach((cssClass, className) => {
            if (cssClass.sourceFile === filePath) {
                classesToRemove.push(className);
            }
        });

        classesToRemove.forEach(className => {
            this.classIndex.delete(className);
        });
    }

    private setupFileWatcher(): void {
        const config = vscode.workspace.getConfiguration('customCSSIntelliSense');
        const includePatterns = config.get<string[]>('include', ['**/*.{css,scss,sass,less}']);
        
        const watchPattern = includePatterns.length === 1 
            ? includePatterns[0] 
            : `**/*.{css,scss,sass,less}`;

        this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);

        this.fileWatcher.onDidCreate(uri => {
            this.indexFile(uri.fsPath);
            this.updateStatusBar();
        });

        this.fileWatcher.onDidChange(uri => {
            this.indexFile(uri.fsPath);
            this.updateStatusBar();
        });

        this.fileWatcher.onDidDelete(uri => {
            this.removeClassesFromFile(uri.fsPath);
            this.updateStatusBar();
        });

        this.context.subscriptions.push(this.fileWatcher);
    }

    private updateStatusBar(): void {
        const classCount = this.classIndex.size;
        const fileCount = new Set(Array.from(this.classIndex.values()).map(c => c.sourceFile)).size;
        
        this.statusBarItem.text = `$(symbol-class) ${classCount} CSS classes`;
        this.statusBarItem.tooltip = `${classCount} CSS classes from ${fileCount} files`;
    }

    getAllClasses(): CSSClass[] {
        return Array.from(this.classIndex.values());
    }

    getClass(className: string): CSSClass | undefined {
        return this.classIndex.get(className);
    }

    searchClasses(query: string, maxResults: number = 50): CSSClass[] {
        if (!query || query.length === 0) {
            return this.getAllClasses().slice(0, maxResults);
        }

        const queryLower = query.toLowerCase();
        const results: Array<{ class: CSSClass; score: number }> = [];

        this.classIndex.forEach(cssClass => {
            const score = this.calculateMatchScore(cssClass.name, queryLower);
            if (score > 0) {
                results.push({ class: cssClass, score });
            }
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(result => result.class);
    }

    private calculateMatchScore(className: string, query: string): number {
        const nameLower = className.toLowerCase();
        
        if (nameLower === query) {
            return 100;
        }
        
        if (nameLower.startsWith(query)) {
            return 80;
        }
        
        if (nameLower.includes(query)) {
            return 60;
        }
        
        return this.fuzzyMatch(nameLower, query);
    }

    private fuzzyMatch(text: string, pattern: string): number {
        let patternIndex = 0;
        let score = 0;
        let consecutiveMatches = 0;

        for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
            if (text[i] === pattern[patternIndex]) {
                score += 1 + consecutiveMatches;
                patternIndex++;
                consecutiveMatches++;
            } else {
                consecutiveMatches = 0;
            }
        }

        if (patternIndex === pattern.length) {
            return Math.min(score * 2, 40);
        }

        return 0;
    }

    async rescanFiles(): Promise<void> {
        console.log('Rescanning CSS files...');
        this.classIndex.clear();
        await this.indexWorkspace();
        this.updateStatusBar();
    }

    clearCache(): void {
        console.log('Clearing CSS cache...');
        this.classIndex.clear();
        this.updateStatusBar();
    }

    getStatistics(): IndexStatistics {
        const fileCount = new Set(Array.from(this.classIndex.values()).map(c => c.sourceFile)).size;
        
        return {
            classCount: this.classIndex.size,
            fileCount,
            lastIndexed: new Date()
        };
    }

    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.statusBarItem.dispose();
    }
}