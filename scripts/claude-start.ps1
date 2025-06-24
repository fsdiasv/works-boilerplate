# Claude Code Starter Script with MCP Environment Variables (PowerShell)

Write-Host "🚀 Starting Claude Code with MCP configuration..." -ForegroundColor Green

# Check if .env.mcp exists
if (-not (Test-Path ".env.mcp")) {
    Write-Host "⚠️  .env.mcp not found!" -ForegroundColor Yellow
    Write-Host "Creating .env.mcp from template..." -ForegroundColor Yellow
    
    if (Test-Path ".env.mcp.example") {
        Copy-Item ".env.mcp.example" ".env.mcp"
        Write-Host "📝 Please edit .env.mcp with your actual API keys!" -ForegroundColor Red
        Write-Host "Then run this script again." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "❌ .env.mcp.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Load environment variables from .env.mcp
Write-Host "📥 Loading MCP environment variables..." -ForegroundColor Green

Get-Content .env.mcp | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
    }
}

# Verify critical variables are set
$missingVars = @()

function Test-Variable {
    param($varName)
    $value = [System.Environment]::GetEnvironmentVariable($varName)
    if ([string]::IsNullOrEmpty($value) -or $value.StartsWith("your-") -or $value.StartsWith("YOUR_")) {
        $script:missingVars += $varName
    }
}

# Check all required variables
Test-Variable "TAVILY_API_KEY"
Test-Variable "FIRECRAWL_API_KEY"
Test-Variable "STRIPE_API_KEY"
Test-Variable "ANTHROPIC_API_KEY"
Test-Variable "GITHUB_TOKEN"

# Report missing variables
if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Warning: The following API keys are not configured:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host "Some MCP servers may not work properly." -ForegroundColor Yellow
    Write-Host ""
}

# Start Claude Code
Write-Host "✅ Environment loaded! Starting Claude Code..." -ForegroundColor Green
Write-Host ""

# Start Claude with the current directory
& claude .