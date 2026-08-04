{
    'name': 'FACODI Theme',
    'summary': 'Digital learning experience for Faculdade Comunitaria Digital',
    'description': """
Native Odoo 19 Website and eLearning theme for Faculdade Comunitaria Digital.
It applies the FACODI visual system to public pages, course discovery, lessons,
authentication, search, portal, cookies, and error states while preserving
standard Odoo routes and template behavior.
""",
    'keywords': ['FACODI', 'education', 'eLearning', 'Website', 'portal'],
    'category': 'Theme/Education',
    'version': '19.0.1.1.0',
    'sequence': 120,
    'author': 'Open2 Technology (open2.tech)',
    'maintainer': 'Open2 Technology',
    'website': 'https://facodi.odoo.com',
    'support': 'https://github.com/Open2Tech/facodi/issues',
    'repository': 'https://github.com/Open2Tech/facodi',
    'development_status': 'Beta',
    'license': 'LGPL-3',
    'depends': ['facodi_content', 'website', 'website_slides'],
    'data': [
        'data/generate_primary_template.xml',
        'data/ir_asset.xml',
        'views/header.xml',
        'views/footer.xml',
        'views/auth.xml',
        'views/homepage.xml',
        'views/pages.xml',
        'views/slides_catalog.xml',
        'views/slides_course.xml',
        'views/slides_lesson.xml',
        'views/slides_profile.xml',
        'views/profile.xml',
        'views/search_results.xml',
        'views/search_error.xml',
        'views/cookies.xml',
        'views/snippets/facodi_learning_hub.xml',
    ],
    'assets': {
        'website.assets_editor': [
            'theme_facodi/static/src/js/facodi_theme_editor.js',
        ],
    },
    'images': [
        'static/description/facodi_theme_preview.svg',
        'static/description/theme_facodi.svg',
    ],
    # Mapping used by the Website Configurator's SVG colour/image replacement
    # pipeline (_process_svg).  Empty dict means the palette colours are
    # applied but no image placeholders are swapped.
    'images_preview_theme': {},
    'installable': True,
    'application': False,
    'auto_install': False,
}