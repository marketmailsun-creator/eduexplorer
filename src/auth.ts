import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { verifyOtp, normalizePhone } from '@/lib/services/otp.service';
import { getAdminAuth } from '@/lib/firebase/firebase-admin';

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
    signIn: '/phone-login',
    error: '/phone-login',
  },
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,  // ← ADD THIS ONE LINE
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

    // ── Phone OTP provider ─────────────────────────────────────────────────
    // Handles both login (existing phone users) and signup (new phone users).
    // For signup, the client sends name, email, dob, and plan alongside phone+code.
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        code: { label: 'OTP Code', type: 'text' },
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
        dob: { label: 'Date of Birth', type: 'text' },
        plan: { label: 'Plan', type: 'text' },
      },
      async authorize(credentials) {
        const phone = normalizePhone(credentials?.phone as string);
        const code = credentials?.code as string;

        if (!phone || !code) return null;

        // Verify OTP against Redis (consumes the OTP on success)
        const result = await verifyOtp(phone, code);
        if (!result.success) return null;

        // Try to find an existing user by phone number
        let user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
          // ── Signup flow: create a new user ──────────────────────────────
          const name = (credentials?.name as string)?.trim() || 'User';
          const email = (credentials?.email as string)?.trim().toLowerCase();
          const dob = credentials?.dob as string;
          const plan = (credentials?.plan as string) || 'free';

          if (!email) return null; // email required for phone signup

          // Check email is not already taken
          const emailTaken = await prisma.user.findUnique({ where: { email } });
          if (emailTaken) return null;

          const birthDate = dob ? new Date(dob) : null;
          const age = birthDate ? calculateAge(birthDate) : null;

          user = await prisma.user.create({
            data: {
              phone,
              phoneVerified: new Date(),
              name,
              email,
              // Mark email as verified since we verified identity via phone OTP
              emailVerified: new Date(),
              dateOfBirth: birthDate,
              age,
              plan,
            },
          });

          await prisma.userPreferences.create({
            data: {
              userId: user.id,
              learningLevel: 'college',
              preferredVoice: 'professional',
              autoAudio: false,
              theme: 'light',
            },
          });
        } else {
          // ── Login flow: update phoneVerified timestamp ──────────────────
          await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: new Date() },
          });
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

    // ── Firebase Phone Auth provider ────────────────────────────────────────
    // Accepts a Firebase ID token (verified client-side by Firebase).
    // Server verifies the token with Firebase Admin SDK, then finds or creates
    // the user in Prisma. No Twilio/DLT registration required.
    CredentialsProvider({
      id: 'firebase-phone',
      name: 'Firebase Phone',
      credentials: {
        idToken: { label: 'Firebase ID Token', type: 'text' },
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
        dob: { label: 'Date of Birth', type: 'text' },
        plan: { label: 'Plan', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        const adminAuth = getAdminAuth();
        if (!adminAuth) return null; // Firebase Admin not configured

        // 1. Verify the Firebase ID token server-side
        let decodedToken;
        try {
          decodedToken = await adminAuth.verifyIdToken(credentials.idToken as string);
        } catch {
          return null; // Invalid or expired token
        }

        const phone = decodedToken.phone_number;
        if (!phone) return null; // Token must have phone_number claim

        // 2. LOGIN flow: find existing user by phone
        const existingUser = await prisma.user.findUnique({ where: { phone } });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { phoneVerified: new Date() },
          });
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            image: existingUser.image,
            plan: existingUser.plan,
            age: existingUser.age,
          };
        }

        // 3. SIGNUP flow: create new user — requires name + email + dob
        const nameVal = (credentials?.name as string)?.trim();
        const emailVal = (credentials?.email as string)?.trim().toLowerCase();
        const dobVal = credentials?.dob as string;
        const planVal = (credentials?.plan as string) || 'free';

        if (!nameVal || !emailVal || !dobVal) return null;

        // Check email uniqueness
        const emailTaken = await prisma.user.findUnique({ where: { email: emailVal } });
        if (emailTaken) throw new Error('email_taken');

        const dobDate = new Date(dobVal);
        const age = calculateAge(dobDate);
        if (age !== null && age < 13) throw new Error('age_restriction');

        const newUser = await prisma.user.create({
          data: {
            name: nameVal,
            email: emailVal,
            phone,
            phoneVerified: new Date(),
            emailVerified: new Date(), // Phone OTP = identity verified
            dateOfBirth: dobDate,
            age,
            plan: planVal === 'pro' ? 'pro' : 'free',
          },
        });

        await prisma.userPreferences.create({
          data: {
            userId: newUser.id,
            learningLevel: 'college',
            preferredVoice: 'professional',
            autoAudio: false,
            theme: 'light',
          },
        });

        // Send welcome email (non-blocking — never fail signup on email error)
        try {
          const { sendWelcomeEmail } = await import('@/lib/services/email.service');
          await sendWelcomeEmail(emailVal, nameVal);
          console.log('[Auth] Welcome email sent to', emailVal);
        } catch (emailErr) {
          console.error('[Auth] Welcome email failed (non-fatal):', emailErr);
        }

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          image: newUser.image,
          plan: newUser.plan,
          age: newUser.age,
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
      
      if (trigger === 'update') {
        // Always re-read plan from DB on session update so post-subscription
        // changes are reflected without requiring the caller to pass plan data.
        // This makes update() (called without args from success page) work correctly.
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true },
        });
        token.plan = freshUser?.plan || 'free';
        // Still allow callers to update age if they pass it
        if (session?.age !== undefined) token.age = session.age;
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
