import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentUserQuery, useLoginMutation, useLogoutMutation } from '../queries/auth.queries';

export function useAuth() {
  const { user, token, isAuthenticated } = useAuthStore();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const userQuery = useCurrentUserQuery();

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    isLoadingUser: userQuery.isLoading,
  };
}
