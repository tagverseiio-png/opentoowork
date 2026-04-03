import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, MapPin, ChevronsUpDown, Check, Eye, EyeOff, CheckCircle } from "lucide-react";
import usaCities from "@/lib/usa_cities_cleaned.json";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import ReCAPTCHA from "react-google-recaptcha";

const ALL_LOCATIONS = [
  "Remote (US)",
  ...usaCities.map(c => c.state_code ? `${c.city}, ${c.state_code}` : c.city)
];

const EmployerAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false); // New state for OTP view
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [recruiterJobTitle, setRecruiterJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(""); // New state for OTP
  const [resetEmail, setResetEmail] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
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

    if (!recruiterJobTitle.trim() || !linkedinUrl.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Job title and LinkedIn URL are mandatory.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await supabase.auth.signOut(); // History cleanup for seamless re-registration
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
            phone: phone,
            recruiter_job_title: recruiterJobTitle,
            linkedin_url: linkedinUrl,
          },
        },
      });

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from("employer_profiles")
          .update({
            recruiter_job_title: recruiterJobTitle,
            linkedin_url: linkedinUrl,
          })
          .eq("user_id", session.user.id);
      }

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
    
    await supabase.auth.signOut(); // Ensure clean login state

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (user) {
      // If the account was soft-deleted, reactivate it silently upon login
      await supabase.from("employer_profiles").update({ is_active: true }).eq("user_id", user.id);
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <label htmlFor="captcha-in-emp" className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group cursor-pointer">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-in-emp" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-muted-foreground group-hover:text-foreground">Employer Security protocol</span>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </label>

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
                        <span className={`truncate ${!location && "text-muted-foreground"}`}>
                          {location || "Search U.S. cities / Remote..."}
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
                                setLocation(loc);
                                setLocationOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  location === loc ? "opacity-100" : "opacity-0"
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

                <Label>Contact Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" required />

                <Label>Recruiter Job Title</Label>
                <Input value={recruiterJobTitle} onChange={(e) => setRecruiterJobTitle(e.target.value)} placeholder="e.g. Senior Recruiter" required />

                <Label>LinkedIn URL</Label>
                <Input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." required />

                <Label>Email</Label>
                <Input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />

                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <label htmlFor="captcha-up-emp" className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 my-6 shadow-inner group cursor-pointer">
                  <div className="w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center bg-background group-hover:border-primary transition-colors">
                    <input type="checkbox" id="captcha-up-emp" required className="w-4 h-4 opacity-0 absolute cursor-pointer" />
                    <CheckCircle className="h-4 w-4 text-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-muted-foreground group-hover:text-foreground">Corporate Verification Active</span>
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-6 w-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </label>

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