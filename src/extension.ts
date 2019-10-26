"use strict";

import {
  commands, 
  window, 
  ExtensionContext,
	StatusBarAlignment,
	workspace
} from 'vscode';
import {writeSync} from 'clipboardy';
import * as path from 'path';


const statusBarPathItem = window.createStatusBarItem(
	StatusBarAlignment.Left,
	0
);
const statusBarSwitcherItem = window.createStatusBarItem(
	StatusBarAlignment.Left,
	0
);

let USE_ABSOLUTE_PATHS = workspace.getConfiguration('currentPath').get('useAbsolutePath') || false;

workspace.onDidChangeConfiguration(configChange => {
	if (configChange.affectsConfiguration('currentPath.useAbsolutePath')) {
		USE_ABSOLUTE_PATHS = workspace.getConfiguration('currentPath').get('useAbsolutePath');
		onUpdateCommand();
		onUpdatePath();
	}
});

const onUpdatePath = () => {
	const editor = window.activeTextEditor;
	if (editor === undefined) {
		statusBarSwitcherItem.hide();
		statusBarPathItem.hide();
	} else {
		const filePath = editor.document.fileName;
		statusBarPathItem.text = 
		  USE_ABSOLUTE_PATHS ? filePath : workspace.asRelativePath(filePath, false);
		statusBarSwitcherItem.show();
		statusBarPathItem.show();
	}
};

const onUpdateCommand = () => {
	statusBarPathItem.command = 
		USE_ABSOLUTE_PATHS ? 'currentPath.absolutePath' : 'currentPath.relativePath';
}

export function activate(context: ExtensionContext) {
	statusBarSwitcherItem.text = String.fromCodePoint(0x1F4CB);
	statusBarSwitcherItem.tooltip = 'Click to copy file name.';
	statusBarSwitcherItem.command = 'currentPath.fileName';

	statusBarPathItem.tooltip = 'Click to copy file path.';
	onUpdateCommand();
	onUpdatePath();

	const textEditorDisposable = window.onDidChangeActiveTextEditor(onUpdatePath);

	const absolutePathCommand = commands.registerCommand('currentPath.absolutePath', () => {
		writeSync(statusBarPathItem.text);
	});

	const relativePathCommand = commands.registerCommand('currentPath.relativePath', () => {
		writeSync(workspace.asRelativePath(statusBarPathItem.text, false));
	});

	const nameCommand = commands.registerCommand('currentPath.fileName', () => {
		const dotIndex = path.basename(statusBarPathItem.text).indexOf('.');
		writeSync(
			path
				.basename(statusBarPathItem.text)
				.substring(0, dotIndex !== -1 ? dotIndex : statusBarPathItem.text.length)
		);
	});

	const togglePathType = commands.registerCommand('currentPath.togglePathType', () => {
		workspace
			.getConfiguration('currentPath')
			.update('useAbsolutePath', !USE_ABSOLUTE_PATHS, true);
	});

	context.subscriptions.concat([
		textEditorDisposable, 
		absolutePathCommand,
		relativePathCommand,
		togglePathType,
		nameCommand,
	]);
}

export function deactivate() {
	statusBarPathItem.dispose();
	statusBarSwitcherItem.dispose();
}
