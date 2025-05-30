import * as vscode from 'vscode';

export function registerSuggestFixDemoCodeAction(context: vscode.ExtensionContext) {

    const suggestFixDisposable = vscode.languages.registerCodeActionsProvider('cpp', {
    provideCodeActions(document, range, context, token) {
      const line = document.lineAt(range.start.line);
      const text = line.text;

      // Very simple example: flag assignment in if condition
      const match = text.match(/if\s*\(([^)]+)\)/);
      if (match && match[1].includes('=')) {
        const fix = new vscode.CodeAction(
          'Replace = with ==',
          vscode.CodeActionKind.QuickFix
        );

        const equalPos = text.indexOf('=');
        const start = line.range.start.translate(0, equalPos);
        const end = start.translate(0, 1);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(document.uri, new vscode.Range(start, end), '==');
        fix.diagnostics = Array.from(context.diagnostics);

        return [fix];
      }

      return [];
    }
  }, {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
  });

    context.subscriptions.push(suggestFixDisposable);
}
