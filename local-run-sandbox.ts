import {action} from './index.js'
import * as process from 'process'

const actionDir = process.cwd()
console.log('actionDir', actionDir)
process.chdir('/tmp/uKbOisIc7J/sandbox')

// Prepare the repository
const tagName = 'v' + Date.now()

// ---------------------------------------------------------------------------------------------------------------------

// Set action input environment variables
setActionInputs({
  token: process.env['GITHUB_TOKEN']!,
  name: tagName,
})

// Run the action
action()

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Set action input environment variables
 * @param inputs - input values
 * @returns void
 */
function setActionInputs(inputs: Record<string, string | undefined>) {
  Object.entries(inputs).forEach(([name, value]) => {
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value
  })
}
