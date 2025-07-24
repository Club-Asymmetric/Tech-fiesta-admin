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

  // Edit Tracking
  editHistory?: Array<{
    editedAt: Timestamp;
    editedBy: string; // email or user ID of the person who made the edit
    editedFields: string[]; // array of field names that were changed
    previousValues?: any; // optional: store previous values
  }>;

  // Payment Information
  transactionIds: Record<string, any>;
  paymentAmount?: number; // Total amount paid by the user
}

export interface DuplicateCheck {
  exists: boolean;
  duplicateFields: string[];
  existingRegistration?: FirebaseRegistration;
}

/**
 * Helper function to track form edits
 */
export async function trackFormEdit(
  registrationId: string,
  editedBy: string,
  editedFields: string[],
  previousValues?: any
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    const newEditEntry = {
      editedAt: Timestamp.now(),
      editedBy: editedBy,
      editedFields: editedFields,
      ...(previousValues && { previousValues })
    };

    const updatedEditHistory = [
      ...(currentData.editHistory || []),
      newEditEntry
    ];

    await updateDoc(docRef, {
      editHistory: updatedEditHistory,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error tracking form edit:", error);
    return false;
  }
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
      
      // Initialize edit tracking
      editHistory: [],
      
      // Initialize payment amount
      paymentAmount: 0,
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
  paymentStatus: "pending" | "verified" | "failed",
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.paymentStatus !== paymentStatus) {
      editedFields.push('paymentStatus');
      previousValues.paymentStatus = currentData.paymentStatus;
    }
    
    await updateDoc(docRef, {
      paymentStatus,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

    return true;
  } catch (error) {
    console.error("Error updating payment status:", error);
    return false;
  }
}

/**
 * Get all registrations with admin fields (Direct Firestore)
 */
export async function getAllRegistrationsForAdmin(): Promise<
  FirebaseRegistration[]
> {
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
    return registrations.sort(
      (a, b) => b.createdAt.seconds - a.createdAt.seconds
    );
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
  notes: string = "",
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.arrivalStatus?.hasArrived !== hasArrived) {
      editedFields.push('arrivalStatus.hasArrived');
      previousValues.hasArrived = currentData.arrivalStatus?.hasArrived;
    }
    if (currentData.arrivalStatus?.notes !== notes) {
      editedFields.push('arrivalStatus.notes');
      previousValues.notes = currentData.arrivalStatus?.notes;
    }
    
    await updateDoc(docRef, {
      "arrivalStatus.hasArrived": hasArrived,
      "arrivalStatus.arrivalTime": hasArrived ? Timestamp.now() : null,
      "arrivalStatus.notes": notes,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  workshopAttended?: boolean,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (Number(currentData.workshopDetails?.selectedWorkshop) !== selectedWorkshop) {
      editedFields.push('workshopDetails.selectedWorkshop');
      previousValues.selectedWorkshop = currentData.workshopDetails?.selectedWorkshop;
    }
    if (currentData.workshopDetails?.workshopTitle !== workshopTitle) {
      editedFields.push('workshopDetails.workshopTitle');
      previousValues.workshopTitle = currentData.workshopDetails?.workshopTitle;
    }
    if (workshopAttended !== undefined && currentData.workshopDetails?.workshopAttended !== workshopAttended) {
      editedFields.push('workshopDetails.workshopAttended');
      previousValues.workshopAttended = currentData.workshopDetails?.workshopAttended;
    }
    
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

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  attended: boolean,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.workshopDetails?.workshopAttended !== attended) {
      editedFields.push('workshopDetails.workshopAttended');
      previousValues.workshopAttended = currentData.workshopDetails?.workshopAttended;
    }
    
    await updateDoc(docRef, {
      "workshopDetails.workshopAttended": attended,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  amountPaid: number = 0,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const registration = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    } as FirebaseRegistration;
    const eventAttendance = registration.eventAttendance || {
      techEvents: [],
      workshops: [],
      nonTechEvents: [],
    };

    const eventArray = eventAttendance[eventType] || [];
    const eventIndex = eventArray.findIndex(
      (e: any) => e.eventId === eventId || e.workshopId === eventId
    );

    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (eventIndex !== -1) {
      // Update existing event attendance
      const currentEvent = eventArray[eventIndex];
      if (currentEvent.attended !== attended) {
        editedFields.push(`eventAttendance.${eventType}[${eventIndex}].attended`);
        previousValues.attended = currentEvent.attended;
      }
      if (currentEvent.notes !== notes) {
        editedFields.push(`eventAttendance.${eventType}[${eventIndex}].notes`);
        previousValues.notes = currentEvent.notes;
      }
      if (eventType === "nonTechEvents") {
        if (currentEvent.paidOnArrival !== paidOnArrival) {
          editedFields.push(`eventAttendance.${eventType}[${eventIndex}].paidOnArrival`);
          previousValues.paidOnArrival = currentEvent.paidOnArrival;
        }
        if (currentEvent.amountPaid !== amountPaid) {
          editedFields.push(`eventAttendance.${eventType}[${eventIndex}].amountPaid`);
          previousValues.amountPaid = currentEvent.amountPaid;
        }
      }
      
      eventArray[eventIndex] = {
        ...eventArray[eventIndex],
        attended,
        attendanceTime: attended ? Timestamp.now() : null,
        notes,
        ...(eventType === "nonTechEvents" && { paidOnArrival, amountPaid }),
      };
    } else {
      // Create new event attendance record
      editedFields.push(`eventAttendance.${eventType}.added`);
      const newAttendanceRecord = {
        eventId,
        attended,
        attendanceTime: attended ? Timestamp.now() : null,
        notes,
        ...(eventType === "nonTechEvents" && { paidOnArrival, amountPaid }),
      };
      eventArray.push(newAttendanceRecord);
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      [`eventAttendance.${eventType}`]: eventArray,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  flagReason: string,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Ensure the adminNotes structure exists
    if (!currentData.adminNotes) {
      console.log(`Admin notes structure missing for ${registrationId}, creating it...`);
      await updateDoc(docRef, {
        "adminNotes.generalNotes": "",
        "adminNotes.specialRequirements": "",
        "adminNotes.flagged": false,
        "adminNotes.flagReason": "",
        "adminNotes.lastModifiedAt": null,
        "adminNotes.lastModifiedBy": null,
      });
      // Refetch the data after creating the structure
      const updatedSnapshot = await getDocs(q);
      const updatedData = updatedSnapshot.docs[0].data() as FirebaseRegistration;
      currentData.adminNotes = updatedData.adminNotes;
    }
    
    console.log(`Updating admin notes for ${registrationId}`, {
      editedBy,
      currentNotes: currentData.adminNotes,
      newValues: { generalNotes, specialRequirements, flagged, flagReason }
    });
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.adminNotes?.generalNotes !== generalNotes) {
      editedFields.push('adminNotes.generalNotes');
      previousValues.generalNotes = currentData.adminNotes?.generalNotes;
    }
    if (currentData.adminNotes?.specialRequirements !== specialRequirements) {
      editedFields.push('adminNotes.specialRequirements');
      previousValues.specialRequirements = currentData.adminNotes?.specialRequirements;
    }
    if (currentData.adminNotes?.flagged !== flagged) {
      editedFields.push('adminNotes.flagged');
      previousValues.flagged = currentData.adminNotes?.flagged;
    }
    if (currentData.adminNotes?.flagReason !== flagReason) {
      editedFields.push('adminNotes.flagReason');
      previousValues.flagReason = currentData.adminNotes?.flagReason;
    }
    
    // Always update lastModifiedAt and lastModifiedBy when the function is called
    const updateData = {
      "adminNotes.generalNotes": generalNotes,
      "adminNotes.specialRequirements": specialRequirements,
      "adminNotes.flagged": flagged,
      "adminNotes.flagReason": flagReason,
      "adminNotes.lastModifiedAt": Timestamp.now(),
      "adminNotes.lastModifiedBy": editedBy || "unknown",
      updatedAt: Timestamp.now(),
    };
    
    console.log(`About to update admin notes:`, updateData);
    
    await updateDoc(docRef, updateData);

    console.log(`Updated admin notes for ${registrationId}, editedBy: ${editedBy}, changes: ${editedFields.length}`);

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    } else if (editedFields.length > 0) {
      console.log("Changes detected but no editedBy provided:", editedFields);
    }

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
  year: string,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Migrate structure if needed (for older registrations)
    await migrateRegistrationStructure(registrationId);
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.name !== name.trim()) {
      editedFields.push('name');
      previousValues.name = currentData.name;
    }
    if (currentData.email !== email.toLowerCase().trim()) {
      editedFields.push('email');
      previousValues.email = currentData.email;
    }
    if (currentData.whatsapp !== whatsapp.trim()) {
      editedFields.push('whatsapp');
      previousValues.whatsapp = currentData.whatsapp;
    }
    if (currentData.college !== college.trim()) {
      editedFields.push('college');
      previousValues.college = currentData.college;
    }
    if (currentData.department !== department.trim()) {
      editedFields.push('department');
      previousValues.department = currentData.department;
    }
    if (currentData.year !== year) {
      editedFields.push('year');
      previousValues.year = currentData.year;
    }
    
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

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  accessibility: string,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Migrate structure if needed (for older registrations)
    await migrateRegistrationStructure(registrationId);
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.contactDetails?.emergencyContact !== emergencyContact) {
      editedFields.push('contactDetails.emergencyContact');
      previousValues.emergencyContact = currentData.contactDetails?.emergencyContact;
    }
    if (currentData.contactDetails?.emergencyPhone !== emergencyPhone) {
      editedFields.push('contactDetails.emergencyPhone');
      previousValues.emergencyPhone = currentData.contactDetails?.emergencyPhone;
    }
    if (currentData.contactDetails?.dietaryRestrictions !== dietaryRestrictions) {
      editedFields.push('contactDetails.dietaryRestrictions');
      previousValues.dietaryRestrictions = currentData.contactDetails?.dietaryRestrictions;
    }
    if (currentData.contactDetails?.accessibility !== accessibility) {
      editedFields.push('contactDetails.accessibility');
      previousValues.accessibility = currentData.contactDetails?.accessibility;
    }
    
    await updateDoc(docRef, {
      "contactDetails.emergencyContact": emergencyContact,
      "contactDetails.emergencyPhone": emergencyPhone,
      "contactDetails.dietaryRestrictions": dietaryRestrictions,
      "contactDetails.accessibility": accessibility,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  selectedPassId?: number,
  editedBy?: string // Add this parameter to track who made the edit
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track what fields are being changed
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.status !== status) {
      editedFields.push('status');
      previousValues.status = currentData.status;
    }
    if (currentData.paymentStatus !== paymentStatus) {
      editedFields.push('paymentStatus');
      previousValues.paymentStatus = currentData.paymentStatus;
    }
    if (currentData.ispass !== ispass) {
      editedFields.push('ispass');
      previousValues.ispass = currentData.ispass;
    }
    if (currentData.selectedPassId !== (selectedPassId || null)) {
      editedFields.push('selectedPassId');
      previousValues.selectedPassId = currentData.selectedPassId;
    }

    await updateDoc(docRef, {
      status: status,
      paymentStatus: paymentStatus,
      ispass: ispass,
      selectedPassId: selectedPassId || null,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

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
  selectedEvents: any[],
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const previousEvents = currentData.selectedEvents || [];
    const hasChanged = JSON.stringify(previousEvents) !== JSON.stringify(selectedEvents);
    
    await updateDoc(docRef, {
      selectedEvents: selectedEvents,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (hasChanged && editedBy) {
      await trackFormEdit(
        registrationId, 
        editedBy, 
        ['selectedEvents'], 
        { selectedEvents: previousEvents }
      );
    }

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
  selectedWorkshops: any[],
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const previousWorkshops = currentData.selectedWorkshops || [];
    const hasChanged = JSON.stringify(previousWorkshops) !== JSON.stringify(selectedWorkshops);
    
    await updateDoc(docRef, {
      selectedWorkshops: selectedWorkshops,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (hasChanged && editedBy) {
      await trackFormEdit(
        registrationId, 
        editedBy, 
        ['selectedWorkshops'], 
        { selectedWorkshops: previousWorkshops }
      );
    }

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
  selectedNonTechEvents: any[],
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const previousNonTechEvents = currentData.selectedNonTechEvents || [];
    const hasChanged = JSON.stringify(previousNonTechEvents) !== JSON.stringify(selectedNonTechEvents);
    
    await updateDoc(docRef, {
      selectedNonTechEvents: selectedNonTechEvents,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (hasChanged && editedBy) {
      await trackFormEdit(
        registrationId, 
        editedBy, 
        ['selectedNonTechEvents'], 
        { selectedNonTechEvents: previousNonTechEvents }
      );
    }

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
  teamMembers: any[],
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track changes
    const editedFields: string[] = [];
    const previousValues: any = {};
    
    if (currentData.isTeamEvent !== isTeamEvent) {
      editedFields.push('isTeamEvent');
      previousValues.isTeamEvent = currentData.isTeamEvent;
    }
    if (currentData.teamSize !== teamSize) {
      editedFields.push('teamSize');
      previousValues.teamSize = currentData.teamSize;
    }
    if (JSON.stringify(currentData.teamMembers || []) !== JSON.stringify(teamMembers)) {
      editedFields.push('teamMembers');
      previousValues.teamMembers = currentData.teamMembers;
    }
    
    await updateDoc(docRef, {
      isTeamEvent: isTeamEvent,
      teamSize: teamSize,
      teamMembers: teamMembers,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if there were changes and editedBy is provided
    if (editedFields.length > 0 && editedBy) {
      await trackFormEdit(registrationId, editedBy, editedFields, previousValues);
    }

    return true;
  } catch (error) {
    console.error("Error updating team info:", error);
    return false;
  }
}

/**
 * Create manual registration (Admin only)
 */
export async function createManualRegistration(registrationData: {
  // Personal Information
  name: string;
  email: string;
  whatsapp: string;
  college: string;
  department: string;
  year: string;

  // Event Selections
  selectedEvents: any[];
  selectedWorkshops: any[];
  selectedNonTechEvents: any[];
  isTeamEvent: boolean;
  teamSize: number;
  teamMembers: any[];

  // Pass Information
  ispass: boolean;
  selectedPassId: number | null;

  // Contact Details
  contactDetails: {
    emergencyContact: string;
    emergencyPhone: string;
    dietaryRestrictions: string;
    accessibility: string;
  };

  // Status
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "verified" | "failed" | "not-required";

  // Admin Notes
  adminNotes: {
    generalNotes: string;
    specialRequirements: string;
    flagged: boolean;
    flagReason: string;
  };

  // Created by admin info
  createdBy: string;
}, editedBy?: string): Promise<{ success: boolean; registrationId: string; message: string }> {
  try {
    // Generate registration ID
    const registrationId = `REG-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Create registration object
    const registration = {
      registrationId,
      userId: `admin-created-${Date.now()}`,
      userEmail: registrationData.email,
      name: registrationData.name,
      email: registrationData.email,
      whatsapp: registrationData.whatsapp,
      college: registrationData.college,
      department: registrationData.department,
      year: registrationData.year,
      hasConsented: true, // Assumed for manual registration

      // Event Information
      selectedEvents: registrationData.selectedEvents,
      selectedWorkshops: registrationData.selectedWorkshops,
      selectedNonTechEvents: registrationData.selectedNonTechEvents,
      eventCount: registrationData.selectedEvents?.length || 0,
      isTeamEvent: registrationData.isTeamEvent,
      teamSize: registrationData.teamSize,
      teamMembers: registrationData.teamMembers,

      // Pass Information
      ispass: registrationData.ispass,
      selectedPassId: registrationData.selectedPassId,

      // Contact Details
      contactDetails: registrationData.contactDetails,

      // Arrival Status (Not arrived by default)
      arrivalStatus: {
        hasArrived: false,
        arrivalTime: null,
        checkedInBy: null,
        notes: "",
      },

      // Workshop Details
      workshopDetails: {
        selectedWorkshop:
          registrationData.selectedWorkshops.length > 0
            ? registrationData.selectedWorkshops[0].id ||
              registrationData.selectedWorkshops[0]
            : null,
        workshopTitle:
          registrationData.selectedWorkshops.length > 0
            ? registrationData.selectedWorkshops[0].title ||
              registrationData.selectedWorkshops[0]
            : "",
        canEditWorkshop: true,
        workshopAttended: false,
        workshopAttendanceTime: null,
      },

      // Event Attendance (Empty by default)
      eventAttendance: {
        techEvents: [],
        nonTechEvents: [],
        workshops: [],
      },

      // Admin Notes
      adminNotes: {
        ...registrationData.adminNotes,
        lastModifiedAt: Timestamp.now(),
        lastModifiedBy: registrationData.createdBy,
      },

      // Status and Payment
      status: registrationData.status,
      paymentStatus: registrationData.paymentStatus,

      // Edit History - Initialize with creation entry
      editHistory: [{
        editedAt: Timestamp.now(),
        editedBy: editedBy || registrationData.createdBy,
        editedFields: ['manual_creation'],
        previousValues: { created_manually: true }
      }],

      // Payment amount
      paymentAmount: 0,

      // Transaction IDs (Empty for manual registration)
      transactionIds: {},

      // Timestamps
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, "registrations"), registration);

    console.log("Manual registration created successfully:", docRef.id);

    return {
      success: true,
      registrationId,
      message: `Manual registration created successfully! Registration ID: ${registrationId}`,
    };
  } catch (error) {
    console.error("Error creating manual registration:", error);
    return {
      success: false,
      registrationId: "",
      message: "Failed to create manual registration. Please try again.",
    };
  }
}

/**
 * Migrate/fix incomplete registration documents to have full structure
 */
export async function migrateRegistrationStructure(
  registrationId: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data();

    // Build the missing structure
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Add missing contactDetails
    if (!currentData.contactDetails) {
      updateData.contactDetails = {
        accessibility: "",
        dietaryRestrictions: "",
        emergencyContact: "",
        emergencyPhone: "",
      };
    }

    // Add missing arrivalStatus
    if (!currentData.arrivalStatus) {
      updateData.arrivalStatus = {
        hasArrived: false,
        arrivalTime: null,
        checkedInBy: null,
        notes: "",
      };
    }

    // Add missing workshopDetails
    if (!currentData.workshopDetails) {
      updateData.workshopDetails = {
        selectedWorkshop: null,
        workshopTitle: "",
        canEditWorkshop: false,
        workshopAttended: false,
        workshopAttendanceTime: null,
      };
    }

    // Add missing eventAttendance
    if (!currentData.eventAttendance) {
      updateData.eventAttendance = {
        techEvents: [],
        nonTechEvents: [],
        workshops: [],
      };
    }

    // Add missing adminNotes
    if (!currentData.adminNotes) {
      updateData.adminNotes = {
        generalNotes: "",
        specialRequirements: "",
        flagged: false,
        flagReason: "",
        lastModifiedAt: null,
        lastModifiedBy: null,
      };
    }

    // Add missing editHistory
    if (!currentData.editHistory) {
      updateData.editHistory = [];
    }

    // Add missing paymentAmount
    if (currentData.paymentAmount === undefined) {
      updateData.paymentAmount = 0;
    }

    // Only update if there are missing fields
    const hasUpdates = Object.keys(updateData).length > 1; // > 1 because updatedAt is always added
    
    if (hasUpdates) {
      await updateDoc(docRef, updateData);
      console.log(`Migrated registration structure for: ${registrationId}`);
    }

    return true;
  } catch (error) {
    console.error("Error migrating registration structure:", error);
    return false;
  }
}

/**
 * Migrate all registrations to have complete structure (Admin utility)
 */
export async function migrateAllRegistrations(): Promise<{
  success: boolean;
  migratedCount: number;
  totalCount: number;
  message: string;
}> {
  try {
    const registrationsRef = collection(db, "registrations");
    const querySnapshot = await getDocs(registrationsRef);
    
    let migratedCount = 0;
    const totalCount = querySnapshot.docs.length;
    
    console.log(`Starting migration of ${totalCount} registrations...`);
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const registrationId = data.registrationId;
      
      if (registrationId) {
        const migrated = await migrateRegistrationStructure(registrationId);
        if (migrated) {
          migratedCount++;
        }
      }
    }
    
    console.log(`Migration complete: ${migratedCount}/${totalCount} registrations migrated`);
    
    return {
      success: true,
      migratedCount,
      totalCount,
      message: `Successfully migrated ${migratedCount} out of ${totalCount} registrations`,
    };
  } catch (error) {
    console.error("Error during bulk migration:", error);
    return {
      success: false,
      migratedCount: 0,
      totalCount: 0,
      message: "Failed to migrate registrations",
    };
  }
}

/**
 * Update payment amount for a registration (Direct Firestore)
 */
export async function updatePaymentAmount(
  registrationId: string,
  paymentAmount: number,
  editedBy?: string
): Promise<boolean> {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(
      registrationsRef,
      where("registrationId", "==", registrationId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Registration not found");
    }

    const docRef = doc(db, "registrations", querySnapshot.docs[0].id);
    const currentData = querySnapshot.docs[0].data() as FirebaseRegistration;
    
    // Track the change
    const previousAmount = currentData.paymentAmount || 0;
    
    await updateDoc(docRef, {
      paymentAmount: paymentAmount,
      updatedAt: Timestamp.now(),
    });

    // Track the edit if editedBy is provided and amount changed
    if (editedBy && previousAmount !== paymentAmount) {
      await trackFormEdit(
        registrationId, 
        editedBy, 
        ['paymentAmount'], 
        { paymentAmount: previousAmount }
      );
    }

    return true;
  } catch (error) {
    console.error("Error updating payment amount:", error);
    return false;
  }
}
