import * as vscode from "vscode";
import { CSSIndexer } from "./parser/indexer";
import { CompletionProvider } from "./providers/completionProvider";
import { HoverProvider } from "./providers/hoverProvider";
import { DefinitionProvider } from "./providers/definitionProvider";

let cssIndexer: CSSIndexer;

export async function activate(context: vscode.ExtensionContext) {
  console.log("Custom CSS IntelliSense is starting...");

  const config = vscode.workspace.getConfiguration("customCSSIntelliSense");
  if (!config.get("enable", true)) {
    console.log("Custom CSS IntelliSense is disabled");
    return;
  }

  cssIndexer = new CSSIndexer(context);
  await cssIndexer.initialize();

  const supportedLanguages = config.get<string[]>("languages", [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact",
    "html",
    "vue",
  ]);

  const completionProvider = new CompletionProvider(cssIndexer);
  const hoverProvider = new HoverProvider(cssIndexer);
  const definitionProvider = new DefinitionProvider(cssIndexer);

  supportedLanguages.forEach((language) => {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        language,
        completionProvider,
        '"',
        "'",
        " ",
        "="
      )
    );

    context.subscriptions.push(
      vscode.languages.registerHoverProvider(language, hoverProvider)
    );

    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(language, definitionProvider)
    );
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("customCSSIntelliSense.rescanFiles", () => {
      cssIndexer.rescanFiles();
      vscode.window.showInformationMessage("CSS files rescanned successfully");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("customCSSIntelliSense.clearCache", () => {
      cssIndexer.clearCache();
      vscode.window.showInformationMessage("CSS cache cleared successfully");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customCSSIntelliSense.showStatistics",
      () => {
        const stats = cssIndexer.getStatistics();
        vscode.window.showInformationMessage(
          `CSS IntelliSense: ${stats.classCount} classes indexed from ${stats.fileCount} files`
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customCSSIntelliSense.findUnusedClasses",
      () => {
        vscode.window.showInformationMessage(
          "Find unused classes feature coming soon!"
        );
      }
    )
  );

  console.log("Custom CSS IntelliSense activated successfully");
}

export function deactivate() {
  if (cssIndexer) {
    cssIndexer.dispose();
  }
}
