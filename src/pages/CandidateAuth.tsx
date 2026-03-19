import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, CheckCircle } from "lucide-react";

const CandidateAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "candidate") {
        navigate("/dashboard", { replace: true });
      }
    };

    checkRole();
  }, []);

  // STEP 1: Sign Up (Triggers Email)
  const handleSignUp = async (e: any) => {
    e.preventDefault();
    
    // Validate Phone Number for Country Code
    if (!phone.startsWith("+")) {
      toast({
        title: "Invalid Phone Number",
        description: "Please include your country code (e.g., +1 for USA).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: "candidate",
          },
        },
      });

      if (error) throw error;

      toast({ title: "Verification code sent to your email!" });
      setShowOtpInput(true); 

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) throw error;

      toast({ title: "Email verified successfully!" });
      navigate("/dashboard");

    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Standard Login
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast({ title: "Welcome back!" });
      navigate("/dashboard");

    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset#type=recovery`,
      });

      if (error) throw error;

      toast({ title: "Password reset link sent to your email!" });
      setResetEmailSent(true);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/40">

        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            {showOtpInput ? <Mail className="h-10 w-10 text-primary-foreground" /> : <UserCircle className="h-10 w-10 text-primary-foreground" />}
          </div>
          <h1 className="text-3xl font-bold">
            {showOtpInput ? "Verify Email" : (isSignup ? "Create Account" : "Candidate Login")}
          </h1>
          <p className="text-muted-foreground text-center">
            {showOtpInput ? `Enter the code sent to ${email}` : "Get started and apply for jobs instantly!"}
          </p>
        </div>

        {showOtpInput ? (
          /* OTP Verification View */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Label>Verification Code</Label>
            <Input 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              placeholder="xxxxxx"
              className="text-center text-lg tracking-widest"
              required 
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying..." : "Verify & Login"}
            </Button>
          </form>
        ) : showForgotPassword ? (
          /* Forgot Password View */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {resetEmailSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">Link has been sent and Check in spam or junk folders as well. Click the link to reset your password.</p>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    setResetEmail("");
                  }}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                <Label>Email Address</Label>
                <Input 
                  type="email"
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  placeholder="your@email.com"
                  required 
                />
                <p className="text-sm text-muted-foreground">We'll send you a link to reset your password.</p>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </>
            )}
          </form>
        ) : (
          <Tabs
            value={isSignup ? "signup" : "signin"}
            onValueChange={(v) => setIsSignup(v === "signup")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Label>Password</Label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <Button 
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input 
                    id="signup-name" 
                    placeholder="Jane Doe" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input 
                    id="signup-phone" 
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="jane@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                
                <Label>Password</Label>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-up-cand" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <Label htmlFor="captcha-up-cand" className="text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer flex-1 text-muted-foreground group-hover:text-foreground">Secure Onboarding Verified</Label>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Sending Code..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default CandidateAuth;