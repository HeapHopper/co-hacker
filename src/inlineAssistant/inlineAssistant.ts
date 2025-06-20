import * as vscode from 'vscode';

interface Vulnerability{
    description: string
    vulnerable_code: string
}

interface InlineAssistantRequest {
    current_line: string
    current_scope: string
    current_file: string
}

interface InlineAssistantResponse {
    is_vulnerable: boolean
    vulnerability: Vulnerability
    suggest_fix: string
}

let lastInlineSuggestion: { position: vscode.Position, suggestFix: string } | null = null;

let inlineSuggestionActive = false; // Add this flag

let debounceTimer: NodeJS.Timeout | undefined;

export function registerInlineAssistant(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument(event => {
    const change = event.contentChanges[0];
    if (!change) return;

    // If the suggestion was just inserted
    if (
    lastInlineSuggestion &&
    change.text === lastInlineSuggestion.suggestFix &&
    change.range.start.line === lastInlineSuggestion.position.line
    ) {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === event.document) {
            const line = change.range.start.line;
            const originalLineText = editor.document.lineAt(line).text;
            const indentationMatch = originalLineText.match(/^(\s*)/);
            const indentation = indentationMatch ? indentationMatch[1] : '';
            const indentedSuggestion = indentation + lastInlineSuggestion.suggestFix.trimStart();

            editor.edit(editBuilder => {
            editBuilder.replace(
                editor.document.lineAt(line).range,
                indentedSuggestion
            );
            });
        }
        // Clear the suggestion
        lastInlineSuggestion = null;
        inlineSuggestionActive = false;
        return;
    }

    // Your original trigger logic
    if (change.text !== ';') return;

    if (debounceTimer) {clearTimeout(debounceTimer);}
    debounceTimer = setTimeout(() => {
      handleScopeUpdate(event.document, change.range.start);
    }, 500);
  });

  context.subscriptions.push(disposable);

  // Register inline completion provider
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { scheme: 'file' }, // or restrict to specific languages
      {
        provideInlineCompletionItems(document, position, context, token) {
          if (
            inlineSuggestionActive &&
            lastInlineSuggestion &&
            lastInlineSuggestion.position.line === position.line &&
            lastInlineSuggestion.position.character === position.character
          ) {
            // Deactivate after providing once (optional: or use a timeout)
            inlineSuggestionActive = false;
            return [
              {
                insertText: lastInlineSuggestion.suggestFix,
                range: new vscode.Range(position, position) // Only insert at cursor, don't replace line
              }
            ];
          }
          return [];
        }
      }
    )
  );
}

async function handleScopeUpdate(document: vscode.TextDocument, position: vscode.Position) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) return;

    const text = document.getText();
    const offset = document.offsetAt(position);

    // Find surrounding `{` and `}`
    const startOffset = findScopeStart(text, offset);
    const endOffset = findScopeEnd(text, offset);

    if (startOffset === -1 || endOffset === -1) return;

    const range = new vscode.Range(
        document.positionAt(startOffset),
        document.positionAt(endOffset + 1)
    );

    const codeBlock = document.getText(range);
    const currentLine = document.lineAt(position.line).text;
    const currentFile = vscode.window.activeTextEditor?.document.fileName || '';

    const newCode = await fetchFixedCode(codeBlock, currentLine, currentFile);
    if (!newCode) return;

    let response: InlineAssistantResponse;
    try {
        response = JSON.parse(newCode) as InlineAssistantResponse;
    } catch (err) {
        vscode.window.showErrorMessage('Failed to parse response from inline assistant.');
        return;
    }

    if (response.is_vulnerable) {
        lastInlineSuggestion = {
            position: new vscode.Position(position.line, document.lineAt(position.line).range.end.character),
            suggestFix: response.suggest_fix
        };
        // Trigger the inline suggestion (ghost text)
        inlineSuggestionActive = true; // Activate suggestion
        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
        vscode.window.showInformationMessage('Vulnerability detected! Suggested fix available inline (Tab to accept).');
    }
}

function findScopeStart(text: string, offset: number): number {
    let depth = 0;
    for (let i = offset; i >= 0; i--) {
        if (text[i] === '}') depth++;
        else if (text[i] === '{') {
            if (depth === 0) return i;
            depth--;
        }
    }
    return -1;
}

function findScopeEnd(text: string, offset: number): number {
    let depth = 0;
    for (let i = offset; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
            if (depth === 0) return i;
            depth--;
        }
    }
    return -1;
}

async function fetchFixedCode(code: string, currentLine: string, currentFile: string): Promise<string | null> {
    try {
        const apiURL = process.env.CO_HACKER_SERVER_HOST_URL + '/inline_assistant/';

        const request: InlineAssistantRequest = {
            current_line: currentLine,
            current_scope: code,
            current_file: currentFile
        };

        const res = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!res.ok) {
            vscode.window.showErrorMessage(`Fix failed: ${res.statusText}`);
            return null;
        }

        return await res.text();
    } catch (err: any) {
        vscode.window.showErrorMessage(`Error: ${err.message}`);
        return null;
    }
}