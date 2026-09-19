import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { randomBytes } from 'crypto';

// MVP demo auth: hardcoded demo accounts, clearly labeled. Do NOT use for real PHI.
// Secret: require NEXTAUTH_SECRET in production; generate ephemeral random secret for local demo boot.
function resolveSecret(): string {
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32) {
    return process.env.NEXTAUTH_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET must be set (>=32 chars) in production');
  }
  // eslint-disable-next-line no-console
  console.warn('[auth] NEXTAUTH_SECRET missing — using ephemeral demo secret (sessions will not persist across restarts)');
  return randomBytes(32).toString('hex');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'House Health Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'coordinator or anesthesiologist' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        if (credentials.username === 'coordinator' && credentials.password === 'anterior') {
          return {
            id: 'user-coord-1',
            name: 'Fatima Noor, RN',
            email: 'coordinator@anterior.ae',
            role: 'coordinator',
          } as any;
        }

        if (credentials.username === 'anesthesiologist' && credentials.password === 'anterior') {
          return {
            id: 'user-anes-1',
            name: 'Dr. Tariq Mansoor, MD (DHA-99014)',
            email: 'tariq.mansoor@anterior.ae',
            role: 'anesthesiologist',
          } as any;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: resolveSecret(),
};
