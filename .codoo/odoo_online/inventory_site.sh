#!/usr/bin/env sh
set -eu

facodi_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
workspace_root=$(CDPATH= cd -- "$facodi_root/../.." && pwd)
cd "$workspace_root"
exec "$workspace_root/.venv/bin/python" \
	"$facodi_root/.codoo/odoo_online/inventory_site.py" \
	--target online \
	--env "${ODOO_ENV_FILE:-$workspace_root/.env}"
