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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Generator Requests Log</h1>
          <p className="text-muted-foreground">
            A log of your mock-record-generation requests
          </p>
        </div>
      </div>

      <EventsList />
    </div>
  );
} 