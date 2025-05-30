// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import { dot } from 'node:test/reporters';

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

  const askOpenAIdisposable = vscode.commands.registerCommand('extension.askOpenAI', async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
          vscode.window.showErrorMessage('No active editor found');
          return;
      }

      const document = editor.document;
      const languageId = document.languageId;

      if (languageId !== 'c' && languageId !== 'cpp') {
          vscode.window.showErrorMessage('This command only works in C/C++ files');
          return;
      }

      const selectedText = editor.document.getText(editor.selection);
      const prompt = await vscode.window.showInputBox({
          prompt: 'Enter a prompt to send to OpenAI',
          placeHolder: 'e.g. What does this C++ code do?',
          value: selectedText || ''
      });

      if (!prompt) {
          vscode.window.showInformationMessage('No prompt provided.');
          return;
      }

      dotenv.config(); // Load environment variables from .env file
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
          vscode.window.showErrorMessage('Missing OpenAI API key in environment');
          return;
      }

      try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  model: 'gpt-4',
                  messages: [
                      { role: 'system', content: 'You are a helpful assistant for C/C++ developers.' },
                      { role: 'user', content: prompt }
                  ],
                  temperature: 0.5
              })
          });

          const data: any = await response.json();

          if (typeof data === 'object' && data !== null && 'error' in data) {
              const errorData = data as { error: { message: string } };
              vscode.window.showErrorMessage(`OpenAI API Error: ${errorData.error.message}`);
              return;
          }

          const reply = data.choices?.[0]?.message?.content || 'No response';
          const panel = vscode.window.createWebviewPanel(
            'openaiResponse',
            'OpenAI Response',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
            );
            panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>OpenAI Response</title>
              <style>
              body { font-family: var(--vscode-editor-font-family, monospace); padding: 1em; }
              </style>
            </head>
            <body>
              <div id="content"></div>
              <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
              <script>
              const markdown = ${JSON.stringify(reply)};
              document.getElementById('content').innerHTML = marked.parse(markdown);
              </script>
            </body>
            </html>
            `;
      } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to contact OpenAI: ${err.message}`);
      }
  });

  context.subscriptions.push(askOpenAIdisposable);

}

// This method is called when your extension is deactivated
export function deactivate() {}
