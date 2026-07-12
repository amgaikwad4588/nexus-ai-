"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  RefreshCw,
  RotateCw,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" />
          DPoP Implementation Test
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify key generation, proof signing, and rotation for sender-constrained tokens
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={runTest} disabled={status === "testing"}>
          {status === "testing" ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1" />
          )}
          Re-run Full Test
        </Button>
        <Button size="sm" variant="outline" onClick={testRotation} disabled={status === "testing"}>
          <RotateCw className="w-4 h-4 mr-1" />
          Test Key Rotation
        </Button>
        <Button size="sm" variant="destructive" onClick={testClear} disabled={status === "testing"}>
          <Trash2 className="w-4 h-4 mr-1" />
          Clear Keys &amp; Regenerate
        </Button>
      </div>

      {/* Rotation period */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-muted-foreground" htmlFor="rotation-period">
          Rotation Period (ms):
        </label>
        <Input
          id="rotation-period"
          type="number"
          value={rotationPeriod}
          onChange={(e) => setRotationPeriodState(Number(e.target.value))}
          className="w-48"
        />
        <span className="text-sm text-muted-foreground">
          ({Math.round(rotationPeriod / 1000 / 60)} minutes)
        </span>
      </div>

      {status === "testing" && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running DPoP test...
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="flex items-center gap-2 text-sm font-medium text-green-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              DPoP Implementation Working
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{key}</span>
                  {value.includes("{") ? (
                    <pre className="bg-accent/20 border border-border/30 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                      {value}
                    </pre>
                  ) : (
                    <code className="bg-accent/20 border border-border/30 p-2 rounded-lg text-xs font-mono break-all">
                      {value}
                    </code>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                How DPoP Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Generate EC P-256 key pair using Web Crypto API</li>
                <li>2. Create DPoP proof JWT with htm (method), htu (URL), jti, iat claims</li>
                <li>3. Bind access token hash (ath) for sender-constraining</li>
                <li>4. Sign with private key using ES256</li>
                <li>5. Include proof in requests via DPoP-Signature header</li>
                <li>6. Keys auto-rotate every 24 hours (configurable)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-yellow-400">
                <Shield className="w-4 h-4" />
                Security Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Prevents token theft attacks (attacker needs private key)</li>
                <li>Sender-constrained tokens (binds token to specific client)</li>
                <li>Fresh key proof for each request (replay protection via jti)</li>
                <li>Automatic rotation reduces key compromise window</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {status === "error" && (
        <Card className="bg-destructive/5 border-destructive/30">
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <XCircle className="w-4 h-4 shrink-0" />
              Test Failed
            </div>
            <code className="text-xs font-mono text-destructive/80 break-all">{error}</code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
