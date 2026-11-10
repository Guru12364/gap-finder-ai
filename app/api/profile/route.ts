export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error reading profiles table:', error.message);
    }

    if (profile) {
      return NextResponse.json({ data: profile });
    }

    // If profile does not exist yet in database, construct from auth session & create it
    const defaultName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Student';

    const fallbackProfile: UserProfile = {
      id: user.id,
      email: user.email || '',
      full_name: defaultName,
      avatar_url: user.user_metadata?.avatar_url || undefined,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    };

    try {
      await supabase.from('profiles').insert({
        id: fallbackProfile.id,
        email: fallbackProfile.email,
        full_name: fallbackProfile.full_name,
        avatar_url: fallbackProfile.avatar_url || null,
      });
    } catch (insertErr) {
      // Ignore if table insert fails due to specific triggers
    }

    return NextResponse.json({ data: fallbackProfile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name } = body;

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return NextResponse.json(
        { error: 'full_name is required' },
        { status: 400 }
      );
    }

    const trimmedName = full_name.trim();

    // Update auth user metadata
    try {
      await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });
    } catch (authErr) {
      console.warn('Failed to update auth metadata:', authErr);
    }

    // Upsert profiles table
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      // Fallback: return updated object directly if table update issues occur
      return NextResponse.json({
        data: {
          id: user.id,
          email: user.email || '',
          full_name: trimmedName,
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ data: updatedProfile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
