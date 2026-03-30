import { AuthmeClient } from 'authme-sdk'

export const authme = new AuthmeClient({
  url: import.meta.env.VITE_AUTHME_URL ?? 'https://dev-auth.realstate-crm.homes',
  realm: import.meta.env.VITE_AUTHME_REALM ?? 'real-estate-dev',
  clientId: import.meta.env.VITE_AUTHME_CLIENT_ID ?? 'agent-portal',
  redirectUri:
    import.meta.env.VITE_AUTHME_REDIRECT_URI ??
    'https://dev-agent.realstate-crm.homes/callback',
})
