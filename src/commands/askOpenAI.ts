import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

export function registerAskOpenAICommand(context: vscode.ExtensionContext) {
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
                  model: 'gpt-4.1-mini',
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
