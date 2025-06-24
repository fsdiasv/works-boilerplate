#!/bin/bash

# Claude Code Starter Script with MCP Environment Variables

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Claude Code with MCP configuration...${NC}"

# Check if .env.mcp exists
if [ ! -f ".env.mcp" ]; then
    echo -e "${YELLOW}⚠️  .env.mcp not found!${NC}"
    echo -e "${YELLOW}Creating .env.mcp from template...${NC}"
    
    if [ -f ".env.mcp.example" ]; then
        cp .env.mcp.example .env.mcp
        echo -e "${RED}📝 Please edit .env.mcp with your actual API keys!${NC}"
        echo -e "${RED}Then run this script again.${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.mcp.example not found!${NC}"
        exit 1
    fi
fi

# Load environment variables from .env.mcp
echo -e "${GREEN}📥 Loading MCP environment variables...${NC}"
export $(grep -v '^#' .env.mcp | xargs)

# Verify critical variables are set
missing_vars=()

# Check if variables have real values (not placeholders)
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [[ -z "$var_value" || "$var_value" == "your-"* || "$var_value" == "YOUR_"* ]]; then
        missing_vars+=("$var_name")
    fi
}

# Check all required variables
check_var "TAVILY_API_KEY"
check_var "FIRECRAWL_API_KEY"
check_var "STRIPE_API_KEY"
check_var "ANTHROPIC_API_KEY"
check_var "GITHUB_TOKEN"

# Report missing variables
if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: The following API keys are not configured:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${YELLOW}   - $var${NC}"
    done
    echo -e "${YELLOW}Some MCP servers may not work properly.${NC}"
    echo ""
fi

# Start Claude Code
echo -e "${GREEN}✅ Environment loaded! Starting Claude Code...${NC}"
echo ""

# Start Claude with the current directory
claude .