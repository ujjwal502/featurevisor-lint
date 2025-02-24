import * as vscode from "vscode";
import * as path from "path";
import { ProjectConfig } from "@featurevisor/core";

export class FeaturevisorProjectService {
  private config!: ProjectConfig;
  private attributeKeys: string[] = [];
  private segmentKeys: string[] = [];
  private featureKeys: string[] = [];

  async initialize(workspaceRoot: string) {
    // Read featurevisor.config.js
    const configPath = path.join(workspaceRoot, "featurevisor.config.js");

    // Load and parse project configuration
    this.config = require(configPath);

    // Scan directories and build key lists
    await this.scanDirectory("attributes");
    await this.scanDirectory("segments");
    await this.scanDirectory("features");
  }

  private async scanDirectory(type: "attributes" | "segments" | "features") {
    const dirPath = path.join(
      this.config[`${type}DirectoryPath` as keyof ProjectConfig]
    );
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(dirPath, "**/*.yml")
    );

    const keys = files.map((file) => path.basename(file.fsPath, ".yml"));

    switch (type) {
      case "attributes":
        this.attributeKeys = keys;
        break;
      case "segments":
        this.segmentKeys = keys;
        break;
      case "features":
        this.featureKeys = keys;
        break;
    }
  }

  getSchemaContext() {
    return {
      projectConfig: this.config,
      attributeKeys: this.attributeKeys as [string, ...string[]],
      segmentKeys: this.segmentKeys as [string, ...string[]],
      featureKeys: this.featureKeys as [string, ...string[]],
    };
  }
}
