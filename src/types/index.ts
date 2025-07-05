// Type definitions for events and workshops

export interface Event {
  id: number;
  title: string;
  type: "tech" | "non-tech";
  date: string;
  time: string;
  venue: string;
  description: string;
  speakers?: string[];
  capacity?: number;
  registrations?: number;
  tags?: string[];
  image?: string;
  price?: string; // Optional field for event price
}

export interface Workshop {
  id: number;
  title: string;
  category: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  date: string;
  time: string;
  venue: string;
  instructor: string;
  description: string;
  prerequisites?: string[];
  materials?: string[];
  capacity?: number;
  registrations?: number;
  price: string;
  tags?: string[];
  syllabus?: string[];
}

// Registration types
export interface TeamMember {
  name: string;
  department: string;
  year: string;
  email: string;
  whatsapp: string;
}

export interface RegistrationFormData {
  // Primary participant details
  name: string;
  department: string;
  email: string;
  whatsapp: string;
  college: string;
  year: string;

  // Team details (conditional)
  isTeamEvent: boolean;
  teamSize?: number;
  teamMembers?: TeamMember[];

  // Event selections
  selectedEvents: number[];
  selectedWorkshops: number[];
  selectedNonTechEvents: number[];

  // Payment details
  transactionIds: Record<string, string>; // Flexible structure for individual event/workshop transaction IDs

  // Verification
  hasConsented: boolean;
}

export interface RegistrationProps {
  preSelectedEventId?: number;
  preSelectedEventType?: "event" | "workshop" | "non-tech";
}

export interface PaymentQR {
  type: "event" | "workshop" | "general";
  eventId?: number; // For individual event/workshop QRs
  eventTitle?: string;
  amount: string;
  qrCode: string;
  description: string;
}
