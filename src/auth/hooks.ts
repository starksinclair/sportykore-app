import { useMutation } from "@tanstack/react-query";

import { postRequestOtp } from "./auth-api";
import { useAuth } from "./use-auth";

export function useRequestOtp() {
  return useMutation({
    mutationFn: (email: string) => postRequestOtp(email),
  });
}

export function useVerifyOtp() {
  const { completeOtpVerification } = useAuth();
  return useMutation({
    mutationFn: (input: {
      email: string;
      code: string;
      name?: string;
      recoveryEmail?: string;
    }) => completeOtpVerification(input),
  });
}

export function useRecoverAccount() {
  const { recoverAccount } = useAuth();
  return useMutation({
    mutationFn: (recoveryEmail: string) => recoverAccount(recoveryEmail),
  });
}
