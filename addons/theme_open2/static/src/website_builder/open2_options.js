import { BaseOptionComponent } from "@html_builder/core/utils";
import { Plugin } from "@html_editor/plugin";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";

export class Open2SnippetOptions extends BaseOptionComponent {
    static template = "theme_open2.Open2SnippetOptions";
    static selector = "[data-snippet^='s_open2_']";
    static title = _t("Open2 Section");
    static groups = ["website.group_website_designer"];
}

export class Open2SnippetOptionsPlugin extends Plugin {
    static id = "open2SnippetOptions";
    resources = { builder_options: [Open2SnippetOptions] };
}

registry.category("website-plugins").add(Open2SnippetOptionsPlugin.id, Open2SnippetOptionsPlugin);
