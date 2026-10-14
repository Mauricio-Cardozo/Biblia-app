#!/bin/bash
TOKEN=$(gh auth token)
export GITHUB_TOKEN=$TOKEN
export GITHUB_PERSONAL_ACCESS_TOKEN=$TOKEN
exec npx -y @iflow-mcp/server-github@latest "$@"
