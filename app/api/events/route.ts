import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { recordGenerationEvent, recordUserActivity, getUserGenerationEvents } from '../../../lib/events';

// Records a new generation requests
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'anonymous';
  
  try {
    const data = await request.json();
    
    if (!data.type) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }
    
    if (data.type === 'generation') {
      const event = await recordGenerationEvent({
        userId,
        schemaId: data.schemaId,
        schemaName: data.schemaName,
        recordsCount: data.recordsCount,
        format: data.format,
        success: data.success,
        errorMessage: data.errorMessage,
      });
      
      return NextResponse.json({ success: true, event });
    }
    
    if (data.type === 'activity') {
      const event = await recordUserActivity({
        userId,
        action: data.action,
        details: data.details,
      });
      
      return NextResponse.json({ success: true, event });
    }
    
    return NextResponse.json(
      { error: 'Invalid event type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error recording event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

// Retrieves recent generation events
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const userId = session.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID not found in session' },
      { status: 400 }
    );
  }
  
  try {
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? parseInt(countParam) : 10;
    const events = await getUserGenerationEvents(userId, count);
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
} 