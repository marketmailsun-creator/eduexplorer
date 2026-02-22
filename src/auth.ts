// src/auth.ts — REPLACE EXISTING
// Changes:
//   - Removed GoogleProvider (all Google OAuth removed)
//   - Kept CredentialsProvider for email/password (existing users)
//   - Phone auth uses its own JWT cookie via /api/auth/phone/verify-otp
//   - JWT callbacks read phone field

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  providers: [
    // Keep for existing email/password users during transition
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const match = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!match) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          image: user.image,
          plan:  user.plan,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { plan: true, phone: true },
        });
        token.plan  = dbUser?.plan  || 'free';
        token.phone = dbUser?.phone || null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id            = token.id as string;
        (session.user as any).plan  = token.plan  || 'free';
        (session.user as any).phone = token.phone || null;
      }
      return session;
    },
  },
});
