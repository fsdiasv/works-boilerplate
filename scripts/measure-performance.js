#!/usr/bin/env node

/**
 * Performance measurement script for the landing page
 * Compares performance before and after dynamic imports
 */

import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

// Helper function to run commands safely
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', data => {
      stdout += data.toString()
    })

    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('error', error => {
      reject(error)
    })

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`))
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

const LIGHTHOUSE_CONFIG = {
  onlyCategories: ['performance'],
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
  },
  formFactor: 'mobile',
  screenEmulation: {
    mobile: true,
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
  },
}

async function runLighthouse(url, label) {
  console.log(`\n🔍 Running Lighthouse for: ${label}`)

  // Validate inputs to prevent injection
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided')
  }
  if (!label || typeof label !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(label)) {
    throw new Error('Invalid label provided')
  }

  const outputPath = path.join(process.cwd(), `lighthouse-${label}.json`)
  const configPath = path.join(process.cwd(), 'lighthouse-config.json')

  // Write config file
  await fs.writeFile(configPath, JSON.stringify(LIGHTHOUSE_CONFIG, null, 2))

  try {
    // Use spawn with arguments array to prevent command injection
    const args = [
      'lighthouse',
      url,
      '--output=json',
      `--output-path=${outputPath}`,
      `--config-path=${configPath}`,
      '--chrome-flags=--headless',
    ]

    const { stdout, stderr } = await runCommand('npx', args)

    // Read and parse results
    const results = JSON.parse(await fs.readFile(outputPath, 'utf-8'))
    const performance = results.categories.performance

    // Extract key metrics
    const metrics = {
      score: Math.round(performance.score * 100),
      FCP: results.audits['first-contentful-paint'].numericValue,
      LCP: results.audits['largest-contentful-paint'].numericValue,
      TBT: results.audits['total-blocking-time'].numericValue,
      CLS: results.audits['cumulative-layout-shift'].numericValue,
      TTI: results.audits['interactive'].numericValue,
    }

    return metrics
  } catch (error) {
    console.error(`Error running Lighthouse: ${error.message}`)
    throw error
  } finally {
    // Clean up files even if an error occurs
    try {
      await fs.unlink(outputPath)
    } catch (e) {
      // Ignore cleanup errors
    }
    try {
      await fs.unlink(configPath)
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

async function main() {
  console.log('🚀 Performance Measurement Tool')
  console.log('================================\n')

  const isDev = process.argv[2] !== '--production'
  const baseUrl = isDev ? 'http://localhost:3000' : process.env.PRODUCTION_URL

  if (!baseUrl) {
    console.error(
      '❌ Error: No URL provided. Use --production flag with PRODUCTION_URL env var or run locally.'
    )
    process.exit(1)
  }

  try {
    // Test the landing page
    const results = await runLighthouse(`${baseUrl}/en`, 'landing-page')

    console.log('\n📊 Performance Results:')
    console.log('=======================')
    console.log(`Performance Score: ${results.score}/100`)
    console.log(`First Contentful Paint (FCP): ${await formatTime(results.FCP)}`)
    console.log(`Largest Contentful Paint (LCP): ${await formatTime(results.LCP)}`)
    console.log(`Total Blocking Time (TBT): ${await formatTime(results.TBT)}`)
    console.log(`Cumulative Layout Shift (CLS): ${results.CLS.toFixed(3)}`)
    console.log(`Time to Interactive (TTI): ${await formatTime(results.TTI)}`)

    // Performance analysis
    console.log('\n📈 Analysis:')
    if (results.LCP < 2500) {
      console.log('✅ LCP is Good (< 2.5s)')
    } else if (results.LCP < 4000) {
      console.log('⚠️  LCP Needs Improvement (2.5s - 4s)')
    } else {
      console.log('❌ LCP is Poor (> 4s)')
    }

    if (results.TBT < 200) {
      console.log('✅ TBT is Good (< 200ms)')
    } else if (results.TBT < 600) {
      console.log('⚠️  TBT Needs Improvement (200ms - 600ms)')
    } else {
      console.log('❌ TBT is Poor (> 600ms)')
    }

    if (results.CLS < 0.1) {
      console.log('✅ CLS is Good (< 0.1)')
    } else if (results.CLS < 0.25) {
      console.log('⚠️  CLS Needs Improvement (0.1 - 0.25)')
    } else {
      console.log('❌ CLS is Poor (> 0.25)')
    }

    console.log('\n💡 Dynamic Import Benefits:')
    console.log('- Reduced initial JavaScript bundle size')
    console.log('- Faster First Contentful Paint')
    console.log('- Improved Largest Contentful Paint')
    console.log('- Better Time to Interactive')
  } catch (error) {
    console.error('\n❌ Measurement failed:', error.message)
    process.exit(1)
  }
}

main()
