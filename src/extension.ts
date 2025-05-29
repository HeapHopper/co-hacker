// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "co-hacker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('co-hacker.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from co_hacker!');
	});

	context.subscriptions.push(disposable);

	// Register a text editor command
	// const diagnostics = vscode.languages.createDiagnosticCollection('cpp');
	
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

// This method is called when your extension is deactivated
export function deactivate() {}
