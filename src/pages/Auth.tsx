import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
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
import { AlertCircle, ChevronLeft, ChevronRight, Users, User, Building2, InfoIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SpecialistSignupForm } from '@/components/auth/SpecialistSignupForm';
import { PatientSignupForm } from '@/components/auth/PatientSignupForm';
import { ClinicSignupForm } from '@/components/auth/ClinicSignupForm';

export default function Auth() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState(0); // Start at 0 for role selection
  
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
      jurisdiction: '' as any,
      hipaaAcknowledgment: false,
      specialties: [],
      clinicSpecialties: [],
      specialistType: '',
      clinicType: '',
      gdprArticle9Basis: '',
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
    
    if (signupStep === 2) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    } else if (signupStep === 3) {
      fieldsToValidate = ['jurisdiction'];
    }
    // Step 4 (role-specific) has optional fields, no strict validation needed

    if (fieldsToValidate.length > 0) {
      const isValid = await signupForm.trigger(fieldsToValidate);
      return isValid;
    }
    
    return true; // Allow progression if no validation needed
  };

  const handleNextStep = async () => {
    // For step 0 (role selection) and step 1 (info prep), just advance
    if (signupStep === 0 || signupStep === 1) {
      setSignupStep(signupStep + 1);
      setError(null);
      return;
    }
    
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

  const handleRoleSelect = (role: 'patient' | 'specialist' | 'clinic_admin') => {
    signupForm.setValue('role', role);
    setSignupStep(1); // Move to info preparation step
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
          specialties: data.specialties,
          license_number: data.licenseNumber,
          license_state: data.licenseState,
          registration_number: data.registrationNumber,
          clinic_name: data.clinicName,
          clinic_type: data.clinicType,
          clinic_specialties: data.clinicSpecialties,
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
      // Redirect to login page
      setSearchParams({ mode: 'login' });
      setSignupStep(0);
      setError('Account created! Please check your email to confirm your account, then login.');
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
    if (signupStep === 0) return 'Choose Your Role';
    if (signupStep === 1) return 'What You\'ll Need';
    if (signupStep === 2) return 'Basic Information';
    if (signupStep === 3) return 'Jurisdiction & Compliance';
    if (signupStep === 4) {
      if (selectedRole === 'specialist') return 'Professional Credentials';
      if (selectedRole === 'clinic_admin') return 'Clinic Information';
      return 'Data Processing Consent';
    }
    return 'Review & Confirm';
  };

  const getRequiredDocuments = () => {
    if (selectedRole === 'patient') {
      return [
        'Valid email address',
        'Basic personal information',
        'Consent to data processing',
      ];
    } else if (selectedRole === 'specialist') {
      return [
        'Medical license number',
        'Professional credentials',
        'Medical specialty information',
        'Years of experience',
        'License jurisdiction details',
      ];
    } else if (selectedRole === 'clinic_admin') {
      return [
        'Clinic/facility name and type',
        'Facility registration number',
        'Responsible director information',
        'Operating jurisdiction',
        'Specialties offered',
      ];
    }
    return [];
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
              setSignupStep(0); // Reset to role selection
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
                {signupStep > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Step {signupStep} of 5</span>
                      <span className="text-sm text-muted-foreground">{getStepTitle()}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(signupStep / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
                  {error && (
                    <Alert variant={error.includes('created') ? 'default' : 'destructive'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Step 0: Role Selection */}
                  {signupStep === 0 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">Choose Your Role</h3>
                        <p className="text-muted-foreground">Select the option that best describes you</p>
                      </div>
                      
                      <div className="grid gap-4">
                        <Card 
                          className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                          onClick={() => handleRoleSelect('patient')}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-lg bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">Patient</h4>
                                <p className="text-sm text-muted-foreground">
                                  Book appointments, consult with specialists, and manage your health records
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card 
                          className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                          onClick={() => handleRoleSelect('specialist')}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-lg bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">Healthcare Specialist</h4>
                                <p className="text-sm text-muted-foreground">
                                  Provide consultations, manage your practice, and connect with patients
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card 
                          className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                          onClick={() => handleRoleSelect('clinic_admin')}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-lg bg-primary/10">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">Clinic / Healthcare Facility</h4>
                                <p className="text-sm text-muted-foreground">
                                  Manage your clinic, staff, and provide comprehensive healthcare services
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Information Preparation */}
                  {signupStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">What You'll Need</h3>
                        <p className="text-muted-foreground">
                          Please have the following information ready
                        </p>
                      </div>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                {selectedRole === 'patient' && <Users className="h-5 w-5 text-primary" />}
                                {selectedRole === 'specialist' && <User className="h-5 w-5 text-primary" />}
                                {selectedRole === 'clinic_admin' && <Building2 className="h-5 w-5 text-primary" />}
                              </div>
                              <h4 className="font-semibold text-lg">
                                {selectedRole === 'patient' && 'Patient Registration'}
                                {selectedRole === 'specialist' && 'Healthcare Specialist Registration'}
                                {selectedRole === 'clinic_admin' && 'Clinic Registration'}
                              </h4>
                            </div>

                            <div className="space-y-2">
                              {getRequiredDocuments().map((doc, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="mt-0.5">
                                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                                      <div className="h-2 w-2 rounded-full bg-primary" />
                                    </div>
                                  </div>
                                  <span className="text-sm">{doc}</span>
                                </div>
                              ))}
                            </div>

                            <Alert>
                              <InfoIcon className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                Don't worry if you don't have everything right now. You can complete your profile later.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </CardContent>
                      </Card>

                      <Button onClick={handleNextStep} className="w-full" size="lg">
                        I'm Ready - Let's Begin
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Basic Information */}
                  {signupStep === 2 && (
                    <div className="space-y-4">
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

                  {/* Step 3: Jurisdiction */}
                  {signupStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Primary Jurisdiction</Label>
                        <Select
                          value={signupForm.watch('jurisdiction') || ''}
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

                  {/* Step 4: Role-Specific Forms */}
                  {signupStep === 4 && (
                    <>
                      {selectedRole === 'specialist' && <SpecialistSignupForm form={signupForm} />}
                      {selectedRole === 'patient' && <PatientSignupForm form={signupForm} />}
                      {selectedRole === 'clinic_admin' && <ClinicSignupForm form={signupForm} />}
                    </>
                  )}

                  {/* Step 5: Consents */}
                  {signupStep === 5 && (
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
                    {signupStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevStep}
                        className="flex-1"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}
                    
                    {signupStep < 5 ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {signupStep === 1 ? "I'm Ready - Let's Begin" : "Next"}
                        {signupStep > 1 && <ChevronRight className="ml-2 h-4 w-4" />}
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
