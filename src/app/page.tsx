import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  // If user is already logged in, go to explore page
  if (session) {
    redirect('/explore');
  }

  // If not logged in, redirect to login page
  redirect('/login');
}
