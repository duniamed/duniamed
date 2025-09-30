import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, signupSchema, LoginFormData, SignupFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SpecialistSignupForm } from '@/components/auth/SpecialistSignupForm';
import { PatientSignupForm } from '@/components/auth/PatientSignupForm';
import { ClinicSignupForm } from '@/components/auth/ClinicSignupForm';

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState(1);
  
  const mode = searchParams.get('mode') || 'login';
  const prefilledRole = searchParams.get('role') as 'patient' | 'specialist' | 'clinic_admin' | null;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: prefilledRole || 'patient',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      dataProcessingConsent: false,
      jurisdiction: undefined,
      hipaaAcknowledgment: false,
    },
  });

  const selectedRole = signupForm.watch('role');
  const selectedJurisdiction = signupForm.watch('jurisdiction');

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === 'patient') {
        navigate('/dashboard');
      } else if (profile.role === 'specialist') {
        navigate('/specialist/dashboard');
      } else if (profile.role === 'clinic_admin') {
        navigate('/clinic/dashboard');
      }
    }
  }, [authLoading, user, profile, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const validateStep = async () => {
    let fieldsToValidate: (keyof SignupFormData)[] = [];
    
    if (signupStep === 1) {
      fieldsToValidate = ['role', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    } else if (signupStep === 2) {
      fieldsToValidate = ['jurisdiction'];
    }

    const isValid = await signupForm.trigger(fieldsToValidate);
    return isValid;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setSignupStep(signupStep + 1);
      setError(null);
    }
  };

  const handlePrevStep = () => {
    setSignupStep(signupStep - 1);
    setError(null);
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          jurisdiction: data.jurisdiction,
          specialist_type: data.specialistType,
          specialty: data.specialty,
          license_number: data.licenseNumber,
          license_state: data.licenseState,
          registration_number: data.registrationNumber,
          clinic_name: data.clinicName,
          clinic_type: data.clinicType,
          facility_id: data.facilityId,
          responsible_director: data.responsibleDirector,
          gdpr_article_9_basis: data.gdprArticle9Basis,
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setError('Account created! Please check your email to confirm your account.');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStepTitle = () => {
    if (signupStep === 1) return 'Basic Information';
    if (signupStep === 2) return 'Jurisdiction & Compliance';
    if (signupStep === 3) {
      if (selectedRole === 'specialist') return 'Professional Credentials';
      if (selectedRole === 'clinic_admin') return 'Clinic Information';
      return 'Data Processing Consent';
    }
    return 'Review & Confirm';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to DUNIAMED</CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(value) => {
              setSearchParams({ mode: value });
              setSignupStep(1);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      {...loginForm.register('rememberMe')}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                      Remember me
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Step {signupStep} of 4</span>
                    <span className="text-sm text-muted-foreground">{getStepTitle()}</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(signupStep / 4) * 100}%` }}
                    />
                  </div>
                </div>

                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
                  {error && (
                    <Alert variant={error.includes('created') ? 'default' : 'destructive'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Step 1: Basic Information */}
                  {signupStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">I am a...</Label>
                        <Select
                          value={signupForm.watch('role')}
                          onValueChange={(value) => signupForm.setValue('role', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="specialist">Healthcare Specialist</SelectItem>
                            <SelectItem value="clinic_admin">Clinic / Healthcare Facility</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupForm.formState.errors.role && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.role.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...signupForm.register('firstName')}
                          />
                          {signupForm.formState.errors.firstName && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.firstName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...signupForm.register('lastName')}
                          />
                          {signupForm.formState.errors.lastName && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your.email@example.com"
                          {...signupForm.register('email')}
                        />
                        {signupForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          {...signupForm.register('password')}
                        />
                        {signupForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...signupForm.register('confirmPassword')}
                        />
                        {signupForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Jurisdiction */}
                  {signupStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Primary Jurisdiction</Label>
                        <Select
                          value={signupForm.watch('jurisdiction')}
                          onValueChange={(value) => signupForm.setValue('jurisdiction', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your jurisdiction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EU_UK">European Union / United Kingdom</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="BR">Brazil</SelectItem>
                            <SelectItem value="IN">India</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupForm.formState.errors.jurisdiction && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.jurisdiction.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Select the primary jurisdiction where you will provide or receive services
                        </p>
                      </div>

                      {selectedJurisdiction && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {selectedJurisdiction === 'EU_UK' && 'GDPR applies - special category health data rules.'}
                            {selectedJurisdiction === 'US' && 'HIPAA Privacy Rule applies for PHI handling.'}
                            {selectedJurisdiction === 'CA' && 'PIPEDA and provincial health information laws apply.'}
                            {selectedJurisdiction === 'BR' && 'LGPD applies with specific health data protections.'}
                            {selectedJurisdiction === 'IN' && 'Telemedicine Practice Guidelines (2020) apply.'}
                            {selectedJurisdiction === 'AU' && 'Australian Privacy Principles (APPs) apply.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Step 3: Role-Specific Forms */}
                  {signupStep === 3 && (
                    <>
                      {selectedRole === 'specialist' && <SpecialistSignupForm form={signupForm} />}
                      {selectedRole === 'patient' && <PatientSignupForm form={signupForm} />}
                      {selectedRole === 'clinic_admin' && <ClinicSignupForm form={signupForm} />}
                    </>
                  )}

                  {/* Step 4: Consents */}
                  {signupStep === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="dataProcessingConsent"
                          checked={signupForm.watch('dataProcessingConsent')}
                          onCheckedChange={(checked) => signupForm.setValue('dataProcessingConsent', checked as boolean)}
                        />
                        <Label htmlFor="dataProcessingConsent" className="text-sm font-normal leading-tight">
                          I consent to the processing of my personal and health data as described in the Privacy Policy, 
                          for the purposes of providing telemedicine services, managing medical records, and complying 
                          with legal obligations
                        </Label>
                      </div>
                      {signupForm.formState.errors.dataProcessingConsent && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.dataProcessingConsent.message}</p>
                      )}

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={signupForm.watch('agreeToTerms')}
                          onCheckedChange={(checked) => signupForm.setValue('agreeToTerms', checked as boolean)}
                        />
                        <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                          I agree to the Terms of Service, Privacy Policy, and HIPAA Authorization (if applicable)
                        </Label>
                      </div>
                      {signupForm.formState.errors.agreeToTerms && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.agreeToTerms.message}</p>
                      )}

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          By creating an account, you confirm that all information provided is accurate and that you 
                          meet the regulatory requirements for your role and jurisdiction.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {signupStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevStep}
                        className="flex-1"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                    )}
                    
                    {signupStep < 4 ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1"
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
