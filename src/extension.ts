"use strict";

import {
  commands,
  window,
  ExtensionContext,
  StatusBarAlignment,
  workspace
} from "vscode";
import { writeSync } from "clipboardy";
import * as path from "path";

const statusBarPathItem = window.createStatusBarItem(
  StatusBarAlignment.Left,
  1
);
const statusBarFileNameItem = window.createStatusBarItem(
  StatusBarAlignment.Left,
  0
);

let USE_ABSOLUTE_PATHS =
  workspace.getConfiguration("currentPath").get("useAbsolutePath") || false;
let HIDE_FILE_ICON =
  workspace.getConfiguration("currentPath").get("hideFileIcon") || false;

workspace.onDidChangeConfiguration(configChange => {
  if (configChange.affectsConfiguration("currentPath.useAbsolutePath")) {
    USE_ABSOLUTE_PATHS = workspace
      .getConfiguration("currentPath")
      .get("useAbsolutePath");
    onUpdateCommand();
    onUpdatePath();
  }
  if (configChange.affectsConfiguration("currentPath.hideFileIcon")) {
    HIDE_FILE_ICON = workspace
      .getConfiguration("currentPath")
      .get("hideFileIcon");
    onUpdateFileIconVisibility();
  }
});

const onUpdateFileIconVisibility = () => {
  HIDE_FILE_ICON ? statusBarFileNameItem.hide() : statusBarFileNameItem.show();
};

const onUpdatePath = () => {
  const editor = window.activeTextEditor;
  if (editor === undefined) {
    statusBarFileNameItem.hide();
    statusBarPathItem.hide();
  } else {
    const filePath = editor.document.fileName;
    statusBarPathItem.text = USE_ABSOLUTE_PATHS
      ? filePath
      : workspace.asRelativePath(filePath, false);
    onUpdateFileIconVisibility();
    statusBarPathItem.show();
  }
};

const onUpdateCommand = () => {
  statusBarPathItem.command = USE_ABSOLUTE_PATHS
    ? "currentPath.absolutePath"
    : "currentPath.relativePath";
};

export function activate(context: ExtensionContext) {
  statusBarFileNameItem.text = String.fromCodePoint(0x1f4cb);
  statusBarFileNameItem.tooltip = "Click to copy file name.";
  statusBarFileNameItem.command = "currentPath.fileName";

  statusBarPathItem.tooltip = "Click to copy file path.";
  onUpdateCommand();
  onUpdatePath();

  const textEditorDisposable = window.onDidChangeActiveTextEditor(onUpdatePath);

  const absolutePathCommand = commands.registerCommand(
    "currentPath.absolutePath",
    () => {
      writeSync(statusBarPathItem.text);
    }
  );

  const relativePathCommand = commands.registerCommand(
    "currentPath.relativePath",
    () => {
      writeSync(workspace.asRelativePath(statusBarPathItem.text, false));
    }
  );

  const nameCommand = commands.registerCommand("currentPath.fileName", () => {
    const dotIndex = path.basename(statusBarPathItem.text).indexOf(".");
    writeSync(
      path
        .basename(statusBarPathItem.text)
        .substring(
          0,
          dotIndex !== -1 ? dotIndex : statusBarPathItem.text.length
        )
    );
  });

  const togglePathType = commands.registerCommand(
    "currentPath.togglePathType",
    () => {
      workspace
        .getConfiguration("currentPath")
        .update("useAbsolutePath", !USE_ABSOLUTE_PATHS, true);
    }
  );

  const toggleFileIcon = commands.registerCommand(
    "currentPath.toggleFileIcon",
    () => {
      workspace
        .getConfiguration("currentPath")
        .update("hideFileIcon", !HIDE_FILE_ICON, true);
    }
  );

  context.subscriptions.concat([
    textEditorDisposable,
    absolutePathCommand,
    relativePathCommand,
    togglePathType,
    toggleFileIcon,
    nameCommand
  ]);
}

export function deactivate() {
  statusBarPathItem.dispose();
  statusBarFileNameItem.dispose();
}
