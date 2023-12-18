import { App, Editor, FileSystemAdapter, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { markdownParser } from './utils/hepler';
import { solveHtml } from './utils/converter';
import * as path from 'path';

interface MarkdownNiceSettings {
	currentTheme: string;
}
const defaultPrefix = '.obsidian/plugins/obsidian-markdown-nice-plugin/theme/';
const DEFAULT_SETTINGS: MarkdownNiceSettings = {
	currentTheme: 'default.css'
}

const removeFrontmatter =  (content: string): string =>  {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  return content.replace(frontmatterRegex, '');
}


export default class MarkdownNicePlugin extends Plugin {
	settings: MarkdownNiceSettings;

	async onload() {
		await this.loadSettings();
		const adapter: FileSystemAdapter = this.app.vault.adapter as FileSystemAdapter;

		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	new Notice('This is a notice!');
		// });
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Markdown nice for wechat');
		const themes: Record<string, string> = {};
		try {
			const themeDir = await adapter.list(`${defaultPrefix}`);
				if (themeDir && themeDir.files && themeDir.files.length > 0) {
					themeDir.files.forEach(item => {
						const fileName = path.basename(item);
						const extension = path.extname(item).slice(1);
						if (extension === 'css') {
							themes[fileName] = fileName;
						}
					})
				this.addSettingTab(new SettingTab(this.app, themes, this));
				}
			
		} catch (error) {
			console.error(error)
		}
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'copy to wechat',
			name: '复制到公众号',
			editorCheckCallback:  (checking: boolean, editor: Editor) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						try {
							adapter.read(`${defaultPrefix}/${this.settings.currentTheme}`).then(content => {
								navigator.clipboard.writeText(solveHtml(removeFrontmatter(markdownParser.render(editor.getValue())), content));
								new Notice('复制成功');
							}).catch(error => {
								console.log(error);
								new Notice('复制失败');
							});
						} catch (error) {
							console.log(error);
							new Notice('复制失败');
						}
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open preview',
			name: '预览公众号样式',
			editorCheckCallback: (checking: boolean, editor: Editor) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						adapter.read(`${defaultPrefix}/${this.settings.currentTheme}`).then(content => {
							const html = removeFrontmatter(editor.getValue());
							new PreviewModal(this.app, solveHtml(markdownParser.render(html), content), html, themes, this.settings.currentTheme, adapter).open();
						});
					}
					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class PreviewModal extends Modal {
	html: string;
	raw: string;
	themes: Record<string, string>;
	defaultTheme: string;
	adapter: FileSystemAdapter;
	constructor(app: App, html: string, raw: string, themes: Record<string, string>, defaultTheme: string, adapter:FileSystemAdapter) {
		super(app);
		this.html = html;
		this.raw = raw;
		this.themes = themes;
		this.defaultTheme = defaultTheme;
		this.adapter = adapter
	}

	onOpen() {
		const {contentEl, titleEl} = this;
		titleEl.innerHTML = '样式预览';
		const settingDiv = contentEl.createEl('div');
		const previewDiv = contentEl.createEl('div');
		new Setting(settingDiv)
		.setName('主题选择')
		.setDesc('预览和复制时使用的主题')
		.addDropdown(dropdown => {
			dropdown.addOptions(this.themes);
				dropdown.setValue(this.defaultTheme);
				dropdown.onChange(async (value) => {
					this.adapter.read(`${defaultPrefix}/${value}`).then(content => {
						this.html = solveHtml(markdownParser.render(this.raw), content);
						// update
						previewDiv.innerHTML = `<div class="content">
						<div>${this.html}</div>
					</div>`;
					}).catch(error => {
						console.log(error);
					});
				});
		})
		.addButton(btn => {
			btn.setButtonText('复制');
			btn.onClick(async () => {
				try {
					navigator.clipboard.writeText(this.html);
					new Notice('复制成功');
				} catch (error) {
					new Notice('复制失败');
				}
			})
		})
		
		previewDiv.innerHTML = `<div class="content">
			<div>${this.html}</div>
		</div>`;
		contentEl.append(settingDiv);
		contentEl.append(previewDiv);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MarkdownNicePlugin;
	themes: Record<string, string>;

	constructor(app: App, themes: Record<string, string>, plugin: MarkdownNicePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.themes = themes
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
    containerEl.createEl("h2", { text: "插件设置" });
		new Setting(containerEl)
			.setName('主题选择')
			.setDesc('预览和复制时使用的主题')
			.addDropdown(dropdown => {
				dropdown.addOptions(this.themes);
				dropdown.setValue(this.plugin.settings.currentTheme);
				dropdown.onChange(async (value) => {
					this.plugin.settings.currentTheme = value;
					this.plugin.saveSettings();
				});
			})
	}
}
