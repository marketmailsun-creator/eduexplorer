import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Clear all group-related caches
    revalidatePath('/groups', 'layout');
    revalidatePath('/groups', 'page');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}