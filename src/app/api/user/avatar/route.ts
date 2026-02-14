// ============================================================
// FILE: src/app/api/user/avatar/route.ts
// Handles avatar uploads. Stores as base64 data URI in user.image
// (works with no extra storage config).
// For production: swap to S3/Cloudflare R2 upload.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Max 2 MB, stored as base64 data URI
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 2 MB' }, { status: 400 });
    }

    // Convert to base64 data URI
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Save to user.image
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: dataUri },
    });

    console.log(`✅ Avatar updated for user ${session.user.id}`);

    return NextResponse.json({ url: dataUri });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// ============================================================
// ⬆️ UPGRADE: Store in S3/R2 instead of base64
// Replace the base64 section above with:
//
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// const s3 = new S3Client({ region: process.env.AWS_REGION });
//
// const key = `avatars/${session.user.id}-${Date.now()}`;
// await s3.send(new PutObjectCommand({
//   Bucket: process.env.AWS_S3_BUCKET,
//   Key: key,
//   Body: Buffer.from(bytes),
//   ContentType: file.type,
//   ACL: 'public-read',
// }));
// const url = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
// await prisma.user.update({ where: { id: session.user.id }, data: { image: url } });
// return NextResponse.json({ url });
// ============================================================
