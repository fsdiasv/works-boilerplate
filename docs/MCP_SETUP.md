# MCP (Model Context Protocol) Setup Guide

## Overview

This project uses MCP servers to enhance Claude Code capabilities. The configuration is stored in `.mcp.json` with environment variables for sensitive API keys.

## Setup Instructions for Team Members

### 1. Copy the Environment Template

```bash
cp .env.mcp.example .env.mcp
```

### 2. Get API Keys from Team Vault

Contact your team lead or check your password manager for the following API keys:

- **TAVILY_API_KEY** - Tavily search service
- **FIRECRAWL_API_KEY** - Web scraping service
- **STRIPE_API_KEY** - Stripe payment integration
- **ANTHROPIC_API_KEY** - Anthropic AI services
- **PERPLEXITY_API_KEY** - Perplexity AI search
- **GITHUB_TOKEN** - GitHub API access
- **GOOGLE_SEARCH_API_KEY** - Google search API
- **GOOGLE_SEARCH_ENGINE_ID** - Google search engine ID

### 3. Fill in the API Keys

Edit `.env.mcp` and replace the placeholder values with actual API keys:

```bash
# Example (DO NOT use real keys in documentation)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxx
# ... etc
```

### 4. Start Claude Code with Environment Variables

Use the provided starter scripts that automatically load the `.env.mcp` file:

```bash
# On Linux/macOS
./scripts/claude-start.sh

# On Windows (PowerShell)
./scripts/claude-start.ps1
```

The script will:
- Check if `.env.mcp` exists (creates from template if missing)
- Load all environment variables
- Validate that API keys are configured
- Start Claude Code with the loaded environment

### Alternative: Manual Loading

If you prefer to load variables manually:

```bash
# On Linux/macOS
export $(cat .env.mcp | xargs)
claude .

# On Windows (PowerShell)
Get-Content .env.mcp | ForEach-Object { 
    if ($_ -match '^([^=]+)=(.*)$') { 
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2]) 
    } 
}
claude .
```

## Available MCP Servers

1. **filesystem** - File system access within project
2. **web-search** - Google search capabilities
3. **github** - GitHub repository operations
4. **postgres** - PostgreSQL database access
5. **playwright** - Browser automation with vision
6. **sequential-thinking** - Advanced reasoning
7. **Context7** - Context management
8. **tavily-mcp** - Tavily search integration
9. **firecrawl-mcp** - Web scraping
10. **stripe** - Stripe payment tools
11. **taskmaster-ai** - Task management AI
12. **markdownify** - Markdown utilities

## Security Notes

- **NEVER** commit `.env.mcp` to the repository
- Store API keys in a secure password manager
- Rotate keys regularly
- Use read-only tokens where possible
- Consider using different keys for development/production

## Troubleshooting

If MCP servers don't load:

1. Verify environment variables are set: `echo $TAVILY_API_KEY`
2. Check `.mcp.json` syntax is valid
3. Restart Claude Code after setting environment variables
4. Check Claude Code logs for error messages

## Alternative: Using a Secrets Manager

For production environments, consider using:

- **1Password CLI** - `op run -- claude`
- **Doppler** - `doppler run -- claude`
- **Vault** - HashiCorp Vault integration
- **AWS Secrets Manager** - For AWS deployments

These tools can automatically inject secrets without manual environment variable management.