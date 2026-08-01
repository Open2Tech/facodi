import { clickOnSave, insertSnippet, registerWebsitePreviewTour } from "@website/js/tours/tour_utils";

registerWebsitePreviewTour(
    "theme_open2_editor",
    { url: "/", edition: true },
    () => [
        { content: "Open2 homepage is visible", trigger: ":iframe .s_open2_hero" },
        ...insertSnippet({ id: "s_open2_intro", name: "Open2 Introduction", groupName: "Open2 Technology" }),
        ...clickOnSave(),
        { content: "Inserted Open2 snippet was saved", trigger: ":iframe .s_open2_intro" },
    ]
);
