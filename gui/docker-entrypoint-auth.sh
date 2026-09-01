#!/bin/sh
set -e

: "${VIEWER_PASSWORD:?VIEWER_PASSWORD must be set}"
: "${EDITOR_PASSWORD:?EDITOR_PASSWORD must be set}"

htpasswd -bc /etc/nginx/.htpasswd-viewer viewer "$VIEWER_PASSWORD"
htpasswd -b /etc/nginx/.htpasswd-viewer editor "$EDITOR_PASSWORD"
htpasswd -bc /etc/nginx/.htpasswd-editor editor "$EDITOR_PASSWORD"
