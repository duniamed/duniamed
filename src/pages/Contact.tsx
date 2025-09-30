import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      toast({
        title: 'Message Sent',
        description: 'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <Layout>
        {/* Hero Section */}
        <section className="section-padding bg-gradient-to-br from-soft-purple via-background to-accent/5">
          <div className="container-modern">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="font-display">
                Get in <span className="gradient-text">Touch</span>
              </h1>
              <p className="text-2xl text-muted-foreground font-light">
                Have questions? We're here to help. Reach out to our team.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="section-padding container-modern">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="card-modern">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Send Us a Message</h2>
                <p className="text-muted-foreground text-lg">
                  Fill out the form below and we'll respond within 24 hours
                </p>
              </div>
              <div className="mt-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                        <SelectItem value="press">Press Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={6} 
                      required 
                      placeholder="How can we help you?"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="glass-panel">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Email</h3>
                </div>
                <p className="text-foreground text-lg font-medium mb-1">support@duniamed.com</p>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours
                </p>
              </div>

              <div className="glass-panel">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Phone</h3>
                </div>
                <p className="text-foreground text-lg font-medium mb-1">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday, 9AM - 6PM EST
                </p>
              </div>

              <div className="glass-panel">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Office</h3>
                </div>
                <p className="text-foreground leading-relaxed">
                  123 Healthcare Drive<br />
                  San Francisco, CA 94102<br />
                  United States
                </p>
              </div>

              <div className="glass-panel">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Live Chat</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Need immediate assistance? Chat with our support team.
                </p>
                <Button className="w-full h-12 rounded-full">
                  Start Live Chat
                </Button>
              </div>
            </div>
          </div>
        </section>
    </Layout>
  );
}
