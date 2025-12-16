import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Detect recovery redirect from Supabase (# or ? type=recovery) and set session if tokens are present
    const handleRecovery = async () => {
      try {
        const rawHash = window.location.hash.replace(/^#/, "");
        // Normalize hashes like `#type=recovery#access_token=...` -> `type=recovery&access_token=...`
        const normalizedHash = rawHash.replace(/#/g, "&");
        const hashParams = new URLSearchParams(normalizedHash);
        const searchParams = new URLSearchParams(window.location.search);
        const type = hashParams.get("type") || searchParams.get("type");

        const access_token = hashParams.get("access_token") || searchParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token");
        const tokenParam = searchParams.get("token") || hashParams.get("token");
        const error = hashParams.get("error") || searchParams.get("error");
        const error_description = hashParams.get("error_description") || searchParams.get("error_description");

        // Surface any error provided by Supabase (e.g., otp_expired)
        if (error) {
          const desc = error_description ? decodeURIComponent(error_description) : error;
          setErrorMessage(desc.replace(/\+/g, " "));
          setShowForm(false);
          setSessionMissing(true);
          try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { /* ignore */ }
          return;
        }

        if (access_token) {
          // Explicitly set session from tokens in URL in case detectSessionInUrl didn't pick it up
          await supabase.auth.setSession({ access_token, refresh_token });
          setShowForm(true);
          // Clean up url
          try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { /* ignore */ }
          return;
        }

        // Some Supabase redirects provide a one-time 'token' param instead of access_token; try to verify it
        if (tokenParam) {
          try {
            const { error: verifyError } = await supabase.auth.verifyOtp({ token: tokenParam, type: 'recovery' } as any);
            if (verifyError) {
              setErrorMessage(verifyError.message || 'Invalid or expired link.');
              setShowForm(false);
              setSessionMissing(true);
            } else {
              // If verification succeeded, session should be available
              const { data: { session } } = await supabase.auth.getSession();
              if (session) setShowForm(true);
              else {
                // Sometimes session isn't set immediately; still show form and let user try
                setShowForm(true);
              }
            }
          } catch (e: any) {
            setErrorMessage(e?.message || 'Invalid or expired link.');
            setShowForm(false);
            setSessionMissing(true);
          } finally {
            try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { /* ignore */ }
          }
          return;
        }

        if (type === "recovery") {
          // session may have been set automatically by the client; check
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setShowForm(true);
            try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { /* ignore */ }
          } else {
            // No active session found; inform the user to retry the link
            setShowForm(true);
            setSessionMissing(true);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    handleRecovery();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      // Ensure there's an active session; if missing, instruct the user to re-open the email link
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSessionMissing(true);
        toast({ title: "Session missing", description: "No active session found. Please reopen the password reset link from your email.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      // Sign-out to ensure old sessions aren't reused
      try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }

      // Show inline success confirmation and provide clear next steps
      setShowForm(false);
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Use the link from your email to set a new password securely.</p>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            {sessionMissing && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">No active session was detected from the link. Please reopen the reset link from your email (or try the "Reload" button).</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Set New Password"}
            </Button>
          </form>
        ) : success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">Password updated successfully. You can now sign in with your new password.</p>
            </div>
            <div className="pt-2">
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/', { replace: true })}>Go Home</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">Open this page from the password reset link in your email. If you landed here directly, use the "Forgot Password" flow in your account sign-in page to receive the reset link.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/', { replace: true })}>Go Home</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
