import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, CheckCircle } from "lucide-react";

const EmployerAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false); // New state for OTP view
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(""); // New state for OTP
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
  }, []);

  // STEP 1: Sign Up (Triggers Email)
  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // We pass the company details in 'options.data' so the Database Trigger
      // can automatically create the employer_profile row.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "employer",
            company_name: companyName,
            company_website: companyWebsite,
            location: location,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Verification code sent to your email!" });
      setShowOtpInput(true);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

      toast({ title: "Employer account verified!" });
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
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      toast({ title: "Verification code resent!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back employer!" });
      navigate("/dashboard");
    }

    setLoading(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3 mb-8">
          {showOtpInput ? (
            <Mail className="h-12 w-12 text-primary" />
          ) : (
            <Briefcase className="h-12 w-12 text-primary" />
          )}
          <h1 className="text-3xl font-bold">
            {showOtpInput ? "Verify Email" : "Employer Portal"}
          </h1>
          <p className="text-muted-foreground text-center">
            {showOtpInput 
              ? `Enter the code sent to ${email}` 
              : "Post jobs and hire talented candidates"}
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
            <p className="text-sm text-center text-muted-foreground mt-4">
              Check Inbox / Spam / Junk folders.
            </p>
            <Button type="button" variant="outline" className="w-full mt-2" onClick={handleResendOtp} disabled={loading}>
              Resend Code
            </Button>
          </form>
        ) : showForgotPassword ? (
          /* Forgot Password View */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {resetEmailSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">Link has been sent and Check in spam or junk folders as well.</p>
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
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  value={password}
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-in-emp" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <Label htmlFor="captcha-in-emp" className="text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer flex-1 text-muted-foreground group-hover:text-foreground">Employer Security protocol</Label>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </div>

                <Button className="w-full" disabled={loading}>
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
              <form onSubmit={handleSignUp} className="space-y-3">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

                <Label>Company Website</Label>
                <Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." required />

                <Label>Company Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} required />

                <Label>Email</Label>
                <Input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />

                <Label>Password</Label>
                <Input
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-up-emp" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <Label htmlFor="captcha-up-emp" className="text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer flex-1 text-muted-foreground group-hover:text-foreground">Corporate Verification Active</Label>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </div>

                <Button className="w-full" disabled={loading}>
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

export default EmployerAuth;