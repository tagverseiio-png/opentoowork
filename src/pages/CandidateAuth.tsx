import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, Eye, EyeOff, MapPin, ChevronsUpDown, Check, CheckCircle } from "lucide-react";
import usaCities from "@/lib/usa_cities_cleaned.json";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import ReCAPTCHA from "react-google-recaptcha";

const ALL_LOCATIONS = [
  "Remote (US)",
  ...usaCities.map(c => c.state_code ? `${c.city}, ${c.state_code}` : c.city)
];

const CandidateAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/dashboard";
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

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
        navigate(returnTo, { replace: true });
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
      await supabase.auth.signOut(); // History cleanup for seamless re-registration
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            location: userLocation,
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
      navigate(returnTo);

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

  // Standard Login
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase.auth.signOut(); // History cleanup
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (user) {
        // Silently reactivate soft-deleted accounts
        await supabase.from("candidate_profiles").update({ is_active: true }).eq("user_id", user.id);
      }
      toast({ title: "Welcome back!" });
      navigate(returnTo);

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
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <label htmlFor="captcha-in-cand" className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group cursor-pointer">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-in-cand" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-muted-foreground group-hover:text-foreground">Candidate Security protocol</span>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </label>
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
                  <Label htmlFor="signup-location">Location</Label>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={locationOpen}
                        className="w-full justify-between h-10 font-normal text-foreground bg-background hover:bg-background"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className={`truncate ${!userLocation && "text-muted-foreground"}`}>
                            {userLocation || "Search U.S. cities / Remote..."}
                          </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 shadow-2xl rounded-xl" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search U.S. cities..." 
                          className="h-9"
                          value={locationSearch}
                          onValueChange={setLocationSearch}
                        />
                        <CommandList className="max-h-60">
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup>
                            {ALL_LOCATIONS
                              .filter(loc => 
                                loc.toLowerCase().includes(locationSearch.toLowerCase())
                              )
                              .slice(0, 100)
                              .map((loc) => (
                              <CommandItem
                                key={loc}
                                value={loc}
                                onSelect={(currentValue) => {
                                  setUserLocation(loc);
                                  setLocationOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    userLocation === loc ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {loc}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <label htmlFor="captcha-up-cand" className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group cursor-pointer">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-up-cand" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-muted-foreground group-hover:text-foreground">Candidate Security protocol</span>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </label>
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