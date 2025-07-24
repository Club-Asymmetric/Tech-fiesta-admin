import { FirebaseRegistration } from "./registrationService";
import { auth } from "@/lib/firebase";

// Backend API base URL - adjust this to match your backend URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface EmailServiceStatus {
  index: number;
  email: string;
  isConfigured: boolean;
  currentUsage: number;
  dailyLimit: number;
  isActive: boolean;
}

export interface EmailStatusResponse {
  success: boolean;
  data: {
    emailConfigs: EmailServiceStatus[];
    totalConfigured: number;
    totalUsage: number;
    timestamp: string;
  };
  message: string;
}

export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  usedEmail?: string;
  currentUsage?: number;
  error?: string;
  message: string;
}

/**
 * Get the current user's authentication token
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

/**
 * Make an authenticated API request
 */
const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Get the status of all email configurations
 */
export const getEmailServiceStatus = async (): Promise<EmailStatusResponse> => {
  try {
    return await makeAuthenticatedRequest(
      `${API_BASE_URL}/payment/email-status`
    );
  } catch (error) {
    console.error("Error getting email service status:", error);
    throw new Error("Failed to get email service status");
  }
};

/**
 * Send a registration confirmation email for a specific registration
 */
export const sendRegistrationConfirmationEmail = async (
  registration: FirebaseRegistration,
  isManualEntry: boolean = true
): Promise<EmailSendResponse> => {
  try {
    const endpoint = isManualEntry
      ? `${API_BASE_URL}/payment/send-manual-email`
      : `${API_BASE_URL}/payment/send-confirmation-email`;

    const requestBody = {
      registrationData: {
        registrationId: registration.registrationId,
        userEmail: registration.email,
        userDetails: {
          name: registration.name,
          email: registration.email,
          college: registration.college,
          department: registration.department,
          year: registration.year,
          whatsapp: registration.whatsapp,
        },
        selectedEvents: registration.selectedEvents || [],
        selectedWorkshops: registration.selectedWorkshops || [],
        selectedNonTechEvents: registration.selectedNonTechEvents || [],
        selectedPass: registration.selectedPassId,
        ispass: registration.ispass,
        paymentDetails:
          registration.paymentStatus === "verified"
            ? {
                paymentId: "manual_entry",
                amount: calculateTotalAmount(registration),
                orderId: `manual_${registration.registrationId}`,
              }
            : null,
        isTeamEvent: registration.isTeamEvent,
        teamSize: registration.teamSize,
        teamMembers: registration.teamMembers || [],
        status: registration.status,
        paymentStatus: registration.paymentStatus,
      },
    };

    return await makeAuthenticatedRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error("Error sending registration confirmation email:", error);
    throw new Error("Failed to send confirmation email");
  }
};

/**
 * Send a test email to verify email service is working
 */
export const sendTestEmail = async (
  type: "test" | "registration" = "test",
  recipientEmail?: string
): Promise<EmailSendResponse> => {
  try {
    const requestBody = {
      type,
      ...(recipientEmail && { recipientEmail }),
    };

    return await makeAuthenticatedRequest(
      `${API_BASE_URL}/payment/test-email`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );
  } catch (error) {
    console.error("Error sending test email:", error);
    throw new Error("Failed to send test email");
  }
};

/**
 * Send a custom notification email
 */
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<EmailSendResponse> => {
  try {
    const requestBody = {
      to,
      subject,
      htmlContent,
      textContent,
    };

    return await makeAuthenticatedRequest(
      `${API_BASE_URL}/payment/send-notification`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw new Error("Failed to send notification email");
  }
};

/**
 * Calculate total amount for a registration (simplified calculation)
 */
const calculateTotalAmount = (registration: FirebaseRegistration): number => {
  let total = 0;

  // Add pass cost if applicable
  if (registration.ispass) {
    total += 299; // General pass cost
  }

  // Add individual event costs if no pass
  if (!registration.ispass) {
    const techEventCost = (registration.selectedEvents?.length || 0) * 50;
    const workshopCost = (registration.selectedWorkshops?.length || 0) * 100;
    total += techEventCost + workshopCost;
  }

  // Non-tech events are typically paid at venue, so not included in online payment

  return total;
};
