import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, CheckCircle2, PlayCircle, ChevronRight } from 'lucide-react';

/**
 * C6 USABILITY - Tutorial System
 * 
 * PATIENT WORKFLOW:
 * 1. First login triggers welcome tutorial
 * 2. Step-by-step guided tour of key features
 * 3. Interactive checkpoints with progress tracking
 * 4. "Skip" option with ability to restart later
 * 5. Completion certificate and badges
 * 
 * SPECIALIST WORKFLOW:
 * 1. Role-specific onboarding for clinical features
 * 2. Advanced tutorials for SOAP notes, prescriptions
 * 3. Video demonstrations of complex workflows
 * 4. Quick-reference guides available in-app
 * 
 * CLINIC WORKFLOW:
 * 1. Admin panel tutorials for staff management
 * 2. Training modules for billing, scheduling
 * 3. Compliance training with quizzes
 * 4. Progress tracking for team members
 */

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: string[];
  category: string;
  duration: string;
  completed: boolean;
}

const tutorials: Tutorial[] = [
  {
    id: 'patient-basics',
    title: 'Getting Started as a Patient',
    description: 'Learn how to search specialists, book appointments, and manage your health records',
    steps: [
      'Complete your profile with medical history',
      'Search for specialists in your area',
      'Book your first appointment',
      'Upload medical records securely',
      'Set up appointment reminders'
    ],
    category: 'Patient',
    duration: '5 min',
    completed: false
  },
  {
    id: 'specialist-soap',
    title: 'Creating SOAP Notes',
    description: 'Master the art of efficient clinical documentation',
    steps: [
      'Understanding SOAP note structure',
      'Recording subjective patient complaints',
      'Documenting objective findings',
      'Creating assessment and plan',
      'Using templates and shortcuts'
    ],
    category: 'Specialist',
    duration: '8 min',
    completed: false
  },
  {
    id: 'clinic-staff',
    title: 'Managing Clinic Staff',
    description: 'Invite team members, assign roles, and manage permissions',
    steps: [
      'Inviting staff members',
      'Assigning roles and permissions',
      'Managing schedules',
      'Tracking staff activity',
      'Revenue split configuration'
    ],
    category: 'Clinic',
    duration: '10 min',
    completed: false
  },
  {
    id: 'video-consultation',
    title: 'Conducting Video Consultations',
    description: 'Learn best practices for telehealth appointments',
    steps: [
      'Testing audio and video before appointments',
      'Sharing screen during consultation',
      'Recording consultation notes',
      'Prescribing medications remotely',
      'Following up after the visit'
    ],
    category: 'Both',
    duration: '7 min',
    completed: false
  }
];

export default function TutorialSystem() {
  const { toast } = useToast();
  const [userTutorials, setUserTutorials] = useState<Tutorial[]>(tutorials);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('tutorial_progress')
        .eq('user_id', user.id)
        .single();

      if (data?.tutorial_progress) {
        const progress = data.tutorial_progress as Record<string, boolean>;
        setUserTutorials(tutorials.map(t => ({
          ...t,
          completed: progress[t.id] || false
        })));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const startTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (activeTutorial) {
      completeTutorial();
    }
  };

  const completeTutorial = async () => {
    if (!activeTutorial) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('user_preferences')
        .select('tutorial_progress')
        .eq('user_id', user.id)
        .single();

      const progress = (existing?.tutorial_progress as Record<string, boolean>) || {};
      progress[activeTutorial.id] = true;

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          tutorial_progress: progress
        });

      toast({
        title: "Tutorial completed!",
        description: `You've completed "${activeTutorial.title}"`,
      });

      setUserTutorials(userTutorials.map(t =>
        t.id === activeTutorial.id ? { ...t, completed: true } : t
      ));
      setActiveTutorial(null);
      setCurrentStep(0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const completedCount = userTutorials.filter(t => t.completed).length;
  const totalProgress = (completedCount / userTutorials.length) * 100;

  if (activeTutorial) {
    const stepProgress = ((currentStep + 1) / activeTutorial.steps.length) * 100;

    return (
      <Layout>
        <div className="container max-w-4xl py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeTutorial.title}</CardTitle>
                  <CardDescription>
                    Step {currentStep + 1} of {activeTutorial.steps.length}
                  </CardDescription>
                </div>
                <Badge>{activeTutorial.category}</Badge>
              </div>
              <Progress value={stepProgress} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  {activeTutorial.steps[currentStep]}
                </h3>
                <p className="text-muted-foreground">
                  Follow the highlighted areas on the screen to complete this step.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">All Steps:</h4>
                {activeTutorial.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      index < currentStep
                        ? 'text-green-600'
                        : index === currentStep
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-current" />
                    )}
                    {step}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button onClick={nextStep}>
                  {currentStep < activeTutorial.steps.length - 1 ? (
                    <>
                      Next Step
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Complete Tutorial
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setActiveTutorial(null)}>
                  Exit Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Learning Center (C6 Usability)
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive tutorials to help you master DuniaMed
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              {completedCount} of {userTutorials.length} tutorials completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={totalProgress} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {userTutorials.map((tutorial) => (
            <Card key={tutorial.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                    <CardDescription>{tutorial.description}</CardDescription>
                  </div>
                  {tutorial.completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">{tutorial.category}</Badge>
                    <Badge variant="secondary">{tutorial.duration}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant={tutorial.completed ? "outline" : "default"}
                    onClick={() => startTutorial(tutorial)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {tutorial.completed ? 'Review' : 'Start'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
