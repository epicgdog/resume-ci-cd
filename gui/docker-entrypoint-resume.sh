#!/bin/sh
set -e

mkdir -p /data
if [ ! -f /data/resume.json ]; then
    cp /app/resume.default.json /data/resume.json
fi
