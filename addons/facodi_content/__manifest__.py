{
    'name': 'FACODI Content',
    'summary': 'Content-first extensions for FACODI eLearning collections',
    'keywords': ['FACODI', 'eLearning', 'content', 'video', 'enrichment'],
    'description': """
FACODI Content extends Odoo eLearning with collection taxonomy, stable source
identities, and an officer-controlled enrichment workflow for video slides.

The external enrichment service is optional. Content is never published
automatically: editors review and apply suggestions explicitly.
""",
    'version': '19.0.2.0.0',
    'category': 'Website/eLearning',
    'author': 'Open2 Technology (open2.tech)',
    'maintainer': 'Open2 Technology',
    'website': 'https://open2.tech',
    'support': 'https://github.com/Open2Tech/facodi/issues',
    'repository': 'https://github.com/Open2Tech/facodi',
    'development_status': 'Beta',
    'license': 'LGPL-3',
    'depends': ['base_setup', 'mail', 'website_slides'],
    'external_dependencies': {'python': ['requests']},
    'data': [
        'security/facodi_security.xml',
        'security/ir.model.access.csv',
        'data/facodi_license_data.xml',
        'data/ir_cron.xml',
        'views/slide_channel_views.xml',
        'views/slide_slide_views.xml',
    ],
    'images': ['static/description/facodi_content_preview.svg'],
    'application': True,
    'installable': True,
    'auto_install': False,
}
