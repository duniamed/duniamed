import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppointmentState {
  // Draft appointment data
  draftAppointment: {
    specialistId?: string;
    selectedDate?: Date;
    selectedTime?: string;
    consultationType?: 'video' | 'in_person';
    chiefComplaint?: string;
    urgencyLevel?: 'routine' | 'urgent' | 'emergency';
    triageId?: string; // From symptom checker
  };
  
  // Booking flow state
  currentStep: number;
  holdId?: string;
  holdExpiresAt?: string;
  
  // Actions
  setDraftAppointment: (data: Partial<AppointmentState['draftAppointment']>) => void;
  clearDraftAppointment: () => void;
  setCurrentStep: (step: number) => void;
  setHold: (holdId: string, expiresAt: string) => void;
  clearHold: () => void;
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set) => ({
      draftAppointment: {},
      currentStep: 1,
      holdId: undefined,
      holdExpiresAt: undefined,

      setDraftAppointment: (data) =>
        set((state) => ({
          draftAppointment: { ...state.draftAppointment, ...data },
        })),

      clearDraftAppointment: () =>
        set({
          draftAppointment: {},
          currentStep: 1,
          holdId: undefined,
          holdExpiresAt: undefined,
        }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setHold: (holdId, expiresAt) =>
        set({ holdId, holdExpiresAt: expiresAt }),

      clearHold: () =>
        set({ holdId: undefined, holdExpiresAt: undefined }),
    }),
    {
      name: 'appointment-storage',
    }
  )
);
