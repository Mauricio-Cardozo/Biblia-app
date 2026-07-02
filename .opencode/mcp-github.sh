#!/bin/bash
export GITHUB_TOKEN=$(gh auth token)
exec npx -y @iflow-mcp/server-github@latest "$@"
