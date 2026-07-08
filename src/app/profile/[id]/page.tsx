import React, { Suspense } from 'react';
import { ProfileContainer } from '@/components/profile/ProfileContainer';

export default function ProfileIdPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={null}>
      <ProfileContainer targetUserId={params.id} />
    </Suspense>
  );
}
