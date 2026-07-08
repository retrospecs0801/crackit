import React, { Suspense } from 'react';
import { ProfileContainer } from '@/components/profile/ProfileContainer';

export default function ProfilePage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  return (
    <Suspense fallback={null}>
      <ProfileContainer targetUserId={searchParams?.id} />
    </Suspense>
  );
}
