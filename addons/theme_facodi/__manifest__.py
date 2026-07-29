{
    'name': 'FACODI Theme',
    'summary': 'Digital learning experience for Faculdade Comunitaria Digital',
    'description': 'A neo-brutalist Website and eLearning theme for FACODI.',
    'category': 'Theme/Education',
    'version': '19.0.1.0.0',
    'sequence': 120,
    'author': 'Open2 Technology (open2.tech)',
    'license': 'LGPL-3',
    'depends': ['website', 'website_slides'],
    'data': [
        'data/generate_primary_template.xml',
        'data/ir_asset.xml',
        'views/header.xml',
        'views/footer.xml',
        'views/homepage.xml',
        'views/snippets/facodi_learning_hub.xml',
    ],
    'assets': {
        'website.assets_editor': [
            'theme_facodi/static/src/js/facodi_theme_editor.js',
        ],
    },
    'images': [
        'static/description/facodi_theme_preview.svg',
    ],
    # Mapping used by the Website Configurator's SVG colour/image replacement
    # pipeline (_process_svg).  Empty dict means the palette colours are
    # applied but no image placeholders are swapped.
    'images_preview_theme': {},
    'installable': True,
}