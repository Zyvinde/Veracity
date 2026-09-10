import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Anterior Healthcare Credentials',
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

        // Demo fallback for any valid username
        if (credentials.username && credentials.password) {
          return {
            id: `user-${credentials.username}`,
            name: credentials.username.charAt(0).toUpperCase() + credentials.username.slice(1),
            email: `${credentials.username}@anterior.ae`,
            role: credentials.username.toLowerCase().includes('anes') ? 'anesthesiologist' : 'coordinator',
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
  secret: process.env.NEXTAUTH_SECRET || 'anterior-health-sovereign-pac-demo-secret-2026',
};
