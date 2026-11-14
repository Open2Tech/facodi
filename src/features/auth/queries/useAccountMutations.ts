import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset, resendEmailChange, signOutOtherSessions, updateAccount, updateUserPassword } from '@/entities/auth/auth.api';

export function useUpdateAccount() {
  return useMutation({ mutationFn: updateAccount, gcTime: 0 });
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updateUserPassword, gcTime: 0 });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset, gcTime: 0 });
}

export function useResendEmailChange() {
  return useMutation({ mutationFn: resendEmailChange, gcTime: 0 });
}

export function useSignOutOtherSessions() {
  return useMutation({ mutationFn: signOutOtherSessions, gcTime: 0 });
}
