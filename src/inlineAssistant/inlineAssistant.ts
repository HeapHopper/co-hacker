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

let debounceTimer: NodeJS.Timeout | undefined;

export function registerInlineAssistant(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument(event => {
    const change = event.contentChanges[0];
    if (!change || change.text !== ';') return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleScopeUpdate(event.document, change.range.start);
    }, 500);
  });

  context.subscriptions.push(disposable);
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

    editor.edit(editBuilder => {
        editBuilder.replace(range, newCode);
    });
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