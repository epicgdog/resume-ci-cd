#!/bin/sh
set -e

mkdir -p /data
if [ ! -f /data/resume.md ]; then
    cp /app/resume.md.default /data/resume.md
fi
chown -R nginx:nginx /data
