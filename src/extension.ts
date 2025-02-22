import * as vscode from "vscode";
import { lintProject, ProjectConfig, Datasource } from "@featurevisor/core";

export async function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("featurevisor");

  async function validateDocument(document: vscode.TextDocument) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return; // No workspace open
    }

    try {
      // Load project config
      const configPath = `${workspaceFolder.uri.fsPath}/featurevisor.config.js`;
      const projectConfig: ProjectConfig = {
        environments: ["production"],
        tags: ["all"],
        ...require(configPath),
      };

      // Create filesystem datasource
      const datasource = new Datasource(
        projectConfig,
        workspaceFolder.uri.fsPath
      );

      const result = await lintProject({
        rootDirectoryPath: workspaceFolder.uri.fsPath,
        projectConfig,
        datasource,
        options: {
          keyPattern: document.fileName,
        },
      });

      // Clear previous diagnostics
      diagnosticCollection.clear();

      if (!result) {
        // Show linting errors
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(0, 0, document.lineCount, 0),
          "Featurevisor linting failed",
          vscode.DiagnosticSeverity.Error
        );
        diagnosticCollection.set(document.uri, [diagnostic]);
      }
    } catch (e) {
      console.error("Error validating document:", e);
    }
  }

  // Register watchers and commands
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      validateDocument(e.document)
    ),
    vscode.workspace.onDidOpenTextDocument(validateDocument)
  );
}
