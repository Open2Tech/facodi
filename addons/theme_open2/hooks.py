"""Installation safeguards for optional Odoo website integrations."""


def restore_default_helpdesk_bootstrap(env):
    """Undo only the empty default web intake enabled by website_helpdesk.

    ``website_helpdesk`` enables the standard ``helpdesk.helpdesk_team1`` and
    publishes a ``/helpdesk`` menu on the company's default website from its
    post-init hook. The dependency is installed for Open2, so that bootstrap
    must not become FACODI navigation. The strict guards below deliberately
    leave configured or already-used Helpdesk teams untouched.
    """
    team = env.ref("helpdesk.helpdesk_team1", raise_if_not_found=False)
    if not team or not team.use_website_helpdesk_form or not team.is_published:
        return False
    if team.with_context(lang="en_US").name != "Customer Care":
        return False

    menu = team.website_menu_id
    is_standard_bootstrap = (
        menu
        and menu.website_id == team.website_id
        and menu.url == "/helpdesk"
        and not menu.page_id
        and not menu.theme_template_id
    )
    if not is_standard_bootstrap:
        return False

    if env["helpdesk.ticket"].with_context(active_test=False).search_count([
        ("team_id", "=", team.id),
    ]):
        return False

    team.write({
        "use_website_helpdesk_form": False,
        "is_published": False,
    })
    return True


def post_init_hook(env):
    """Keep the first installation of website_helpdesk multiwebsite-safe."""
    restore_default_helpdesk_bootstrap(env)
