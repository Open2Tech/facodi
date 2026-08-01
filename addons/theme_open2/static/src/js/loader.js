import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";
import { session } from "@web/session";

export class Open2Loader extends Interaction {
    static selector = ".open2-loader[data-open2-loader='1']";

    setup() {
        this.leaveTimer = null;
        this.removeTimer = null;
    }

    start() {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const editing = document.body.classList.contains("editor_enable") ||
            document.documentElement.classList.contains("o_website_preview");
        if (reducedMotion || editing || !session.is_website_user) {
            return;
        }

        const websiteKey = window.location.hostname || "open2";
        const storageKey = `theme_open2.loader.v1.${websiteKey}`;
        try {
            if (window.sessionStorage.getItem(storageKey)) {
                return;
            }
            window.sessionStorage.setItem(storageKey, "shown");
        } catch {
            // Storage may be blocked. The page remains fully usable.
        }

        this.el.classList.add("is-open2-loader-active");
        this.el.setAttribute("aria-hidden", "false");
        this.leaveTimer = window.setTimeout(() => {
            this.el.classList.add("is-open2-loader-leaving");
        }, 1050);
        this.removeTimer = window.setTimeout(() => {
            this.el.classList.remove("is-open2-loader-active", "is-open2-loader-leaving");
            this.el.setAttribute("aria-hidden", "true");
        }, 1450);
        this.registerCleanup(() => {
            window.clearTimeout(this.leaveTimer);
            window.clearTimeout(this.removeTimer);
        });
    }
}

registry.category("public.interactions").add("theme_open2.loader", Open2Loader);
