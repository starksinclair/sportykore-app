import { useMutation } from "@tanstack/react-query";

import { postRequestOtp, type RequestOtpInput } from "./auth-api";
import { useAuth } from "./use-auth";

export function useRequestOtp() {
  return useMutation({
    mutationFn: (input: RequestOtpInput) => postRequestOtp(input),
  });
}

export function useVerifyOtp() {
  const { completeOtpVerification } = useAuth();
  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      completeOtpVerification(input),
  });
}

export function useRecoverAccount() {
  const { recoverAccount } = useAuth();
  return useMutation({
    mutationFn: (recoveryEmail: string) => recoverAccount(recoveryEmail),
  });
}
