import { AuthmeClient } from 'authme-sdk'

export const authme = new AuthmeClient({
  url: import.meta.env.VITE_AUTHME_URL,
  realm: import.meta.env.VITE_AUTHME_REALM,
  clientId: import.meta.env.VITE_AUTHME_CLIENT_ID,
  redirectUri: import.meta.env.VITE_AUTHME_REDIRECT_URI,
})
