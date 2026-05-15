const REQUIRED_ENV_VARS = [
  'VITE_API_URL',
  'VITE_AUTHME_URL',
  'VITE_AUTHME_REALM',
  'VITE_AUTHME_CLIENT_ID',
  'VITE_AUTHME_REDIRECT_URI',
] as const

const missing = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key])
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.`,
  )
}