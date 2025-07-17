import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  or,
  and,
  updateDoc,
  doc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { RegistrationFormData } from "@/types";

export interface FirebaseRegistration {
  id: string;
  registrationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "verified" | "failed" | "not-required";
  
  // Personal Information
  name: string;
  email: string;
  userEmail: string;
  userId: string;
  whatsapp: string;
  college: string;
  department: string;
  year: string;
  hasConsented: boolean;
  
  // Event Registration
  selectedEvents: any[];
  selectedWorkshops: any[];
  selectedNonTechEvents: any[];
  eventCount: number;
  isTeamEvent: boolean;
  teamSize: number;
  teamMembers: any[];
  
  // Pass Information
  ispass: boolean;
  selectedPassId: number | null;
  
  // Contact Details
  contactDetails: {
    accessibility: string;
    dietaryRestrictions: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  
  // Arrival Status
  arrivalStatus: {
    hasArrived: boolean;
    arrivalTime: Timestamp | null;
    checkedInBy: string | null;
    notes: string;
  };
  
  // Workshop Details
  workshopDetails: {
    selectedWorkshop: string | null;
    workshopTitle: string;
    canEditWorkshop: boolean;
    workshopAttended: boolean;
    workshopAttendanceTime: Timestamp | null;
  };
  
  // Event Attendance
  eventAttendance: {
    techEvents: any[];
    nonTechEvents: any[];
    workshops: any[];
  };
  
  // Admin Notes
  adminNotes: {
    generalNotes: string;
    specialRequirements: string;
    flagged: boolean;
    flagReason: string;
    lastModifiedAt: Timestamp | null;
    lastModifiedBy: string | null;
  };
  
  // Payment Information
  transactionIds: Record<string, any>;
}

export interface DuplicateCheck {
  exists: boolean;
  duplicateFields: string[];
  existingRegistration?: FirebaseRegistration;
}

/**
 * Check for duplicate registrations based on email, WhatsApp number, and name
 */
export async function checkDuplicateRegistration(
  email: string,
  whatsapp: string
): Promise<DuplicateCheck> {
  try {
    const registrationsRef = collection(db, "registrations");

    // Check for email duplicates
    const emailQuery = query(
      registrationsRef,
      where("email", "==", email.toLowerCase())
    );
    const emailSnapshot = await getDocs(emailQuery);

    // Check for WhatsApp duplicates
    const whatsappQuery = query(
      registrationsRef,
      where("whatsapp", "==", whatsapp)
    );
    const whatsappSnapshot = await getDocs(whatsappQuery);

    const duplicateFields: string[] = [];
    let existingRegistration: FirebaseRegistration | undefined;

    if (!emailSnapshot.empty) {
      duplicateFields.push("email");
      existingRegistration = {
        id: emailSnapshot.docs[0].id,
        ...emailSnapshot.docs[0].data(),
      } as FirebaseRegistration;
    }

    if (!whatsappSnapshot.empty) {
      duplicateFields.push("whatsapp");
      if (!existingRegistration) {
        existingRegistration = {
          id: whatsappSnapshot.docs[0].id,
          ...whatsappSnapshot.docs[0].data(),
        } as FirebaseRegistration;
      }
    }

    return {
      exists: duplicateFields.length > 0,
      duplicateFields,
      existingRegistration,
    };
  } catch (error) {
    console.error("Error checking duplicate registration:", error);
    throw new Error("Failed to check for duplicate registrations");
  }
}

/**
 * Submit registration to Firebase Firestore
 */
export async function submitRegistration(
  formData: RegistrationFormData
): Promise<{ success: boolean; registrationId: string; message: string }> {
  try {
    // Generate unique IDs
    const registrationId = `TF2025-${uuidv4().substr(0, 8).toUpperCase()}`;
    const documentId = uuidv4();

    // Check for duplicates first
    const duplicateCheck = await checkDuplicateRegistration(
      formData.email,
      formData.whatsapp
    );

    if (duplicateCheck.exists) {
      return {
        success: false,
        registrationId: "",
        message: `Registration already exists with the same ${duplicateCheck.duplicateFields.join(
          ", "
        )}. Please use different details or contact support if this is an error.`,
      };
    }

    // Prepare registration data
    const registrationData: Omit<FirebaseRegistration, "id"> = {
      registrationId,
      name: formData.name.trim(),
      department: formData.department.trim(),
      email: formData.email.toLowerCase().trim(),
      userEmail: formData.email.toLowerCase().trim(),
      userId: "", // Will be populated when user authentication is implemented
      whatsapp: formData.whatsapp.trim(),
      college: formData.college.trim(),
      year: formData.year,
      hasConsented: formData.hasConsented,
      isTeamEvent: formData.isTeamEvent,
      teamSize: formData.teamSize || 1,
      teamMembers: formData.teamMembers || [],
      selectedEvents: formData.selectedEvents,
      selectedWorkshops: formData.selectedWorkshops,
      selectedNonTechEvents: formData.selectedNonTechEvents,
      eventCount: formData.selectedEvents?.length || 0,
      transactionIds: formData.transactionIds || {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "pending",
      paymentStatus: "pending",
      
      // Pass Information
      ispass: false, // Default to false for now
      selectedPassId: null,
      
      // Initialize nested objects with default values
      contactDetails: {
        accessibility: "",
        dietaryRestrictions: "",
        emergencyContact: "",
        emergencyPhone: "",
      },
      arrivalStatus: {
        hasArrived: false,
        arrivalTime: null,
        checkedInBy: null,
        notes: "",
      },
      workshopDetails: {
        selectedWorkshop: null,
        workshopTitle: "",
        canEditWorkshop: false,
        workshopAttended: false,
        workshopAttendanceTime: null,
      },
      eventAttendance: {
        techEvents: [],
        nonTechEvents: [],
        workshops: [],
      },
      adminNotes: {
        generalNotes: "",
        specialRequirements: "",
        flagged: false,
        flagReason: "",
        lastModifiedAt: null,
        lastModifiedBy: null,
      },
    };

    // Add to Firestore
    const docRef = await addDoc(
      collection(db, "registrations"),
      registrationData
    );

    console.log("Registration submitted successfully:", docRef.id);

    return {
      success: true,
      registrationId,
      message: `Registration submitted successfully! Your registration ID is ${registrationId}. Please save this for future reference.`,
    };
  } catch (error) {
    console.error("Error submitting registration:", error);
    return {
      success: false,
      registrationId: "",
      message:
        "Failed to submit registration. Please try again or contact support.",
    };
  }
}

/**
 * Get registration by registration ID
 */
export async function getRegistrationById(
  registrationId: string
): Promise<FirebaseRegistration | null> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirebaseRegistration;
  } catch (error) {
    console.error("Error getting registration:", error);
    return null;
  }
}











