import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Phone, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function WhatsAppBooking() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartChat = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate WhatsApp integration
    setTimeout(() => {
      const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I need to book an appointment.')}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "Opening WhatsApp",
        description: "Continue the conversation in WhatsApp to complete your booking.",
      });
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout
      title="WhatsApp Booking"
      description="Book appointments via WhatsApp - No app download needed"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Book via WhatsApp</CardTitle>
            <CardDescription className="text-base">
              Chat with our AI assistant to find the right doctor and book instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-background/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                How it works:
              </h3>
              <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                <li>Enter your WhatsApp number below</li>
                <li>Chat opens in WhatsApp (no app download needed)</li>
                <li>Tell our AI what's bothering you</li>
                <li>Get specialist recommendations instantly</li>
                <li>Pick a time slot - Done! Booking confirmed in 2 minutes</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your WhatsApp Number
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleStartChat}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Start Chat
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Include country code (e.g., +55 for Brazil, +1 for USA)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">⚡ Instant Replies</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              AI responds in seconds. No waiting on hold or office hours.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🧠 Smart Matching</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Describe symptoms naturally - AI finds the perfect specialist.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🌍 Works Everywhere</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              2B+ WhatsApp users. Book in Portuguese, Spanish, English.
            </CardContent>
          </Card>
        </div>

        {/* Demo Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Example Conversation</CardTitle>
            <CardDescription>See how easy it is</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">Hi, I need an appointment</p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">🏥 Welcome to DuniaMed! What's bothering you today?</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">I have chest pain</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">Based on your symptoms, I recommend a Cardiologist.<br/><br/>
                  1️⃣ Dr. João Silva - ⭐ 4.8 - Tomorrow 2pm<br/>
                  2️⃣ Dr. Ana Costa - ⭐ 4.6 - Wed 10am<br/><br/>
                  Reply 1 or 2 to book</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">1</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">✅ Great! What's your full name?</p>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                ...conversation continues until booking confirmed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Prefer talking to a human? Our support team is available 24/7
              </p>
              <Button variant="outline" className="gap-2">
                <Phone className="h-4 w-4" />
                Call Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
