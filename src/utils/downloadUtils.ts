// tech-fiesta-admin/src/utils/downloadUtils.ts

import jsPDF from "jspdf";
import { FirebaseRegistration } from "@/services/registrationService";
import { citLogoBase64, asymmetricLogoBase64, techFiestaLogoBase64 } from "./logoUtils";

export interface RegistrationDownloadData extends FirebaseRegistration {
  submissionDate: string;
}

export const downloadRegistrationPDF = (data: RegistrationDownloadData) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

let yPosition: number;

interface TeamMember {
    name: string;
    email: string;
    department: string;
    year?: string;
}

interface EventItem {
    title: string;
}

interface RegistrationDownloadData extends Omit<FirebaseRegistration, 'teamMembers'> {
    submissionDate: string;
    isTeamEvent: boolean;
    teamMembers: TeamMember[]; // Always an array, not undefined
    selectedEvents: EventItem[];
    selectedWorkshops: EventItem[];
    selectedNonTechEvents: EventItem[];
    registrationId: string;
    name: string;
    college: string;
    department: string;
    year: string;
    email: string;
    whatsapp: string;
}

  // --- Helper to add detail rows ---
  const addDetailRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(value || "Not Provided", margin + 50, yPosition);
    yPosition += 8;
  };

  // --- ============== PAGE 1 ============== ---

  // --- Header Section ---
  yPosition = 15;
  doc.addImage(citLogoBase64, 'JPEG', margin, yPosition, 30, 30, undefined, 'FAST');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Chennai Institute of Technology", pageWidth / 2, yPosition + 12, { align: "center" });
  yPosition += 25;
  doc.addImage(techFiestaLogoBase64, 'PNG', pageWidth / 2 - 15, yPosition, 40, 25, undefined, 'FAST');
  doc.addImage(asymmetricLogoBase64, 'PNG', pageWidth - margin - 50, yPosition + 5, 60, 20, undefined, 'FAST');
  yPosition += 35;
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // --- Confirmation Title ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Registration Confirmation", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 20;

  // --- Participant Details Section ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Participant Details", margin, yPosition);
  yPosition += 10;
  addDetailRow("Name:", data.name);
  addDetailRow("College:", data.college);
  addDetailRow("Department:", data.department);
  addDetailRow("Year of Study:", data.year);
  addDetailRow("Email:", data.email);
  addDetailRow("WhatsApp:", data.whatsapp);
  yPosition += 10;
  
  // --- Event Information Section ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Event Information", margin, yPosition);
  yPosition += 10;
  addDetailRow("Date:", "30th July 2025");
  addDetailRow("Time:", "8:00 AM - 3:00 PM");
  addDetailRow("Venue:", "Chennai Institute of Technology, Kundrathur");
  
  // --- Registration ID Section (on Page 1) ---
  yPosition += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Registration ID", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;
  doc.setFont("courier", "bold");
  doc.setFontSize(20);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 8, pageWidth - margin * 2, 14, "F");
  doc.text(data.registrationId, pageWidth / 2, yPosition, { align: "center" });


  // --- ============== PAGE 2 ============== ---
  doc.addPage();
  yPosition = margin + 10; // Reset Y position for the new page

  // --- Team Members Section (if applicable) ---
  if (data.isTeamEvent && data.teamMembers && data.teamMembers.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Team Members", margin, yPosition);
    yPosition += 10;
    
    // Team Leader (Primary Registrant)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Team Leader (Participant 1)", margin, yPosition);
    yPosition += 8;
    addDetailRow("Name:", data.name);
    addDetailRow("Email:", data.email);
    yPosition += 5;

    // Other Team Members
    data.teamMembers.forEach((member, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Participant ${index + 2}`, margin, yPosition);
      yPosition += 8;
      addDetailRow("Name:", member.name);
      addDetailRow("Email:", member.email);
      addDetailRow("Dept:", member.department);
      if (member.year) {
        addDetailRow("Year:", member.year);
      }
      yPosition += 5;
    });
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
  }

  // --- Registered Events & Workshops Section ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Registered Events & Workshops", margin, yPosition);
  yPosition += 10;

  const addEventListItem = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`• ${text}`, margin + 5, yPosition);
    yPosition += 7;
  };

  if (data.selectedEvents.length === 0 && data.selectedWorkshops.length === 0 && data.selectedNonTechEvents.length === 0) {
    addEventListItem("General Entry");
  } else {
    if (data.selectedEvents.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Technical Events:", margin, yPosition);
        yPosition += 8;
        data.selectedEvents.forEach(event => addEventListItem(event.title));
        yPosition += 5;
    }
    if (data.selectedWorkshops.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Workshops:", margin, yPosition);
        yPosition += 8;
        data.selectedWorkshops.forEach(ws => addEventListItem(ws.title));
        yPosition += 5;
    }
    if (data.selectedNonTechEvents.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Non-Technical Events:", margin, yPosition);
        yPosition += 8;
        data.selectedNonTechEvents.forEach(event => addEventListItem(event.title));
    }
  }

  // --- Footer (OD Statement and contact info) ---
  const drawFooter = (pageNumber: number) => {
    doc.setPage(pageNumber);
    let footerY = pageHeight - 40;
    doc.setDrawColor(200);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    footerY += 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    const odStatement = "This document serves as official proof of registration for Tech Fiesta 2025, hosted at Chennai Institute of Technology. It may be presented to college authorities for the purpose of obtaining On-Duty (OD) permission.";
    const lines = doc.splitTextToSize(odStatement, pageWidth - margin * 2);
    doc.text(lines, margin, footerY);
    
    footerY = pageHeight - 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Date Issued: ${data.submissionDate}`, margin, footerY);
    doc.text("For verification, contact: asymmetric@citchennai.net", pageWidth - margin, footerY, { align: "right" });
  };
  
  // Draw footer on the last page
  drawFooter(doc.internal.pages.length);

  // --- Save the final PDF ---
  doc.save(`Tech-Fiesta-2025-Registration-${data.registrationId}.pdf`);
};