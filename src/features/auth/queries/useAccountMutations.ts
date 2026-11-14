import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset, updateAccount, updateUserPassword } from '@/entities/auth/auth.api';

export function useUpdateAccount() {
  return useMutation({ mutationFn: updateAccount, gcTime: 0 });
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updateUserPassword, gcTime: 0 });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset, gcTime: 0 });
}
