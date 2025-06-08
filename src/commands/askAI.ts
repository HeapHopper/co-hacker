import * as vscode from 'vscode';

export function registerAskAICommand(context: vscode.ExtensionContext) {
  const askOpenAIdisposable = vscode.commands.registerCommand('extension.askAI', async () => {
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
    const snippet = await vscode.window.showInputBox({
        prompt: 'Enter a code selection to send to OpenAI',
        value: selectedText || ''
    });

    if (!snippet) {
        vscode.window.showInformationMessage('Code was not provided.');
        return;
    }

    const temp = JSON.stringify({ snippet });
    try {
        const response = await fetch('http://localhost:8000/ask_ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ snippet })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        const reply = (data as { answer?: string }).answer || 'No response';

        const panel = vscode.window.createWebviewPanel(
        'openaiResponse',
        'AI Response',
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
