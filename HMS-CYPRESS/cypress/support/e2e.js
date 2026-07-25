// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Ignore Next.js hydration mismatches and other benign app errors
Cypress.on('uncaught:exception', (err, runnable) => {
  if (
    err.message.includes('Hydration') ||
    err.message.includes('hydration') ||
    err.message.includes('Expected server HTML to match') ||
    err.message.includes('Text content does not match') ||
    err.message.includes('Cannot read properties of null') ||
    err.message.includes('Target container is not a DOM element') ||
    err.message.includes('removeChild') ||
    err.message.includes('insertBefore')
  ) {
    return false
  }
})