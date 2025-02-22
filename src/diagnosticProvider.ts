import * as vscode from "vscode";
import { ZodError } from "zod";
import * as yaml from "yaml";

export class FeaturevisorDiagnosticProvider {
  private collection: vscode.DiagnosticCollection;

  constructor() {
    this.collection =
      vscode.languages.createDiagnosticCollection("featurevisor");
  }

  updateDiagnostics(document: vscode.TextDocument, error: ZodError) {
    const diagnostics: vscode.Diagnostic[] = [];

    error.issues.forEach((issue) => {
      // Find the line number for the path
      const lineNumber = this.findLineNumber(document, issue.path);

      const range = new vscode.Range(
        lineNumber,
        0,
        lineNumber,
        document.lineAt(lineNumber).text.length
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        `${issue.path.join(".")}: ${issue.message}`,
        vscode.DiagnosticSeverity.Error
      );

      diagnostics.push(diagnostic);
    });

    this.collection.set(document.uri, diagnostics);
  }

  private findLineNumber(
    document: vscode.TextDocument,
    path: (string | number)[]
  ): number {
    try {
      const content = document.getText();
      const doc = yaml.parseDocument(content);
      const node = doc.getIn(path) as yaml.YAMLMap;
      if (node?.range?.[0] !== undefined) {
        return document.positionAt(node.range[0]).line;
      }
      return 0;
    } catch (e) {
      console.error("Error finding line number:", e);
      return 0;
    }
  }

  clear() {
    this.collection.clear();
  }
}
