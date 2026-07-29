/** @odoo-module **/

import * as wTourUtils from '@website/js/tours/tour_utils';

const snippets = [
    { id: 's_facodi_learning_hub', name: 'Learning Hub', groupName: 'FACODI' },
];

wTourUtils.registerThemeHomepageTour('facodi_theme_tour', () => [
    wTourUtils.assertCssVariable('--color-palettes-name', '"facodi"'),
    ...wTourUtils.insertSnippet(snippets[0]),
]);