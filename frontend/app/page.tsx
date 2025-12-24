import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard (or onboarding if no profile exists)
  redirect('/dashboard');
}

