// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { registerWelcomeCommand } from './commands/welcome';
// import { registerSuggestFixDemoCodeAction } from './codeActions/suggestFixDemo';
import { registerAskAICommand } from './commands/askAI';
import { registerAnalyzeVulnerabilitiesCodeAction } from './codeActions/analyzeVulnerabilities';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "co-hacker" is now active!');

  registerWelcomeCommand(context);
  // registerSuggestFixDemoCodeAction(context);
  registerAskAICommand(context);
  registerAnalyzeVulnerabilitiesCodeAction(context);

  console.log('commands and codeActions were registered successfully!');

}

// This method is called when your extension is deactivated
export function deactivate() {}
