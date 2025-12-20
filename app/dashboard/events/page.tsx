import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EventsList } from '@/app/dashboard/events/events-list';

export default async function EventsDashboard() {
  const session = await getServerSession(authOptions);
  
  // Redirect if not logged in!
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Log</p>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold leading-tight">Generator Requests Log</h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              A log of your mock-record-generation requests
            </p>
          </div>
        </section>
      </div>
      <EventsList />
    </div>
  );
} 