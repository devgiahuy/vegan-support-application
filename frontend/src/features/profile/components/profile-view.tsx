import * as React from 'react';
import { CalendarDays, Mail, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DetailedProfile } from '../types/profile.model';
import { UserRole } from '@/common/enums';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MEMBER]: 'Thành viên',
  [UserRole.CONTRIBUTOR]: 'Contributor',
  [UserRole.ADMIN]: 'Quản trị viên',
};

/**
 * Khối thông tin hồ sơ cơ bản. Nhận `DetailedProfile` (Model), không đọc DTO.
 * Các khối sức khỏe/diet render qua slot để page ghép.
 */
export function ProfileView({
  profile,
  healthSlot,
  dietSlot,
}: {
  profile: DetailedProfile;
  healthSlot?: React.ReactNode;
  dietSlot?: React.ReactNode;
}) {
  const { user } = profile;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ của tôi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
            <AvatarFallback className="bg-primary/10 text-xl text-primary">
              {user.initials || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{user.displayName}</h2>
              <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Tham gia: {profile.memberSince}
            </p>
            {user.contributorApplication && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Đơn contributor: {user.contributorApplication.rawStatus} ·{' '}
                {user.contributorApplication.requestedTypeLabel}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {healthSlot}
      {dietSlot}
    </div>
  );
}
