import * as vscode from 'vscode';
import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";


interface CodeSnippetResponse {
    is_vulnerable: boolean;
    vulnerability_type: string;
    vulnerability: string;
    suggest_fix: string;
}

// TODO: Replace with actual API endpoint
async function analyzeSnippet(snippet: string): Promise<CodeSnippetResponse> {
  const response = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`
    },
    body: JSON.stringify({ snippet })
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json() as Promise<CodeSnippetResponse>;
}


// export async function analyzeSnippet(snippet: string): Promise<CodeSnippetResponse> {
//     const chatModel = new ChatOpenAI({
//         apiKey: process.env.OPENAI_API_KEY,
//         modelName: "gpt-4.1-nano", 
//         temperature: 0
//     });

//     const userPrompt = `
// Analyze vulnerabilities in the following C/C++ snippet:

// \`\`\`c
// ${snippet}
// \`\`\`

// Return a JSON object with:
// - is_vulnerable: true or false
// - vulnerability_type: a string
// - vulnerability: description
// - suggest_fix: rewrite the code with the fix, add a comment explaining the fix, don't add any other text
// `;

//     const response = await chatModel.invoke([
//         new HumanMessage(userPrompt)
//     ]);

//     const rawText = response.content?.toString().trim();

//     try {
//         const parsed = JSON.parse(rawText ?? "{}");
//         return parsed;
//     } catch (err) {
//         throw new Error("Failed to parse model response: " + rawText);
//     }
// }

const codeActionProvider: vscode.CodeActionProvider = {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeAction[]> {
        const selectedText = document.getText(range);

        const action = new vscode.CodeAction(
            'Analyze C/C++ snippet for vulnerabilities',
            vscode.CodeActionKind.QuickFix
        );

        action.command = {
            title: 'Analyze snippet for vulnerabilities',
            command: 'extension.analyzeSnippet',
            arguments: [selectedText, range]
        };

        return [action];
    }
};

async function analyzeSnippetCommand(snippet: string, range: vscode.Range): Promise<void> {
    try {
        const result = await analyzeSnippet(snippet);

        if (result.is_vulnerable) {
            vscode.window.showWarningMessage(
                `Vulnerability Detected: ${result.vulnerability_type}\n${result.vulnerability}`
            );

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    editBuilder.replace(range, result.suggest_fix);
                });
            }
        } else {
            vscode.window.showInformationMessage('No vulnerabilities found in the selected snippet.');
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Analysis failed: ${err.message}`);
    }
}

export function registerAnalyzeVulnerabilitiesCodeAction(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'cpp' }, // Adjust for C/C++ files
            codeActionProvider,
            { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.analyzeSnippet', analyzeSnippetCommand)
    );
}

export function deactivate(): void { }
