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

  // --- Helper to add detail rows ---
  const addDetailRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(value || "Not Provided", margin + 60, yPosition);
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
  yPosition += 12;

  // --- Promotional Title ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TECH FIESTA '25 - National-Level Tech Fest", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Prize Pool Worth 1.5 Lakhs!", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // --- Participant Details Section ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Registration Confirmation", margin, yPosition);
  yPosition += 10;
  addDetailRow("Participant Name:", data.name);
  addDetailRow("College:", data.college);
  addDetailRow("Department:", data.department);
  yPosition += 10;

  // --- Event Information Section ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Event Information", margin, yPosition);
  yPosition += 10;
  addDetailRow("Date:", "30th July 2025");
  addDetailRow("Time:", "8:00 AM - 3:00 PM");
  addDetailRow("Venue:", "Chennai Institute of Technology, Kundrathur");
  
  // --- Event Description ---
  yPosition += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  const eventDescription = "Tech Fiesta '25 is a national-level tech extravaganza packed into one high-energy day of learning, innovation, and competition. Open to students from all colleges across India, the event features 7+ tech challenges, 6+ expert-led workshops, and 5+ creative non-tech events.";
  const lines = doc.splitTextToSize(eventDescription, pageWidth - margin * 2);
  doc.text(lines, margin, yPosition);

  // --- Footer for Page 1 ---
  let footerY = pageHeight - 40;
  doc.setDrawColor(200);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  footerY += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  const odStatement = "This document serves as official proof of registration for Tech Fiesta 2025. It may be presented to college authorities for the purpose of obtaining On-Duty (OD) permission.";
  doc.text(doc.splitTextToSize(odStatement, pageWidth - margin * 2), margin, footerY);
  
  footerY = pageHeight - 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Date Issued: ${data.submissionDate}`, margin, footerY);
  doc.text("For verification, contact: asymmetric@citchennai.net", pageWidth - margin, footerY, { align: "right" });


  // --- ============== PAGE 2 ============== ---
  doc.addPage();
  yPosition = margin + 10;
  doc.setTextColor(0, 0, 0);

  // --- Registration ID Section (Moved to Page 2) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Registration ID", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;
  doc.setFont("courier", "bold");
  doc.setFontSize(20);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 8, pageWidth - margin * 2, 14, "F");
  doc.text(data.registrationId, pageWidth / 2, yPosition, { align: "center" });
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

  // --- Team Members Section (if applicable) ---
  if (data.isTeamEvent && data.teamMembers && data.teamMembers.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Team Details", margin, yPosition);
    yPosition += 10;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Team Leader (Participant 1)", margin, yPosition);
    yPosition += 8;
    addDetailRow("Name:", data.name);
    addDetailRow("Email:", data.email);
    yPosition += 5;

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
  doc.text("Access & Registered Events", margin, yPosition);
  yPosition += 10;

  const addEventListItem = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`• ${text}`, margin + 5, yPosition);
    yPosition += 7;
  };
  
  // --- Check for a pass ---
  if (data.ispass || data.selectedPassId) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pass Holder: Tech Fiesta General Pass", margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 102, 0); // Green color for emphasis
    doc.text("Unlimited Access to ALL Technical Events and Non-Technical Events but limited to one Workshop", margin + 5, yPosition);
    yPosition += 10;
    doc.setTextColor(0, 0, 0); // Reset color
  }

  // --- List selected workshops and non-tech events for everyone ---
  if (data.selectedWorkshops.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Registered Workshops:", margin, yPosition);
      yPosition += 8;
      data.selectedWorkshops.forEach(ws => addEventListItem(ws.title));
      yPosition += 5;
  }
  else if (data.selectedEvents.length === 0 && data.selectedWorkshops.length === 0 && data.selectedNonTechEvents.length === 0) {
    addEventListItem("General Entry");
  } 
  else {
    // --- For non-pass holders, list their selected technical events ---
    if (!data.ispass && !data.selectedPassId && data.selectedEvents.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Registered Technical Events:", margin, yPosition);
        yPosition += 8;
        data.selectedEvents.forEach(event => addEventListItem(event.title));
        yPosition += 5;
    }
    
    if (data.selectedNonTechEvents.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Registered Non-Technical Events:", margin, yPosition);
        yPosition += 8;
        data.selectedNonTechEvents.forEach(event => addEventListItem(event.title));
    }
  }
  // --- Footer for Page 2 ---
  let footerY2 = pageHeight - 40;
  doc.setDrawColor(200);
  doc.line(margin, footerY2, pageWidth - margin, footerY2);
  footerY2 += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  const odStatement2 = "This document serves as official proof of registration for Tech Fiesta 2025. It may be presented to college authorities for the purpose of obtaining On-Duty (OD) permission.";
  doc.text(doc.splitTextToSize(odStatement2, pageWidth - margin * 2), margin, footerY2);
  
  footerY2 = pageHeight - 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Date Issued: ${data.submissionDate}`, margin, footerY2);
  doc.text("For verification, contact: asymmetric@citchennai.net", pageWidth - margin, footerY2, { align: "right" });

  // --- Save the final PDF ---
  doc.save(`Tech-Fiesta-2025-Registration-${data.registrationId}.pdf`);
};