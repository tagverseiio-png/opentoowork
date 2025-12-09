import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, ArrowLeft } from "lucide-react";

const EmployerAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false); // New state for OTP view
  
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(""); // New state for OTP

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
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
          </form>
        ) : (
          /* Standard Tabs */
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
                <Button className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

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