/**
 * Get all registrations (for admin purposes)
 */
export async function getAllRegistrations(): Promise<FirebaseRegistration[]> {
  try {
    const registrationsRef = collection(db, "registrations");
    const querySnapshot = await getDocs(registrationsRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirebaseRegistration[];
  } catch (error) {
    console.error("Error getting all registrations:", error);
    return [];
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  registrationId: string,
  paymentStatus: "pending" | "verified" | "failed"
): Promise<boolean> {
  try {
    const registrationDoc = doc(db, "registrations", registrationId);
    await updateDoc(registrationDoc, {
      paymentStatus,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error updating payment status:", error);
    return false;
  }
}

/**
 * Get all registrations with admin fields (Direct Firestore)
 */
export async function getAllRegistrationsForAdmin(): Promise<FirebaseRegistration[]> {
  try {
    const registrationsRef = collection(db, "registrations");
    const querySnapshot = await getDocs(registrationsRef);

    const registrations: FirebaseRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push({
        id: doc.id,
        ...doc.data(),
      } as FirebaseRegistration);
    });

    // Sort by creation date (newest first)
    return registrations.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error("Error getting all registrations:", error);
    return [];
  }
}

/**
 * Update arrival status (Direct Firestore)
 */
export async function updateArrivalStatus(
  registrationId: string,
  hasArrived: boolean,
  notes: string = ""
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      "arrivalStatus.hasArrived": hasArrived,
      "arrivalStatus.arrivalTime": hasArrived ? Timestamp.now() : null,
      "arrivalStatus.notes": notes,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating arrival status:", error);
    return false;
  }
}

/**
 * Update workshop selection (Direct Firestore)
 */
export async function updateWorkshopSelection(
  registrationId: string,
  selectedWorkshop: number,
  workshopTitle: string,
  workshopAttended?: boolean
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const updateData: any = {
      "workshopDetails.selectedWorkshop": selectedWorkshop,
      "workshopDetails.workshopTitle": workshopTitle,
      updatedAt: Timestamp.now(),
    };

    // Only update attendance if it's provided
    if (workshopAttended !== undefined) {
      updateData["workshopDetails.workshopAttended"] = workshopAttended;
    }

    await updateDoc(docRef, updateData);

    return true;
  } catch (error) {
    console.error("Error updating workshop selection:", error);
    return false;
  }
}

/**
 * Update workshop attendance only (Direct Firestore)
 */
