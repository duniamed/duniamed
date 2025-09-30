import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Clock, DollarSign } from 'lucide-react';

export default function Careers() {
  const positions = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120K - $180K',
      description: 'Build and scale our healthcare platform using React, Node.js, and Supabase.',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      salary: '$100K - $140K',
      description: 'Create intuitive experiences for patients and healthcare providers.',
    },
    {
      title: 'Healthcare Compliance Manager',
      department: 'Compliance',
      location: 'Hybrid',
      type: 'Full-time',
      salary: '$90K - $130K',
      description: 'Ensure HIPAA compliance and manage healthcare regulations across regions.',
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      salary: '$70K - $100K',
      description: 'Support healthcare providers and patients in maximizing platform value.',
    },
  ];

  const benefits = [
    'Comprehensive health insurance',
    'Flexible remote work',
    'Unlimited PTO',
    'Professional development budget',
    'Equity options',
    'Wellness programs',
    'Home office stipend',
    'Parental leave',
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="gradient-hero py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Join Our Mission
              </h1>
              <p className="text-xl text-muted-foreground">
                Help us transform global healthcare access. We're looking for passionate individuals
                who want to make a real difference in people's lives.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join DUNIAMED?</h2>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <Card key={benefit}>
                <CardContent className="pt-6">
                  <p className="text-sm text-center">{benefit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {positions.map((position) => (
                <Card key={position.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                        <CardDescription className="mb-4">{position.description}</CardDescription>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {position.department}
                          </Badge>
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            {position.location}
                          </Badge>
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {position.type}
                          </Badge>
                          <Badge variant="secondary">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {position.salary}
                          </Badge>
                        </div>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 container px-4">
          <Card className="max-w-3xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Don't See Your Role?</CardTitle>
              <CardDescription className="text-base">
                We're always looking for talented individuals. Send us your resume and tell us
                how you'd like to contribute to our mission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg">Send Your Resume</Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
