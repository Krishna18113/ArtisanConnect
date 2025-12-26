import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import LoginNavbar from '../components/LoginNavbar';
import riderImg from '../assets/rider.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'buyer',
    businessName: '', address: { street: '', city: '', state: '', zipCode: '' },
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('register');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  // const { register: authRegister, isAuthenticated, verifyOtp: authVerifyOtp } = useAuth();
  const {
  register: authRegister,
  resendOtp,
  isAuthenticated,
  verifyOtp: authVerifyOtp
} = useAuth();

  const { toast } = useToast();

  const emailRegex = /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/;

  if (isAuthenticated) return <Navigate to="/" replace />;

  const validateEmailFormat = (email) => {
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format.');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [addressField]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (field === 'email') validateEmailFormat(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!validateEmailFormat(formData.email)) return;

    setIsLoading(true);
    const { confirmPassword, ...rest } = formData;
    const userData = { ...rest, address: { ...formData.address } };
    const response = await authRegister(userData);
    if (response?.success) {
      setRegistrationEmail(formData.email);
      setStep('verifyOtp');
      toast({ title: "OTP Sent", description: response.message || "Check your email for OTP." });
    } else if (response?.message) {
      toast({ title: "Registration Error", description: response.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await authVerifyOtp(registrationEmail, otp);
    if (response?.success) {
      toast({ title: "Verification Successful", description: response.message || "Your email is verified!" });
    } else if (response?.message) {
      toast({ title: "Verification Failed", description: response.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  // const handleResendOtp = async () => {
  //   setIsLoading(true);
  //   const { confirmPassword, ...rest } = formData;
  //   const userData = { ...rest, email: registrationEmail, address: { ...formData.address } };
  //   const response = await authRegister(userData);
  //   if (response?.success) {
  //     toast({ title: "OTP Resent", description: response.message || "A new OTP has been sent." });
  //   } else if (response?.message) {
  //     toast({ title: "Error Resending OTP", description: response.message, variant: "destructive" });
  //   }
  //   setIsLoading(false);
  // };
  const handleResendOtp = async () => {
  if (isLoading) return;
  setIsLoading(true);

  const response = await resendOtp(registrationEmail);

  if (response?.success) {
    toast({
      title: "OTP Resent",
      description: response.message || "A new OTP has been sent."
    });
  } else if (response?.message) {
    toast({
      title: "Error Resending OTP",
      description: response.message,
      variant: "destructive"
    });
  }

  setIsLoading(false);
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-50 to-yellow-50">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 p-6 max-w-6xl w-full">

        {/* LEFT: Illustration + tagline */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg mb-6 lg:mb-0">
          <div className="relative w-64 h-64">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 space-y-2 pointer-events-none">
              <span className="block w-24 h-1 rounded-full bg-red-400/80 animate-trail" style={{ animationDelay: '0ms' }} />
              <span className="block w-16 h-1 rounded-full bg-red-300/70 animate-trail" style={{ animationDelay: '140ms' }} />
              <span className="block w-10 h-1 rounded-full bg-red-200/60 animate-trail" style={{ animationDelay: '280ms' }} />
            </div>
            <div className="relative w-64 h-64 animate-ride-in">
              <div className="relative w-full h-full rounded-full p-2 bg-gradient-to-tr from-white/60 to-white/20 shadow-2xl">
                <img
                  src={riderImg}
                  alt="Delivery Rider"
                  className="rounded-full border-4 border-white shadow-lg w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 rounded-full pointer-events-none">
                  <div className="absolute -inset-6 rounded-full blur-2xl bg-orange-300/30 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mt-6 mb-2 text-gray-800">From Local Hands to</h1>
          <h2 className="text-4xl font-extrabold text-red-600 mb-4">Global Hearts</h2>
          <p className="text-gray-600 max-w-sm">
            Sign up to get started with quick and delightful deliveries — intuitive dashboard for Arisans & Buyers.
          </p>
        </div>
        {/* RIGHT: Register Card */}
        <Card className="
   w-full max-w-xl
  flex-1
  shadow-2xl 
  bg-white/50 
  backdrop-blur-2xl 
  border border-white/30 
  rounded-2xl 
  relative 
  overflow-hidden
  transition-all
  hover:scale-105
  animate-card-pop
">
  <div className="absolute -z-10 hidden lg:block -left-24 top-8 w-90 h-40 rounded-full bg-red-200/30 blur-3xl" />
  <CardHeader className="pb-2">
    <CardTitle className="text-2xl">{step === 'register' ? 'Create Account' : 'Verify Your Email'}</CardTitle>
    <CardDescription className="text-sm">
      {step === 'register' 
        ? 'Join our network of vendors and suppliers.' 
        : 'An OTP has been sent to your email. Please enter it below.'}
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-3">
    {step === 'register' ? (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className={`flex items-center justify-center gap-2 rounded-md border p-2 cursor-pointer select-none text-sm ${formData.role === 'buyer' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-transparent bg-white/60'}`} 
               onClick={() => handleInputChange('role', 'buyer')}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Buyer</span>
          </div>
          <div className={`flex items-center justify-center gap-2 rounded-md border p-2 cursor-pointer select-none text-sm ${formData.role === 'artisan' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-transparent bg-white/60'}`} 
               onClick={() => handleInputChange('role', 'artisan')}>
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Artisan</span>
          </div>
        </div>

        <div className="space-y-1"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required /></div>
        {formData.role === 'artisan' && <div className="space-y-1"><Label htmlFor="businessName">Business Name</Label><Input id="businessName" value={formData.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} required /></div>}

        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
          {emailError && <p className="text-destructive text-xs mt-0.5">{emailError}</p>}
        </div>

        <div className="space-y-1">
          <Label>Address</Label>
          <Input placeholder="Street" value={formData.address.street} onChange={(e) => handleInputChange('address.street', e.target.value)} required />
          <div className="grid grid-cols-3 gap-1 ">
            <Input placeholder="City" value={formData.address.city} onChange={(e) => handleInputChange('address.city', e.target.value)} required />
            <Input placeholder="State" value={formData.address.state} onChange={(e) => handleInputChange('address.state', e.target.value)} required />
            <Input placeholder="Zip" value={formData.address.zipCode} onChange={(e) => handleInputChange('address.zipCode', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required /></div>
          <div className="space-y-1"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required /></div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || emailError}>
          {isLoading && <Loader2 className="w-4 h-1 animate-spin" />} Create Account
        </Button>

        <div className="text-center text-xs">
          Already have an account?{" "}
          <Link to="/login" className="underline font-medium text-red-600">Sign in</Link>
        </div>
      </form>
    ) : (
      <form onSubmit={handleOtpSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="otp">OTP</Label>
          <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Verify OTP</Button>
        <Button type="button" variant="outline" className="w-full" onClick={handleResendOtp} disabled={isLoading}>Resend OTP</Button>
      </form>
    )}
  </CardContent>
</Card>
      </div>
    </div>
  );
};

export default Register;