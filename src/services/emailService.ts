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

/**
 * Send an OD letter email with PDF attachment using a dedicated endpoint
 */
export const sendODLetterEmail = async (
  registration: FirebaseRegistration,
  pdfBlob: Blob
): Promise<EmailSendResponse> => {
  try {
    // Create professional HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
        .event-list { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .attachment-notice { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 Official On-Duty Letter</h1>
        <h2>Tech Fiesta 2025</h2>
        <p>Chennai Institute of Technology</p>
    </div>
    
    <div class="content">
        <div class="attachment-notice">
            <h3>📎 PDF Attachment Included</h3>
            <p><strong>Your official registration certificate is attached as a PDF to this email.</strong></p>
            <p>Present this email and the attached PDF to your college authorities for OD permission.</p>
        </div>

        <div class="section">
            <h3>📋 Event Information</h3>
            <p><strong>Event:</strong> Tech Fiesta 2025 - National Level Tech Fest</p>
            <p><strong>Date:</strong> 30th July 2025 (Wednesday)</p>
            <p><strong>Time:</strong> 8:00 AM - 3:00 PM</p>
            <p><strong>Venue:</strong> Chennai Institute of Technology, Kundrathur, Chennai</p>
            <p><strong>Registration ID:</strong> ${registration.registrationId}</p>
        </div>

        <div class="section">
            <h3>👤 Participant Details</h3>
            <p><strong>Name:</strong> ${registration.name}</p>
            <p><strong>College:</strong> ${registration.college}</p>
            <p><strong>Department:</strong> ${registration.department}</p>
            <p><strong>Email:</strong> ${registration.email}</p>
        </div>

        <div class="section">
            <h3>🎯 Registered Events</h3>
            <div class="event-list">
                ${registration.selectedEvents.length > 0 ? registration.selectedEvents.map(e => `<p>• <strong>Technical Event:</strong> ${e.title || e}</p>`).join('') : ''}
                ${registration.selectedWorkshops.length > 0 ? registration.selectedWorkshops.map(w => `<p>• <strong>Workshop:</strong> ${w.title || w}</p>`).join('') : ''}
                ${registration.selectedNonTechEvents.length > 0 ? registration.selectedNonTechEvents.map(e => `<p>• <strong>Non-Technical Event:</strong> ${e.title || e}</p>`).join('') : ''}
                ${registration.ispass ? '<p>• <strong>Full Access Pass Holder</strong> - Unlimited access to all events</p>' : ''}
                ${registration.selectedEvents.length === 0 && registration.selectedWorkshops.length === 0 && registration.selectedNonTechEvents.length === 0 && !registration.ispass ? '<p><em>Walk-in registration for events at venue</em></p>' : ''}
            </div>
        </div>

        <div class="section">
            <h3>📝 Important Instructions</h3>
            <ul>
                <li>Present this email and attached PDF certificate to college authorities</li>
                <li>Bring a valid college ID card for verification at the event</li>
                <li>Report to the registration desk by 8:00 AM sharp</li>
                <li>Follow all event guidelines and safety protocols</li>
            </ul>
        </div>

        <div class="section">
            <h3>🏆 Event Highlights</h3>
            <p>• Prize Pool Worth ₹1.5 Lakhs<br>
            • 7+ Technical Competitions<br>
            • 6+ Expert-led Workshops<br>
            • 5+ Non-Technical Events<br>
            • Networking opportunities with industry experts</p>
        </div>

        <div class="section">
            <h3>📞 Contact Information</h3>
            <p><strong>Email:</strong> asymmetric@citchennai.net<br>
            <strong>Phone:</strong> +91 9876543210</p>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>This serves as official proof of registration for OD permission.</strong></p>
        <p>Best regards,<br>Team Asymmetric<br>Chennai Institute of Technology</p>
        <p>© 2025 Tech Fiesta - Chennai Institute of Technology</p>
    </div>
</body>
</html>`;

    // Create plain text version
    const textContent = `Official On-Duty Letter - Tech Fiesta 2025

Dear ${registration.name},

Greetings from Team Asymmetric, Chennai Institute of Technology!

This email serves as your official On-Duty (OD) letter for Tech Fiesta 2025. Your registration certificate PDF is attached to this email.

EVENT DETAILS:
• Event: Tech Fiesta 2025 - National Level Tech Fest
• Date: 30th July 2025 (Wednesday)
• Time: 8:00 AM - 3:00 PM
• Venue: Chennai Institute of Technology, Kundrathur, Chennai
• Registration ID: ${registration.registrationId}

PARTICIPANT DETAILS:
• Name: ${registration.name}
• College: ${registration.college}
• Department: ${registration.department}
• Email: ${registration.email}

REGISTERED EVENTS:
${registration.selectedEvents.length > 0 ? registration.selectedEvents.map(e => `• Technical Event: ${e.title || e}`).join('\n') : ''}
${registration.selectedWorkshops.length > 0 ? registration.selectedWorkshops.map(w => `• Workshop: ${w.title || w}`).join('\n') : ''}
${registration.selectedNonTechEvents.length > 0 ? registration.selectedNonTechEvents.map(e => `• Non-Technical Event: ${e.title || e}`).join('\n') : ''}
${registration.ispass ? '• Full Access Pass Holder - Unlimited access to all events' : ''}

IMPORTANT INSTRUCTIONS:
1. Present this email and attached PDF to college authorities for OD permission
2. Bring valid college ID card for verification at the event
3. Report to registration desk by 8:00 AM sharp
4. Follow all event guidelines and safety protocols

For any queries: asymmetric@citchennai.net | +91 9876543210

Best regards,
Team Asymmetric
Chennai Institute of Technology`;

    // Use FormData to send PDF attachment
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append('to', registration.email);
    formData.append('subject', `OD Letter - Tech Fiesta 2025 Registration Certificate - ${registration.registrationId}`);
    formData.append('htmlContent', htmlContent);
    formData.append('textContent', textContent);
    formData.append('attachment', pdfBlob, `Tech_Fiesta_2025_Certificate_${registration.registrationId}.pdf`);

    const response = await fetch(`${API_BASE_URL}/payment/send-od-letter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending OD letter email:", error);
    throw new Error("Failed to send OD letter email");
  }
};
