import * as vscode from 'vscode';

export function registerWelcomeCommand(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('co-hacker.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Welcome and thanks for using the Co-Hacker!');
    });

    context.subscriptions.push(disposable);
}