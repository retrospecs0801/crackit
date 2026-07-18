import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden. You can only upload your own avatar.' }, { status: 403 });
    }

    const supabaseAdmin = createAdminClient();

    // Ensure bucket exists right away (auto-create if missing)
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const avatarsBucket = buckets?.find((b) => b.name === 'avatars');
      if (!avatarsBucket) {
        await supabaseAdmin.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
      }
    } catch (bucketErr) {
      console.warn('[Avatar Upload] Bucket check/creation warning:', bucketErr);
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('[Avatar Upload] Admin upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);

    return NextResponse.json({ publicUrl: data.publicUrl });
  } catch (error: unknown) {
    console.error('[Avatar Upload] Fatal error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
