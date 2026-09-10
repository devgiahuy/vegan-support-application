import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginPayload } from '../api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  me: () => [...AUTH_QUERY_KEYS.all, 'me'] as const,
};

export const useCurrentUserQuery = () => {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me(),
    queryFn: async () => {
      const user = await authApi.getMe();
      setUser(user);
      return user;
    },
    enabled: !!token,
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (session) => {
      setSession(session.token, session.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), session.user);
      toast.success('Đăng nhập thành công!');
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success('Đã đăng xuất');
    },
  });
};
