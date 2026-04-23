#!/usr/bin/env bash
set -euo pipefail

gunicorn config.wsgi:application