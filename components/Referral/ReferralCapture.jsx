"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../utils/api";
import { getReferralSessionKey, setStoredReferralCode } from "../../utils/referral";

function ReferralCaptureInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("ref");

  useEffect(() => {
    if (!code) return;

    getReferralSessionKey();

    const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";

    api
      .get(`/api/v1/${apiType}/referral/check`, { params: { code } })
      .then((res) => {
        if (res.data?.data?.eligible) {
          setStoredReferralCode(code);
        }
      })
      .catch(() => {
        // Invalid/ineligible/self-referral codes are simply not stored.
      });
  }, [code]);

  return null;
}

export default function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner />
    </Suspense>
  );
}