export async function updateWorkshopAttendance(
  registrationId: string,
  attended: boolean
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      "workshopDetails.workshopAttended": attended,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating workshop attendance:", error);
    return false;
  }
}

/**
 * Update event attendance (Direct Firestore)
 */
export async function updateEventAttendance(
  registrationId: string,
  eventType: "techEvents" | "workshops" | "nonTechEvents",
  eventId: number,
  attended: boolean,
  notes: string = "",
  paidOnArrival: boolean = false,
  amountPaid: number = 0
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const registration = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as FirebaseRegistration;
    const eventAttendance = registration.eventAttendance || { techEvents: [], workshops: [], nonTechEvents: [] };
    
    const eventArray = eventAttendance[eventType] || [];
    const eventIndex = eventArray.findIndex((e: any) => e.eventId === eventId || e.workshopId === eventId);
    
    if (eventIndex !== -1) {
      // Update existing event attendance
      eventArray[eventIndex] = {
        ...eventArray[eventIndex],
        attended,
        attendanceTime: attended ? Timestamp.now() : null,
        notes,
        ...(eventType === 'nonTechEvents' && { paidOnArrival, amountPaid })
      };
    } else {
      // Create new event attendance record
      const newAttendanceRecord = {
        eventId,
        attended,
        attendanceTime: attended ? Timestamp.now() : null,
        notes,
        ...(eventType === 'nonTechEvents' && { paidOnArrival, amountPaid })
      };
      eventArray.push(newAttendanceRecord);
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      [`eventAttendance.${eventType}`]: eventArray,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating event attendance:", error);
    return false;
  }
}

/**
 * Update admin notes (Direct Firestore)
 */
export async function updateAdminNotes(
  registrationId: string,
  generalNotes: string,
  specialRequirements: string,
  flagged: boolean,
  flagReason: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      "adminNotes.generalNotes": generalNotes,
      "adminNotes.specialRequirements": specialRequirements,
      "adminNotes.flagged": flagged,
      "adminNotes.flagReason": flagReason,
      "adminNotes.lastModifiedAt": Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating admin notes:", error);
    return false;
  }
}

/**
 * Update personal information (Direct Firestore)
 */
export async function updatePersonalInfo(
  registrationId: string,
  name: string,
  email: string,
  whatsapp: string,
  college: string,
  department: string,
  year: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      userEmail: email.toLowerCase().trim(),
      whatsapp: whatsapp.trim(),
      college: college.trim(),
      department: department.trim(),
      year: year,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating personal info:", error);
    return false;
  }
}

/**
 * Update contact details (Direct Firestore)
 */
export async function updateContactDetails(
  registrationId: string,
  emergencyContact: string,
  emergencyPhone: string,
  dietaryRestrictions: string,
  accessibility: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      "contactDetails.emergencyContact": emergencyContact,
      "contactDetails.emergencyPhone": emergencyPhone,
      "contactDetails.dietaryRestrictions": dietaryRestrictions,
      "contactDetails.accessibility": accessibility,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating contact details:", error);
    return false;
  }
}

/**
 * Update registration status and payment (Direct Firestore)
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: string,
  paymentStatus: string,
  ispass: boolean,
  selectedPassId?: number
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      status: status,
      paymentStatus: paymentStatus,
      ispass: ispass,
      selectedPassId: selectedPassId || null,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating registration status:", error);
    return false;
  }
}

/**
 * Update selected events for a registration (Direct Firestore)
 */
export async function updateSelectedEvents(
  registrationId: string,
  selectedEvents: any[]
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      selectedEvents: selectedEvents,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating selected events:", error);
    return false;
  }
}

/**
 * Update selected workshops for a registration (Direct Firestore)
 */
export async function updateSelectedWorkshops(
  registrationId: string,
  selectedWorkshops: any[]
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      selectedWorkshops: selectedWorkshops,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating selected workshops:", error);
    return false;
  }
}

/**
 * Update selected non-tech events for a registration (Direct Firestore)
 */
export async function updateSelectedNonTechEvents(
  registrationId: string,
  selectedNonTechEvents: any[]
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      selectedNonTechEvents: selectedNonTechEvents,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating selected non-tech events:", error);
    return false;
  }
}

/**
 * Update team information for a registration (Direct Firestore)
 */
export async function updateTeamInfo(
  registrationId: string,
  isTeamEvent: boolean,
  teamSize: number,
  teamMembers: any[]
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, where("registrationId", "==", registrationId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      isTeamEvent: isTeamEvent,
      teamSize: teamSize,
      teamMembers: teamMembers,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error updating team info:", error);
    return false;
  }
}
