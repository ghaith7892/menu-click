#!/bin/bash
set -e
# Update lockfile if dependencies changed (task agents may add packages)
pnpm install --no-frozen-lockfile
