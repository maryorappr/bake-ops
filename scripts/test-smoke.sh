#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./test-smoke.ps1
