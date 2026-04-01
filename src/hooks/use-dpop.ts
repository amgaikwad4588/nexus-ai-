"use client";

import { useState, useCallback, useEffect } from "react";
import { createDPoPProof, getOrCreateDPoPKeyPair, DPoPKeyPair } from "@/lib/dpop";

export function useDPoP() {
  const [keyPair, setKeyPair] = useState<DPoPKeyPair | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    getOrCreateDPoPKeyPair().then((kp) => {
      setKeyPair(kp);
      setIsInitialized(true);
    });
  }, []);

  const signRequest = useCallback(
    async (method: string, url: string, accessToken?: string) => {
      if (!keyPair) {
        const kp = await getOrCreateDPoPKeyPair();
        setKeyPair(kp);
      }
      return createDPoPProof(method, url, accessToken);
    },
    [keyPair]
  );

  return {
    keyPair,
    isInitialized,
    signRequest,
    createProof: createDPoPProof,
  };
}

export function getDPoPHeaders(
  method: string,
  url: string,
  proof: string,
  keyId: string
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "DPoP-Signature": `DPoP kid="${keyId}", alg=ES256`,
    "DPoP-Proof": proof,
  };
}
