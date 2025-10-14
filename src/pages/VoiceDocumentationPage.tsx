import React from 'react';
import { VoiceSOAPRecorder } from '@/components/voice/VoiceSOAPRecorder';
import { VoiceCommandCenter } from '@/components/voice/VoiceCommandCenter';
import { useParams } from 'react-router-dom';

const VoiceDocumentationPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Voice Documentation</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VoiceSOAPRecorder
          appointmentId={appointmentId || ''}
          specialistId=""
          patientId=""
          onSOAPUpdate={() => {}}
        />
        <VoiceCommandCenter />
      </div>
    </div>
  );
};

export default VoiceDocumentationPage;
