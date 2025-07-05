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

export interface FirebaseRegistration
  extends Omit<RegistrationFormData, "hasConsented"> {
  id: string;
  registrationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "verified" | "failed";
  selectedEvents: any[]; // Flexible to handle both number[] and {id, title}[]
  selectedWorkshops: any[]; // Flexible to handle both number[] and {id, title}[]
  selectedNonTechEvents: any[]; // Flexible to handle both number[] and {id, title}[]
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
      whatsapp: formData.whatsapp.trim(),
      college: formData.college.trim(),
      year: formData.year,
      isTeamEvent: formData.isTeamEvent,
      teamSize: formData.teamSize,
      teamMembers: formData.teamMembers || [],
      selectedEvents: formData.selectedEvents,
      selectedWorkshops: formData.selectedWorkshops,
      selectedNonTechEvents: formData.selectedNonTechEvents,
      transactionIds: formData.transactionIds,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "pending",
      paymentStatus: "pending",
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
 * Update registration status
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: "pending" | "confirmed" | "cancelled"
): Promise<boolean> {
  try {
    const registrationDoc = doc(db, "registrations", registrationId);
    await updateDoc(registrationDoc, {
      status,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error updating registration status:", error);
    return false;
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
