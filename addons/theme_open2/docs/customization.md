# Website Builder customization

Open2 blocks appear in the **Open2 Technology** snippet group. All custom blocks use `s_open2_*` classes and standard `section` roots, so editors can move, duplicate, remove, and translate them.

The Open2 option panel supports density, contrast, and alignment. Standard Odoo color, spacing, animation, visibility, image, and column tools remain available. FAQ, indicators, testimonials, features, and newsletter deliberately reuse native Odoo snippets and receive Open2 styling.

Header navigation comes from the current website menu. Never hardcode additional navigation in `header.xml`; manage it on the Open2 website. Legal links should only be added after the corresponding pages contain approved copy and are published.

The contact form sends through `mail.mail` to `hello@open2.tech`. Change the hidden `email_to` value with the form editor when a different recipient is approved.
