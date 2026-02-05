import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: 'jwt',
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          age: user.age,
        };
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          // Set default plan and age for new Google users
          if (existingUser) {
            const updates: any = {};
            
            if (!existingUser.plan) {
              updates.plan = 'free';
            }
            
            // If dateOfBirth exists but age doesn't, calculate it
            if (existingUser.dateOfBirth && !existingUser.age) {
              updates.age = calculateAge(existingUser.dateOfBirth);
            }
            
            if (Object.keys(updates).length > 0) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: updates,
              });
            }
          }
        }
      }
      return true;
    },
    
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { plan: true, age: true, dateOfBirth: true },
        });
        
        token.plan = dbUser?.plan || 'free';
        token.age = dbUser?.age || calculateAge(dbUser?.dateOfBirth || null) || null;
      }
      
      if (trigger === 'update' && session) {
        token.plan = session.plan;
        token.age = session.age;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).plan = token.plan || 'free';
        (session.user as any).age = token.age || null;
      }
      return session;
    },
  },
  
  events: {
    async linkAccount({ user, account, profile }) {
      if (account.provider === 'google') {
        const updates: any = {
          plan: user.plan || 'free',
          emailVerified: new Date(),
        };
        
        // If we have dateOfBirth, calculate age
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { dateOfBirth: true },
        });
        
        if (existingUser?.dateOfBirth) {
          updates.age = calculateAge(existingUser.dateOfBirth);
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    },
  },
});
