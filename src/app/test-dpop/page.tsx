"use client";

import { useEffect, useState } from "react";
import {
  getOrCreateDPoPKeyPair,
  createDPoPProof,
  isKeyExpired,
  getKeyAge,
  getTimeUntilRotation,
  rotateDPoPKey,
  clearDPoPKeys,
  setRotationPeriod,
} from "@/lib/dpop";

export default function TestDPoPPage() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [rotationPeriod, setRotationPeriodState] = useState<number>(24 * 60 * 60 * 1000);

  const runTest = async () => {
    setStatus("testing");
    setResults({});
    setError("");

    try {
      setRotationPeriod(rotationPeriod);
      console.log(`[Test] Using rotation period: ${rotationPeriod}ms`);

      const keyPair = await getOrCreateDPoPKeyPair();
      setResults((prev) => ({
        ...prev,
        "Key ID": keyPair.keyId,
        "Public Key Type": keyPair.publicKey.kty || "unknown",
        "Public Key Curve": keyPair.publicKey.crv || "unknown",
        "Key Created At": new Date(keyPair.createdAt).toISOString(),
        "Key Age": `${Math.round(getKeyAge(keyPair) / 1000)}s`,
        "Time Until Rotation": `${Math.round(getTimeUntilRotation(keyPair) / 1000)}s`,
        "Key Expired": isKeyExpired(keyPair) ? "Yes" : "No",
      }));

      const proof = await createDPoPProof("POST", "https://example.com/oauth/token", "test-access-token");
      
      const parts = proof.proof.split(".");
      setResults((prev) => ({
        ...prev,
        "DPoP Header (decoded)": JSON.stringify(JSON.parse(atob(parts[0])), null, 2),
        "DPoP Payload (decoded)": JSON.stringify(JSON.parse(atob(parts[1])), null, 2),
        "DPoP-Signature Header": proof.header,
      }));

      const apiTestUrl = "/api/test-dpop-binding";
      const apiProof = await createDPoPProof("GET", apiTestUrl);
      setResults((prev) => ({
        ...prev,
        "API Test Proof Header": apiProof.header,
      }));

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const testRotation = async () => {
    setStatus("testing");
    try {
      console.log("[Test] Testing key rotation...");
      const newKey = await rotateDPoPKey();
      setResults((prev) => ({
        ...prev,
        "Rotation Test": `New key generated: ${newKey.keyId}`,
        "Rotation Time": new Date().toISOString(),
      }));
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const testClear = () => {
    clearDPoPKeys();
    setResults((prev) => ({
      ...prev,
      "Clear Test": "Keys cleared successfully",
    }));
    runTest();
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">DPoP Implementation Test</h1>

        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={runTest}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            Re-run Full Test
          </button>
          <button
            onClick={testRotation}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Test Key Rotation
          </button>
          <button
            onClick={testClear}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Clear Keys & Regenerate
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Rotation Period (ms):</label>
          <input
            type="number"
            value={rotationPeriod}
            onChange={(e) => setRotationPeriodState(Number(e.target.value))}
            className="bg-[#1a1a2e] border border-gray-700 rounded px-4 py-2 w-64"
          />
          <span className="ml-2 text-gray-500">
            ({Math.round(rotationPeriod / 1000 / 60)} minutes)
          </span>
        </div>

        {status === "testing" && (
          <div className="text-center py-12 text-gray-400">Running DPoP test...</div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <span>✓</span> DPoP Implementation Working
              </div>
            </div>

            <div className="bg-[#0a0a0f] rounded-lg p-6 space-y-4">
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-gray-400 text-sm font-medium">{key}</span>
                  {value.includes("{") ? (
                    <pre className="bg-[#1a1a2e] p-3 rounded text-xs overflow-x-auto">
                      {value}
                    </pre>
                  ) : (
                    <code className="bg-[#1a1a2e] p-2 rounded text-sm break-all">{value}</code>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <h3 className="text-blue-400 font-medium mb-2">How DPoP Works:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>1. Generate EC P-256 key pair using Web Crypto API</li>
                <li>2. Create DPoP proof JWT with htm (method), htu (URL), jti, iat claims</li>
                <li>3. Bind access token hash (ath) for sender-constraining</li>
                <li>4. Sign with private key using ES256</li>
                <li>5. Include proof in requests via DPoP-Signature header</li>
                <li>6. Keys auto-rotate every 24 hours (configurable)</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <h3 className="text-yellow-400 font-medium mb-2">Security Benefits:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Prevents token theft attacks (attacker needs private key)</li>
                <li>• Sender-constrained tokens (binds token to specific client)</li>
                <li>• Fresh key proof for each request (Replay protection via jti)</li>
                <li>• Automatic rotation reduces key compromise window</li>
              </ul>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <div className="text-red-400 font-medium">Test Failed</div>
            <code className="text-red-300 text-sm">{error}</code>
          </div>
        )}
      </div>
    </div>
  );
}
