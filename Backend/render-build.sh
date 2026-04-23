#!/usr/bin/env bash
set -euo pipefail

pip install -r requirements.txt
python manage.py migrate --noinput

# Optional bootstrap for free plans without Render Shell access.
# Set ADMIN_USERNAME and ADMIN_PASSWORD (and optionally ADMIN_EMAIL)
# in Render environment variables to create/update an admin account.
if [[ -n "${ADMIN_USERNAME:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
python manage.py shell <<'PY'
from django.contrib.auth import get_user_model
from django.db import transaction
import os

User = get_user_model()
username = os.environ["ADMIN_USERNAME"].strip()
password = os.environ["ADMIN_PASSWORD"]
email = os.environ.get("ADMIN_EMAIL", "admin@example.com").strip() or "admin@example.com"

with transaction.atomic():
	user, _ = User.objects.get_or_create(username=username, defaults={"email": email})
	user.email = user.email or email
	user.is_staff = True
	user.is_superuser = True
	user.set_password(password)
	user.save()

print(f"Admin bootstrap completed for user: {username}")
PY
fi