//@ts-nocheck

"use client";

import { useState, useEffect } from "react";
import {
  getAllRegistrationsForAdmin,
  FirebaseRegistration,
  updateArrivalStatus,
  updateWorkshopSelection,
  updateEventAttendance,
  updateAdminNotes,
  updatePersonalInfo,
  updateContactDetails,
  updateRegistrationStatus,
  updateSelectedEvents,
  updateSelectedWorkshops,
  updateSelectedNonTechEvents,
  updateTeamInfo,
  migrateAllRegistrations,
  migrateRegistrationStructure
} from "@/services/registrationService";
import {
  Download,
  Search,
  Eye,
  Mail,
  Phone,
  Edit2,
  X,
  BarChart3,
  Users,
  UserCheck,
  MapPin,
  BookOpen,
  Flag,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Star,
  Save,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import ManualRegistrationForm from "./ManualRegistrationForm";
import EmailManagement from "./EmailManagement";
import { getCurrentAdminUser } from '@/utils/adminAuth';

export default function EnhancedAdminDashboard() {
  const [registrations, setRegistrations] = useState<FirebaseRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterArrival, setFilterArrival] = useState<string>("all");
  const [selectedRegistration, setSelectedRegistration] =
    useState<FirebaseRegistration | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "arrival" | "events" | "notes" | "edit" | "email"
  >("overview");
  const [showManualRegistration, setShowManualRegistration] = useState(false);
  const [showEmailManagement, setShowEmailManagement] = useState(false);
  const [selectedRegistrations, setSelectedRegistrations] = useState<
    FirebaseRegistration[]
  >([]);



  // Editing states
  const [editValues, setEditValues] = useState<any>({});
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleSendIndividualEmail = async (
    registration: FirebaseRegistration
  ) => {
    setSendingEmail(registration.id);
    try {
      // Import the email service
      const { sendRegistrationConfirmationEmail } = await import(
        "@/services/emailService"
      );

      const result = await sendRegistrationConfirmationEmail(
        registration,
        true
      );

      if (result.success) {
        alert(`Email sent successfully to ${registration.email}`);
      } else {
        alert(`Failed to send email: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert(
        `Error sending email: ${(error as Error).message || "Unknown error"}`
      );
    } finally {
      setSendingEmail(null);
    }
  };

  

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getAllRegistrationsForAdmin();
      setRegistrations(data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrivalUpdate = async (
    registrationId: string,
    hasArrived: boolean,
    notes?: string
  ) => {
    try {
      const success = await updateArrivalStatus(
        registrationId,
        hasArrived,
        notes
      );
      if (success) {
        await fetchRegistrations(); // Refresh data
        setEditingField(null);
      } else {
        alert("Failed to update arrival status");
      }
    } catch (error) {
      console.error("Error updating arrival:", error);
      alert("Failed to update arrival status");
    }
  };

  const handleNotesUpdate = async (
    registrationId: string,
    generalNotes: string,
    specialRequirements: string,
    flagged: boolean,
    flagReason: string
  ) => {
    try {
      const success = await updateAdminNotes(
        registrationId,
        generalNotes,
        specialRequirements,
        flagged,
        flagReason
      );
      if (success) {
        await fetchRegistrations();
        setEditingField(null);
        setEditValues({});
      } else {
        alert("Failed to update notes");
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      alert("Failed to update notes");
    }
  };

  const handleEventsUpdate = async (
    registrationId: string,
    selectedEvents: any[]
  ) => {
    try {
      const success = await updateSelectedEvents(
        registrationId,
        selectedEvents
      );
      if (success) {
        await fetchRegistrations();
        setEditingField(null);
        setEditValues({});
      } else {
        alert("Failed to update events");
      }
    } catch (error) {
      console.error("Error updating events:", error);
      alert("Failed to update events");
    }
  };

  const handleWorkshopsUpdate = async (
    registrationId: string,
    selectedWorkshops: any[]
  ) => {
    try {
      const success = await updateSelectedWorkshops(
        registrationId,
        selectedWorkshops
      );
      if (success) {
        await fetchRegistrations();
        setEditingField(null);
        setEditValues({});
      } else {
        alert("Failed to update workshops");
      }
    } catch (error) {
      console.error("Error updating workshops:", error);
      alert("Failed to update workshops");
    }
  };

  const handleNonTechEventsUpdate = async (
    registrationId: string,
    selectedNonTechEvents: any[]
  ) => {
    try {
      const success = await updateSelectedNonTechEvents(
        registrationId,
        selectedNonTechEvents
      );
      if (success) {
        await fetchRegistrations();
        setEditingField(null);
        setEditValues({});
      } else {
        alert("Failed to update non-tech events");
      }
    } catch (error) {
      console.error("Error updating non-tech events:", error);
      alert("Failed to update non-tech events");
    }
  };

  const handleTeamInfoUpdate = async (
    registrationId: string,
    isTeamEvent: boolean,
    teamSize: number,
    teamMembers: any[]
  ) => {
    try {
      const success = await updateTeamInfo(
        registrationId,
        isTeamEvent,
        teamSize,
        teamMembers
      );
      if (success) {
        await fetchRegistrations();
        setEditingField(null);
        setEditValues({});
      } else {
        alert("Failed to update team info");
      }
    } catch (error) {
      console.error("Error updating team info:", error);
      alert("Failed to update team info");
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.college.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "all" || reg.status === filterStatus;

    const matchesArrival =
      filterArrival === "all" ||
      (filterArrival === "arrived" && reg.arrivalStatus?.hasArrived) ||
      (filterArrival === "not-arrived" && !reg.arrivalStatus?.hasArrived);

    return matchesSearch && matchesFilter && matchesArrival;
  });

  // Calculate comprehensive stats
  const totalMembers = registrations.reduce((total, reg) => {
    return total + (reg.teamSize || 1);
  }, 0);

  const arrivedCount = registrations.filter(
    (reg) => reg.arrivalStatus?.hasArrived
  ).length;
  const flaggedCount = registrations.filter(
    (reg) => reg.adminNotes?.flagged
  ).length;
  const passHoldersCount = registrations.filter((reg) => reg.ispass).length;

  const exportToCSV = () => {
    const csvHeaders = [
      "Registration ID",
      "Name",
      "Email",
      "WhatsApp",
      "College",
      "Department",
      "Year",
      "Team Event",
      "Team Size",
      "Team Members",
      "Event Count",
      "Has Pass",
      "Pass ID",
      "Selected Events",
      "Selected Workshops",
      "Non-Tech Events",
      "Status",
      "Payment Status",
      "Has Arrived",
      "Arrival Time",
      "Checked In By",
      "Selected Workshop",
      "Workshop Attended",
      "Emergency Contact",
      "Emergency Phone",
      "Dietary Restrictions",
      "Accessibility Needs",
      "Admin Notes",
      "Special Requirements",
      "Flagged",
      "Flag Reason",
      "Created At",
    ];

    const csvData = filteredRegistrations.map((reg) => [
      reg.registrationId,
      reg.name,
      reg.email,
      reg.whatsapp,
      reg.college,
      reg.department,
      reg.year,
      reg.isTeamEvent ? "Yes" : "No",
      reg.teamSize,
      reg.teamMembers && reg.teamMembers.length > 0
        ? reg.teamMembers
            .map(
              (member: any, index: number) =>
                `Member ${index + 2}: ${member.name || "N/A"} (${
                  member.email || "N/A"
                })`
            )
            .join("; ")
        : "No team members",
      reg.eventCount,
      reg.ispass ? "Yes" : "No",
      reg.selectedPassId || "",
      reg.selectedEvents
        .map((event) =>
          typeof event === "object" && event.title ? event.title : event
        )
        .join("; "),
      reg.selectedWorkshops
        .map((workshop) =>
          typeof workshop === "object" && workshop.title
            ? workshop.title
            : workshop
        )
        .join("; "),
      reg.selectedNonTechEvents
        .map((event) =>
          typeof event === "object" && event.title ? event.title : event
        )
        .join("; "),
      reg.status,
      reg.paymentStatus,
      reg.arrivalStatus?.hasArrived ? "Yes" : "No",
      reg.arrivalStatus?.arrivalTime
        ? new Date(
            reg.arrivalStatus.arrivalTime.seconds * 1000
          ).toLocaleString()
        : "",
      reg.arrivalStatus?.checkedInBy || "",
      reg.workshopDetails?.workshopTitle || "",
      reg.workshopDetails?.workshopAttended ? "Yes" : "No",
      reg.contactDetails?.emergencyContact || "",
      reg.contactDetails?.emergencyPhone || "",
      reg.contactDetails?.dietaryRestrictions || "",
      reg.contactDetails?.accessibility || "",
      reg.adminNotes?.generalNotes || "",
      reg.adminNotes?.specialRequirements || "",
      reg.adminNotes?.flagged ? "Yes" : "No",
      reg.adminNotes?.flagReason || "",
      reg.createdAt.toDate().toLocaleDateString(),
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tech-fiesta-registrations-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin" />
          Loading registrations...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Tech Fiesta 2025 - Enhanced Admin Dashboard
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowEmailManagement(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email Management
            </button>
            <button
              onClick={() => setShowManualRegistration(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Add Manual Registration
            </button>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Link>
            <button
              onClick={fetchRegistrations}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Total Registrations</h3>
                <p className="text-3xl font-bold">{registrations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-cyan-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Total Members</h3>
                <p className="text-3xl font-bold">{totalMembers}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Confirmed</h3>
                <p className="text-3xl font-bold">
                  {registrations.filter((r) => r.status === "confirmed").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Arrived</h3>
                <p className="text-3xl font-bold">{arrivedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Payment Verified</h3>
                <p className="text-3xl font-bold">
                  {
                    registrations.filter((r) => r.paymentStatus === "verified")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Pass Holders</h3>
                <p className="text-3xl font-bold">{passHoldersCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Flagged</h3>
                <p className="text-3xl font-bold">{flaggedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "arrival", label: "Arrival Tracking", icon: MapPin },
            { id: "events", label: "Event Attendance", icon: Calendar },
            { id: "notes", label: "Admin Notes", icon: FileText },
            { id: "edit", label: "Edit Details", icon: Edit2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, registration ID, or college..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={filterArrival}
            onChange={(e) => setFilterArrival(e.target.value)}
          >
            <option value="all">All Participants</option>
            <option value="arrived">Arrived</option>
            <option value="not-arrived">Not Arrived</option>
          </select>
        </div>

        {/* Enhanced Table Based on Active Tab */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "overview" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Registration ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">College</th>
                    <th className="px-4 py-3 text-left">Events</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-left">Pass</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Edit</th>
                    <th className="px-4 py-3 text-left">Arrival</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-gray-700 hover:bg-gray-750"
                    >
                      <td className="px-4 py-3 font-mono text-blue-400">
                        {registration.registrationId}
                        {registration.adminNotes?.flagged && (
                          <Flag className="inline h-4 w-4 ml-2 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">{registration.name}</td>
                      <td className="px-4 py-3">{registration.college}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs">
                          E: {registration.selectedEvents.length} | W:{" "}
                          {registration.selectedWorkshops.length} | NT:{" "}
                          {registration.selectedNonTechEvents.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {registration.isTeamEvent ? (
                          <div className="text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="px-2 py-1 bg-blue-600 rounded-full text-xs">
                                Team
                              </span>
                              <span>Size: {registration.teamSize}</span>
                            </div>
                            {registration.teamMembers &&
                              registration.teamMembers.length > 0 && (
                                <div className="text-gray-400">
                                  {registration.teamMembers
                                    .slice(0, 2)
                                    .map((member: any, index: number) => (
                                      <div key={index} className="truncate">
                                        {member.name || `Member ${index + 2}`}
                                      </div>
                                    ))}
                                  {registration.teamMembers.length > 2 && (
                                    <div className="text-gray-500">
                                      +{registration.teamMembers.length - 2}{" "}
                                      more
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-600">
                            Individual
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {registration.ispass ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-600">
                            {registration.selectedPassId !== undefined &&
                            registration.selectedPassId !== null &&
                            registration.selectedPassId !== ""
                              ? `Pass #${registration.selectedPassId}`
                              : "Pass"}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-600">
                            No Pass
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            registration.status === "confirmed"
                              ? "bg-green-600"
                              : registration.status === "pending"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                        >
                          {registration.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          {registration.editHistory && registration.editHistory.length > 0 ? (
                            <div>
                              <div className="text-yellow-400 font-medium">
                                {registration.editHistory.length} edit{registration.editHistory.length > 1 ? 's' : ''}
                              </div>
                              <div className="text-gray-400 truncate max-w-20" title={registration.editHistory[registration.editHistory.length - 1]?.editedBy}>
                                By: {registration.editHistory[registration.editHistory.length - 1]?.editedBy?.split('@')[0] || 'Unknown'}
                              </div>
                              <div className="text-gray-500">
                                {registration.editHistory[registration.editHistory.length - 1]?.editedAt && 
                                  new Date(registration.editHistory[registration.editHistory.length - 1].editedAt.seconds * 1000).toLocaleDateString()
                                }
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No edits</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {registration.arrivalStatus?.hasArrived ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-xs text-green-400">
                                {registration.arrivalStatus.arrivalTime &&
                                  new Date(
                                    registration.arrivalStatus.arrivalTime
                                      .seconds * 1000
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Not arrived
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setSelectedRegistration(registration)
                            }
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleSendIndividualEmail(registration)
                            }
                            disabled={sendingEmail === registration.id}
                            className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                            title="Send Confirmation Email"
                          >
                            {sendingEmail === registration.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </button>
                          <a
                            href={`https://wa.me/${registration.whatsapp}`}
                            className="p-1 text-green-400 hover:text-green-300"
                            title="WhatsApp"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "arrival" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Registration ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Arrival Status</th>
                    <th className="px-4 py-3 text-left">Arrival Time</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-gray-700 hover:bg-gray-750"
                    >
                      <td className="px-4 py-3 font-mono text-blue-400">
                        {registration.registrationId}
                      </td>
                      <td className="px-4 py-3">{registration.name}</td>
                      <td className="px-4 py-3">
                        {editingField === `arrival-${registration.id}` ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleArrivalUpdate(
                                  registration.registrationId,
                                  true
                                )
                              }
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                            >
                              Mark Arrived
                            </button>
                            <button
                              onClick={() =>
                                handleArrivalUpdate(
                                  registration.registrationId,
                                  false
                                )
                              }
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                            >
                              Mark Not Arrived
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                registration.arrivalStatus?.hasArrived
                                  ? "bg-green-600"
                                  : "bg-gray-600"
                              }`}
                            >
                              {registration.arrivalStatus?.hasArrived
                                ? "Arrived"
                                : "Not Arrived"}
                            </span>
                            <button
                              onClick={() =>
                                setEditingField(`arrival-${registration.id}`)
                              }
                              className="p-1 text-gray-400 hover:text-blue-400"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {registration.arrivalStatus?.arrivalTime
                          ? new Date(
                              registration.arrivalStatus.arrivalTime.seconds *
                                1000
                            ).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">
                          {registration.arrivalStatus?.notes || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedRegistration(registration)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "notes" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Registration ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">General Notes</th>
                    <th className="px-4 py-3 text-left">
                      Special Requirements
                    </th>
                    <th className="px-4 py-3 text-left">Flagged</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className={`border-b border-gray-700 hover:bg-gray-750 ${
                        registration.adminNotes?.flagged
                          ? "bg-red-900 bg-opacity-20"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-blue-400">
                        {registration.registrationId}
                      </td>
                      <td className="px-4 py-3">{registration.name}</td>
                      <td className="px-4 py-3">
                        {editingField === `notes-${registration.id}` ? (
                          <textarea
                            placeholder="General notes..."
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-xs"
                            value={
                              editValues.generalNotes ??
                              registration.adminNotes?.generalNotes ??
                              ""
                            }
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                generalNotes: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        ) : (
                          <span className="text-xs">
                            {registration.adminNotes?.generalNotes || "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingField === `notes-${registration.id}` ? (
                          <textarea
                            placeholder="Special requirements..."
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-xs"
                            value={
                              editValues.specialRequirements ??
                              registration.adminNotes?.specialRequirements ??
                              ""
                            }
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                specialRequirements: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        ) : (
                          <span className="text-xs">
                            {registration.adminNotes?.specialRequirements ||
                              "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingField === `notes-${registration.id}` ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={
                                  editValues.flagged ??
                                  registration.adminNotes?.flagged ??
                                  false
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    flagged: e.target.checked,
                                  })
                                }
                              />
                              <span className="text-xs">Flagged</span>
                            </div>
                            {(editValues.flagged !== undefined
                              ? editValues.flagged
                              : registration.adminNotes?.flagged) && (
                              <input
                                type="text"
                                placeholder="Flag reason..."
                                className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-xs"
                                value={
                                  editValues.flagReason ??
                                  registration.adminNotes?.flagReason ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    flagReason: e.target.value,
                                  })
                                }
                              />
                            )}
                          </div>
                        ) : (
                          <div>
                            {registration.adminNotes?.flagged ? (
                              <div className="flex items-center gap-1">
                                <Flag className="h-3 w-3 text-red-400" />
                                <span className="text-xs text-red-400">
                                  {registration.adminNotes.flagReason ||
                                    "Flagged"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Not flagged
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingField === `notes-${registration.id}` ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                handleNotesUpdate(
                                  registration.registrationId,
                                  editValues.generalNotes || "",
                                  editValues.specialRequirements || "",
                                  editValues.flagged || false,
                                  editValues.flagReason || ""
                                );
                              }}
                              className="p-1 text-green-400 hover:text-green-300"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingField(null);
                                setEditValues({});
                              }}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setEditingField(`notes-${registration.id}`)
                            }
                            className="p-1 text-gray-400 hover:text-blue-400"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "events" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Registration ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Selected Events</th>
                    <th className="px-4 py-3 text-left">Event Attendance</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-gray-700 hover:bg-gray-750"
                    >
                      <td className="px-4 py-3 font-mono text-blue-400">
                        {registration.registrationId}
                      </td>
                      <td className="px-4 py-3">{registration.name}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs">
                          <div>
                            <strong>Tech:</strong>{" "}
                            {registration.selectedEvents.length}
                          </div>
                          <div>
                            <strong>Workshops:</strong>{" "}
                            {registration.selectedWorkshops.length}
                          </div>
                          <div>
                            <strong>Non-Tech:</strong>{" "}
                            {registration.selectedNonTechEvents.length}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingField === `attendance-${registration.id}` ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h6 className="text-xs font-semibold">
                                  Mark Attendance & Edit Events:
                                </h6>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                >
                                  Close
                                </button>
                              </div>

                              {/* Tech Events Attendance */}
                              {registration.selectedEvents.length > 0 && (
                                <div className="bg-gray-600 p-3 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-medium">
                                      Technical Events:
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {registration.eventAttendance?.techEvents?.filter(
                                        (e: any) => e.attended
                                      ).length || 0}
                                      /{registration.selectedEvents.length}{" "}
                                      attended
                                    </div>
                                  </div>
                                  {registration.selectedEvents.map(
                                    (event: any, index: number) => {
                                      const eventAttendance =
                                        registration.eventAttendance?.techEvents?.find(
                                          (e: any) =>
                                            e.eventId ===
                                            (typeof event === "object"
                                              ? event.id
                                              : index)
                                        );
                                      const isPresent =
                                        eventAttendance?.attended || false;
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between text-xs mb-2 p-2 bg-gray-700 rounded"
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium">
                                              {typeof event === "object" &&
                                              event.title
                                                ? event.title
                                                : event}
                                            </div>
                                            {eventAttendance && (
                                              <div className="text-gray-400 text-xs">
                                                Status:{" "}
                                                <span
                                                  className={
                                                    isPresent
                                                      ? "text-green-400"
                                                      : "text-red-400"
                                                  }
                                                >
                                                  {isPresent
                                                    ? "Present"
                                                    : "Absent"}
                                                </span>
                                                {eventAttendance.timestamp && (
                                                  <span className="ml-2">
                                                    •{" "}
                                                    {new Date(
                                                      eventAttendance.timestamp
                                                    ).toLocaleString()}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1 ml-2">
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const eventId =
                                                    typeof event === "object"
                                                      ? event.id
                                                      : index;
                                                  const success =
                                                    await updateEventAttendance(
                                                      registration.registrationId,
                                                      "techEvents",
                                                      eventId,
                                                      true
                                                    );
                                                  if (success) {
                                                    await fetchRegistrations();
                                                  } else {
                                                    alert(
                                                      "Failed to update event attendance"
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Error updating event attendance:",
                                                    error
                                                  );
                                                  alert(
                                                    "Failed to update event attendance"
                                                  );
                                                }
                                              }}
                                              className={`px-2 py-1 rounded text-xs ${
                                                isPresent
                                                  ? "bg-green-700 text-green-200"
                                                  : "bg-green-600 hover:bg-green-700"
                                              }`}
                                            >
                                              Present
                                            </button>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const eventId =
                                                    typeof event === "object"
                                                      ? event.id
                                                      : index;
                                                  const success =
                                                    await updateEventAttendance(
                                                      registration.registrationId,
                                                      "techEvents",
                                                      eventId,
                                                      false
                                                    );
                                                  if (success) {
                                                    await fetchRegistrations();
                                                  } else {
                                                    alert(
                                                      "Failed to update event attendance"
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Error updating event attendance:",
                                                    error
                                                  );
                                                  alert(
                                                    "Failed to update event attendance"
                                                  );
                                                }
                                              }}
                                              className={`px-2 py-1 rounded text-xs ${
                                                !isPresent && eventAttendance
                                                  ? "bg-red-700 text-red-200"
                                                  : "bg-red-600 hover:bg-red-700"
                                              }`}
                                            >
                                              Absent
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                              {/* Workshops Attendance */}
                              {registration.selectedWorkshops.length > 0 && (
                                <div className="bg-gray-600 p-3 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-medium">
                                      Workshops:
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {registration.eventAttendance?.workshops?.filter(
                                        (w: any) => w.attended
                                      ).length || 0}
                                      /{registration.selectedWorkshops.length}{" "}
                                      attended
                                    </div>
                                  </div>
                                  {registration.selectedWorkshops.map(
                                    (workshop: any, index: number) => {
                                      const workshopAttendance =
                                        registration.eventAttendance?.workshops?.find(
                                          (w: any) =>
                                            w.eventId ===
                                            (typeof workshop === "object"
                                              ? workshop.id
                                              : index)
                                        );
                                      const isPresent =
                                        workshopAttendance?.attended || false;
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between text-xs mb-2 p-2 bg-gray-700 rounded"
                                        >
                                          <div className="flex-1">
                                            {editingField ===
                                            `workshop-edit-${registration.id}-${index}` ? (
                                              <div className="flex items-center gap-2 mb-1">
                                                <input
                                                  type="text"
                                                  placeholder="Workshop Title"
                                                  className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs flex-1"
                                                  value={
                                                    editValues[
                                                      `workshop-${index}`
                                                    ] !== undefined
                                                      ? editValues[
                                                          `workshop-${index}`
                                                        ]
                                                      : typeof workshop ===
                                                          "object" &&
                                                        workshop.title
                                                      ? workshop.title
                                                      : workshop
                                                  }
                                                  onChange={(e) =>
                                                    setEditValues({
                                                      ...editValues,
                                                      [`workshop-${index}`]:
                                                        e.target.value,
                                                    })
                                                  }
                                                />
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      const updatedWorkshops = [
                                                        ...registration.selectedWorkshops,
                                                      ];
                                                      updatedWorkshops[index] =
                                                        editValues[
                                                          `workshop-${index}`
                                                        ] || workshop;
                                                      const success =
                                                        await updateSelectedWorkshops(
                                                          registration.registrationId,
                                                          updatedWorkshops
                                                        );
                                                      if (success) {
                                                        await fetchRegistrations();
                                                        setEditingField(null);
                                                        setEditValues({});
                                                      } else {
                                                        alert(
                                                          "Failed to update workshop"
                                                        );
                                                      }
                                                    } catch (error) {
                                                      console.error(
                                                        "Error updating workshop:",
                                                        error
                                                      );
                                                      alert(
                                                        "Failed to update workshop"
                                                      );
                                                    }
                                                  }}
                                                  className="px-1 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                                >
                                                  <Save className="h-3 w-3" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setEditingField(null);
                                                    setEditValues({});
                                                  }}
                                                  className="px-1 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 mb-1">
                                                <div className="font-medium">
                                                  {typeof workshop ===
                                                    "object" && workshop.title
                                                    ? workshop.title
                                                    : workshop}
                                                </div>
                                                <button
                                                  onClick={() =>
                                                    setEditingField(
                                                      `workshop-edit-${registration.id}-${index}`
                                                    )
                                                  }
                                                  className="px-1 py-1 text-blue-400 hover:text-blue-300"
                                                >
                                                  <Edit2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            )}
                                            {workshopAttendance && (
                                              <div className="text-gray-400 text-xs">
                                                Status:{" "}
                                                <span
                                                  className={
                                                    isPresent
                                                      ? "text-green-400"
                                                      : "text-red-400"
                                                  }
                                                >
                                                  {isPresent
                                                    ? "Present"
                                                    : "Absent"}
                                                </span>
                                                {workshopAttendance.timestamp && (
                                                  <span className="ml-2">
                                                    •{" "}
                                                    {new Date(
                                                      workshopAttendance.timestamp
                                                    ).toLocaleString()}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1 ml-2">
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const workshopId =
                                                    typeof workshop === "object"
                                                      ? workshop.id
                                                      : index;
                                                  const success =
                                                    await updateEventAttendance(
                                                      registration.registrationId,
                                                      "workshops",
                                                      workshopId,
                                                      true
                                                    );
                                                  if (success) {
                                                    await fetchRegistrations();
                                                  } else {
                                                    alert(
                                                      "Failed to update workshop attendance"
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Error updating workshop attendance:",
                                                    error
                                                  );
                                                  alert(
                                                    "Failed to update workshop attendance"
                                                  );
                                                }
                                              }}
                                              className={`px-2 py-1 rounded text-xs ${
                                                isPresent
                                                  ? "bg-green-700 text-green-200"
                                                  : "bg-green-600 hover:bg-green-700"
                                              }`}
                                            >
                                              Present
                                            </button>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const workshopId =
                                                    typeof workshop === "object"
                                                      ? workshop.id
                                                      : index;
                                                  const success =
                                                    await updateEventAttendance(
                                                      registration.registrationId,
                                                      "workshops",
                                                      workshopId,
                                                      false
                                                    );
                                                  if (success) {
                                                    await fetchRegistrations();
                                                  } else {
                                                    alert(
                                                      "Failed to update workshop attendance"
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Error updating workshop attendance:",
                                                    error
                                                  );
                                                  alert(
                                                    "Failed to update workshop attendance"
                                                  );
                                                }
                                              }}
                                              className={`px-2 py-1 rounded text-xs ${
                                                !isPresent && workshopAttendance
                                                  ? "bg-red-700 text-red-200"
                                                  : "bg-red-600 hover:bg-red-700"
                                              }`}
                                            >
                                              Absent
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                              {/* Non-Tech Events Attendance */}
                              {registration.selectedNonTechEvents.length >
                                0 && (
                                <div className="bg-gray-600 p-3 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-medium">
                                      Non-Tech Events:
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {registration.eventAttendance?.nonTechEvents?.filter(
                                        (e: any) => e.attended
                                      ).length || 0}
                                      /
                                      {
                                        registration.selectedNonTechEvents
                                          .length
                                      }{" "}
                                      attended
                                    </div>
                                  </div>
                                  {registration.selectedNonTechEvents.map(
                                    (event: any, index: number) => {
                                      const eventAttendance =
                                        registration.eventAttendance?.nonTechEvents?.find(
                                          (e: any) =>
                                            e.eventId ===
                                            (typeof event === "object"
                                              ? event.id
                                              : index)
                                        );
                                      const isPresent =
                                        eventAttendance?.attended || false;
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between text-xs mb-2 p-2 bg-gray-700 rounded"
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium">
                                              {typeof event === "object" &&
                                              event.title
                                                ? event.title
                                                : event}
                                            </div>
                                            {eventAttendance && (
                                              <div className="text-gray-400 text-xs">
                                                Status:{" "}
                                                <span
                                                  className={
                                                    isPresent
                                                      ? "text-green-400"
                                                      : "text-red-400"
                                                  }
                                                >
                                                  {isPresent
                                                    ? "Present"
                                                    : "Absent"}
                                                </span>
                                                {eventAttendance.timestamp && (
                                                  <span className="ml-2">
                                                    •{" "}
                                                    {new Date(
                                                      eventAttendance.timestamp
                                                    ).toLocaleString()}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1 ml-2">
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const eventId =
                                                    typeof event === "object"
                                                      ? event.id
                                                      : index;
                                                  const success =
                                                    await updateEventAttendance(
                                                      registration.registrationId,
                                                      "nonTechEvents",
                                                      eventId,
                                                      true,
                                                      "",
                                                      true,
                                                      50
                                                    );
                                                  if (success) {
                                                    await fetchRegistrations();
                                                  } else {
                                                    alert(
                                                      "Failed to update event attendance"
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Error updating event attendance:",
                                                    error
                                                  );
                                                  alert(
                                                    "Failed to update event attendance"
                                                  );
                                                }
                                              }}
                                              className={`px-2 py-1 rounded text-xs ${
                                                isPresent
                                                  ? "bg-green-700 text-green-200"
                                                  : "bg-green-600 hover:bg-green-700"
                                              }`}
                                            >
                                              Present
                                            </button>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const eventId =
                                                    typeof event === "object"
                                                      ? event.id
                                                      : index;
                                                  const success =
                                                    await updateEventAttendance(
                                                      registration.registrationId,
                                                      "nonTechEvents",
                                                      eventId,
                                                      false
                                                    );
                                                  if (success) {
                                                    await fetchRegistrations();
                                                  } else {
                                                    alert(
                                                      "Failed to update event attendance"
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Error updating event attendance:",
                                                    error
                                                  );
                                                  alert(
                                                    "Failed to update event attendance"
                                                  );
                                                }
                                              }}
                                              className={`px-2 py-1 rounded text-xs ${
                                                !isPresent && eventAttendance
                                                  ? "bg-red-700 text-red-200"
                                                  : "bg-red-600 hover:bg-red-700"
                                              }`}
                                            >
                                              Absent
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2 border-t border-gray-500">
                                <div className="text-xs text-gray-400">
                                  Total Events:{" "}
                                  {registration.selectedEvents.length +
                                    registration.selectedWorkshops.length +
                                    registration.selectedNonTechEvents.length}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      // Mark all as present
                                      for (const event of registration.selectedEvents) {
                                        const eventId =
                                          typeof event === "object"
                                            ? event.id
                                            : registration.selectedEvents.indexOf(
                                                event
                                              );
                                        await updateEventAttendance(
                                          registration.registrationId,
                                          "techEvents",
                                          eventId,
                                          true
                                        );
                                      }
                                      for (const workshop of registration.selectedWorkshops) {
                                        const workshopId =
                                          typeof workshop === "object"
                                            ? workshop.id
                                            : registration.selectedWorkshops.indexOf(
                                                workshop
                                              );
                                        await updateEventAttendance(
                                          registration.registrationId,
                                          "workshops",
                                          workshopId,
                                          true
                                        );
                                      }
                                      for (const event of registration.selectedNonTechEvents) {
                                        const eventId =
                                          typeof event === "object"
                                            ? event.id
                                            : registration.selectedNonTechEvents.indexOf(
                                                event
                                              );
                                        await updateEventAttendance(
                                          registration.registrationId,
                                          "nonTechEvents",
                                          eventId,
                                          true,
                                          "",
                                          true,
                                          50
                                        );
                                      }
                                      await fetchRegistrations();
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                  >
                                    Mark All Present
                                  </button>
                                  <button
                                    onClick={() => setEditingField(null)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                  >
                                    Save & Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {registration.eventAttendance ? (
                              <div>
                                <div>
                                  Tech:{" "}
                                  {registration.eventAttendance.techEvents?.filter(
                                    (e: any) => e.attended
                                  ).length || 0}
                                  /{registration.selectedEvents.length}
                                </div>
                                <div>
                                  Workshops:{" "}
                                  {registration.eventAttendance.workshops?.filter(
                                    (w: any) => w.attended
                                  ).length || 0}
                                  /{registration.selectedWorkshops.length}
                                </div>
                                <div>
                                  Non-Tech:{" "}
                                  {registration.eventAttendance.nonTechEvents?.filter(
                                    (e: any) => e.attended
                                  ).length || 0}
                                  /{registration.selectedNonTechEvents.length}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                No attendance recorded
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setEditingField(`attendance-${registration.id}`)
                            }
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="Mark Attendance"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedRegistration(registration)
                            }
                            className="p-1 text-green-400 hover:text-green-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "edit" && (
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">
                  Comprehensive Registration Editor
                </h3>
                <div className="space-y-6">
                  {filteredRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="bg-gray-700 p-6 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-400">
                          {registration.name} - {registration.registrationId}
                        </h4>
                        {registration.adminNotes?.flagged && (
                          <span className="px-3 py-1 bg-red-600 rounded-full text-xs">
                            <Flag className="inline h-3 w-3 mr-1" />
                            FLAGGED
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-green-400">
                            Personal Information
                          </h5>
                          {editingField === `personal-${registration.id}` ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Name"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.name ?? registration.name ?? ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    name: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.email ?? registration.email ?? ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    email: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="text"
                                placeholder="WhatsApp"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.whatsapp ??
                                  registration.whatsapp ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    whatsapp: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="text"
                                placeholder="College"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.college ??
                                  registration.college ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    college: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="text"
                                placeholder="Department"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.department ??
                                  registration.department ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    department: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="text"
                                placeholder="Year"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.year ?? registration.year ?? ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    year: e.target.value,
                                  })
                                }
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    const success = await updatePersonalInfo(
                                      registration.registrationId,
                                      editValues.name || registration.name,
                                      editValues.email || registration.email,
                                      editValues.whatsapp ||
                                        registration.whatsapp,
                                      editValues.college ||
                                        registration.college,
                                      editValues.department ||
                                        registration.department,
                                      editValues.year || registration.year
                                    );
                                    if (success) {
                                      await fetchRegistrations();
                                      setEditingField(null);
                                      setEditValues({});
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingField(null);
                                    setEditValues({});
                                  }}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <p>
                                <strong>Name:</strong> {registration.name}
                              </p>
                              <p>
                                <strong>Email:</strong> {registration.email}
                              </p>
                              <p>
                                <strong>WhatsApp:</strong>{" "}
                                {registration.whatsapp}
                              </p>
                              <p>
                                <strong>College:</strong> {registration.college}
                              </p>
                              <p>
                                <strong>Department:</strong>{" "}
                                {registration.department}
                              </p>
                              <p>
                                <strong>Year:</strong> {registration.year}
                              </p>
                              <button
                                onClick={() =>
                                  setEditingField(`personal-${registration.id}`)
                                }
                                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                              >
                                <Edit2 className="inline h-3 w-3 mr-1" />
                                Edit Personal Info
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Status & Pass Information */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-purple-400">
                            Status & Pass
                          </h5>
                          {editingField === `status-${registration.id}` ? (
                            <div className="space-y-3">
                              <select
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.status ??
                                  registration.status ??
                                  "pending"
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    status: e.target.value,
                                  })
                                }
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <select
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.paymentStatus ??
                                  registration.paymentStatus ??
                                  "pending"
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    paymentStatus: e.target.value,
                                  })
                                }
                              >
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="failed">Failed</option>
                                <option value="not-required">
                                  Not Required
                                </option>
                              </select>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    editValues.ispass ??
                                    registration.ispass ??
                                    false
                                  }
                                  onChange={(e) =>
                                    setEditValues({
                                      ...editValues,
                                      ispass: e.target.checked,
                                    })
                                  }
                                />
                                <span className="text-xs">Has Pass</span>
                              </div>
                              {(editValues.ispass ?? registration.ispass) && (
                                <input
                                  type="number"
                                  placeholder="Pass ID"
                                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                  value={
                                    editValues.selectedPassId ??
                                    registration.selectedPassId ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    setEditValues({
                                      ...editValues,
                                      selectedPassId:
                                        parseInt(e.target.value) || null,
                                    })
                                  }
                                />
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    const success =
                                      await updateRegistrationStatus(
                                        registration.registrationId,
                                        editValues.status ||
                                          registration.status,
                                        editValues.paymentStatus ||
                                          registration.paymentStatus,
                                        editValues.ispass !== undefined
                                          ? editValues.ispass
                                          : registration.ispass,
                                        editValues.selectedPassId
                                      );
                                    if (success) {
                                      await fetchRegistrations();
                                      setEditingField(null);
                                      setEditValues({});
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingField(null);
                                    setEditValues({});
                                  }}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <p>
                                <strong>Status:</strong>
                                <span
                                  className={`ml-2 px-2 py-1 rounded text-xs ${
                                    registration.status === "confirmed"
                                      ? "bg-green-600"
                                      : registration.status === "pending"
                                      ? "bg-yellow-600"
                                      : "bg-red-600"
                                  }`}
                                >
                                  {registration.status}
                                </span>
                              </p>
                              <p>
                                <strong>Payment:</strong>
                                <span
                                  className={`ml-2 px-2 py-1 rounded text-xs ${
                                    registration.paymentStatus === "verified"
                                      ? "bg-green-600"
                                      : registration.paymentStatus === "pending"
                                      ? "bg-yellow-600"
                                      : registration.paymentStatus ===
                                        "not-required"
                                      ? "bg-blue-600"
                                      : "bg-red-600"
                                  }`}
                                >
                                  {registration.paymentStatus}
                                </span>
                              </p>
                              <p>
                                <strong>Pass:</strong>
                                <span
                                  className={`ml-2 px-2 py-1 rounded text-xs ${
                                    registration.ispass
                                      ? "bg-yellow-600"
                                      : "bg-gray-600"
                                  }`}
                                >
                                  {registration.ispass
                                    ? `Pass #${registration.selectedPassId}`
                                    : "No Pass"}
                                </span>
                              </p>
                              <button
                                onClick={() =>
                                  setEditingField(`status-${registration.id}`)
                                }
                                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                              >
                                <Edit2 className="inline h-3 w-3 mr-1" />
                                Edit Status & Pass
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-orange-400">
                            Contact Details
                          </h5>
                          {editingField === `contact-${registration.id}` ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Emergency Contact"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.emergencyContact ??
                                  registration.contactDetails
                                    ?.emergencyContact ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    emergencyContact: e.target.value,
                                  })
                                }
                              />
                              <input
                                type="text"
                                placeholder="Emergency Phone"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.emergencyPhone ??
                                  registration.contactDetails?.emergencyPhone ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    emergencyPhone: e.target.value,
                                  })
                                }
                              />
                              <textarea
                                placeholder="Dietary Restrictions"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.dietaryRestrictions ??
                                  registration.contactDetails
                                    ?.dietaryRestrictions ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    dietaryRestrictions: e.target.value,
                                  })
                                }
                                rows={2}
                              />
                              <textarea
                                placeholder="Accessibility Needs"
                                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-sm"
                                value={
                                  editValues.accessibility ??
                                  registration.contactDetails?.accessibility ??
                                  ""
                                }
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    accessibility: e.target.value,
                                  })
                                }
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    const success = await updateContactDetails(
                                      registration.registrationId,
                                      editValues.emergencyContact ||
                                        registration.contactDetails
                                          ?.emergencyContact ||
                                        "",
                                      editValues.emergencyPhone ||
                                        registration.contactDetails
                                          ?.emergencyPhone ||
                                        "",
                                      editValues.dietaryRestrictions ||
                                        registration.contactDetails
                                          ?.dietaryRestrictions ||
                                        "",
                                      editValues.accessibility ||
                                        registration.contactDetails
                                          ?.accessibility ||
                                        ""
                                    );
                                    if (success) {
                                      await fetchRegistrations();
                                      setEditingField(null);
                                      setEditValues({});
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingField(null);
                                    setEditValues({});
                                  }}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <p>
                                <strong>Emergency Contact:</strong>{" "}
                                {registration.contactDetails
                                  ?.emergencyContact || "Not provided"}
                              </p>
                              <p>
                                <strong>Emergency Phone:</strong>{" "}
                                {registration.contactDetails?.emergencyPhone ||
                                  "Not provided"}
                              </p>
                              <p>
                                <strong>Dietary Restrictions:</strong>{" "}
                                {registration.contactDetails
                                  ?.dietaryRestrictions || "None"}
                              </p>
                              <p>
                                <strong>Accessibility:</strong>{" "}
                                {registration.contactDetails?.accessibility ||
                                  "None"}
                              </p>
                              <button
                                onClick={() =>
                                  setEditingField(`contact-${registration.id}`)
                                }
                                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                              >
                                <Edit2 className="inline h-3 w-3 mr-1" />
                                Edit Contact Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Selections - Full Width Section */}
                      <div className="mt-6 pt-6 border-t border-gray-600">
                        <h5 className="font-medium text-cyan-400 mb-4">
                          Event Selections
                        </h5>
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Technical Events */}
                          <div className="space-y-4">
                            <h6 className="font-medium text-blue-400">
                              Technical Events
                            </h6>
                            {editingField === `events-${registration.id}` ? (
                              <div className="space-y-3">
                                {(
                                  editValues.selectedEvents ??
                                  registration.selectedEvents ??
                                  []
                                ).map((event: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex gap-2 items-center"
                                  >
                                    <input
                                      type="text"
                                      className="flex-1 p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                                      value={
                                        typeof event === "object"
                                          ? event.title
                                          : event
                                      }
                                      placeholder="Event Title"
                                      onChange={(e) => {
                                        const updated = [
                                          ...(editValues.selectedEvents ??
                                            registration.selectedEvents ??
                                            []),
                                        ];
                                        updated[idx] =
                                          typeof event === "object"
                                            ? {
                                                ...event,
                                                title: e.target.value,
                                              }
                                            : {
                                                title: e.target.value,
                                                id: event.id ?? idx,
                                              };
                                        setEditValues({
                                          ...editValues,
                                          selectedEvents: updated,
                                        });
                                      }}
                                    />
                                    <button
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                      onClick={() => {
                                        const updated = [
                                          ...(editValues.selectedEvents ??
                                            registration.selectedEvents ??
                                            []),
                                        ];
                                        updated.splice(idx, 1);
                                        setEditValues({
                                          ...editValues,
                                          selectedEvents: updated,
                                        });
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs"
                                  onClick={() => {
                                    const updated = [
                                      ...(editValues.selectedEvents ??
                                        registration.selectedEvents ??
                                        []),
                                    ];
                                    updated.push({ id: Date.now(), title: "" });
                                    setEditValues({
                                      ...editValues,
                                      selectedEvents: updated,
                                    });
                                  }}
                                >
                                  Add Event
                                </button>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={async () => {
                                      const events =
                                        editValues.selectedEvents ||
                                        registration.selectedEvents;
                                      await handleEventsUpdate(
                                        registration.registrationId,
                                        events
                                      );
                                      setEditingField(null);
                                      setEditValues({});
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingField(null);
                                      setEditValues({});
                                    }}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div className="max-h-32 overflow-y-auto bg-gray-600 p-2 rounded">
                                  {registration.selectedEvents.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1">
                                      {registration.selectedEvents.map(
                                        (event: any, index: number) => (
                                          <li key={index} className="text-xs">
                                            {typeof event === "object"
                                              ? event.title ||
                                                JSON.stringify(event)
                                              : event}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-400 text-xs">
                                      No events selected
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    setEditingField(`events-${registration.id}`)
                                  }
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  <Edit2 className="inline h-3 w-3 mr-1" />
                                  Edit Events
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Workshops */}
                          <div className="space-y-4">
                            <h6 className="font-medium text-green-400">
                              Workshops
                            </h6>
                            {editingField === `workshops-${registration.id}` ? (
                              <div className="space-y-3">
                                {(
                                  editValues.selectedWorkshops ??
                                  registration.selectedWorkshops ??
                                  []
                                ).map((workshop: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex gap-2 items-center"
                                  >
                                    <input
                                      type="text"
                                      className="flex-1 p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                                      value={
                                        typeof workshop === "object"
                                          ? workshop.title
                                          : workshop
                                      }
                                      placeholder="Workshop Title"
                                      onChange={(e) => {
                                        const updated = [
                                          ...(editValues.selectedWorkshops ??
                                            registration.selectedWorkshops ??
                                            []),
                                        ];
                                        updated[idx] =
                                          typeof workshop === "object"
                                            ? {
                                                ...workshop,
                                                title: e.target.value,
                                              }
                                            : {
                                                title: e.target.value,
                                                id: workshop.id ?? idx,
                                              };
                                        setEditValues({
                                          ...editValues,
                                          selectedWorkshops: updated,
                                        });
                                      }}
                                    />
                                    <button
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                      onClick={() => {
                                        const updated = [
                                          ...(editValues.selectedWorkshops ??
                                            registration.selectedWorkshops ??
                                            []),
                                        ];
                                        updated.splice(idx, 1);
                                        setEditValues({
                                          ...editValues,
                                          selectedWorkshops: updated,
                                        });
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs"
                                  onClick={() => {
                                    const updated = [
                                      ...(editValues.selectedWorkshops ??
                                        registration.selectedWorkshops ??
                                        []),
                                    ];
                                    updated.push({ id: Date.now(), title: "" });
                                    setEditValues({
                                      ...editValues,
                                      selectedWorkshops: updated,
                                    });
                                  }}
                                >
                                  Add Workshop
                                </button>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={async () => {
                                      const workshops =
                                        editValues.selectedWorkshops ||
                                        registration.selectedWorkshops;
                                      await handleWorkshopsUpdate(
                                        registration.registrationId,
                                        workshops
                                      );
                                      setEditingField(null);
                                      setEditValues({});
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingField(null);
                                      setEditValues({});
                                    }}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div className="max-h-32 overflow-y-auto bg-gray-600 p-2 rounded">
                                  {registration.selectedWorkshops.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1">
                                      {registration.selectedWorkshops.map(
                                        (workshop: any, index: number) => (
                                          <li key={index} className="text-xs">
                                            {typeof workshop === "object"
                                              ? workshop.title ||
                                                JSON.stringify(workshop)
                                              : workshop}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-400 text-xs">
                                      No workshops selected
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    setEditingField(
                                      `workshops-${registration.id}`
                                    )
                                  }
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  <Edit2 className="inline h-3 w-3 mr-1" />
                                  Edit Workshops
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Non-Tech Events */}
                          <div className="space-y-4">
                            <h6 className="font-medium text-yellow-400">
                              Non-Tech Events
                            </h6>
                            {editingField === `nontech-${registration.id}` ? (
                              <div className="space-y-3">
                                {(
                                  editValues.selectedNonTechEvents ??
                                  registration.selectedNonTechEvents ??
                                  []
                                ).map((event: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex gap-2 items-center"
                                  >
                                    <input
                                      type="text"
                                      className="flex-1 p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                                      value={
                                        typeof event === "object"
                                          ? event.title
                                          : event
                                      }
                                      placeholder="Event Title"
                                      onChange={(e) => {
                                        const updated = [
                                          ...(editValues.selectedNonTechEvents ??
                                            registration.selectedNonTechEvents ??
                                            []),
                                        ];
                                        updated[idx] =
                                          typeof event === "object"
                                            ? {
                                                ...event,
                                                title: e.target.value,
                                              }
                                            : {
                                                title: e.target.value,
                                                id: event.id ?? idx,
                                              };
                                        setEditValues({
                                          ...editValues,
                                          selectedNonTechEvents: updated,
                                        });
                                      }}
                                    />
                                    <button
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                      onClick={() => {
                                        const updated = [
                                          ...(editValues.selectedNonTechEvents ??
                                            registration.selectedNonTechEvents ??
                                            []),
                                        ];
                                        updated.splice(idx, 1);
                                        setEditValues({
                                          ...editValues,
                                          selectedNonTechEvents: updated,
                                        });
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs"
                                  onClick={() => {
                                    const updated = [
                                      ...(editValues.selectedNonTechEvents ??
                                        registration.selectedNonTechEvents ??
                                        []),
                                    ];
                                    updated.push({ id: Date.now(), title: "" });
                                    setEditValues({
                                      ...editValues,
                                      selectedNonTechEvents: updated,
                                    });
                                  }}
                                >
                                  Add Event
                                </button>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={async () => {
                                      const nonTechEvents =
                                        editValues.selectedNonTechEvents ||
                                        registration.selectedNonTechEvents;
                                      await handleNonTechEventsUpdate(
                                        registration.registrationId,
                                        nonTechEvents
                                      );
                                      setEditingField(null);
                                      setEditValues({});
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingField(null);
                                      setEditValues({});
                                    }}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div className="max-h-32 overflow-y-auto bg-gray-600 p-2 rounded">
                                  {registration.selectedNonTechEvents.length >
                                  0 ? (
                                    <ul className="list-disc list-inside space-y-1">
                                      {registration.selectedNonTechEvents.map(
                                        (event: any, index: number) => (
                                          <li key={index} className="text-xs">
                                            {typeof event === "object"
                                              ? event.title ||
                                                JSON.stringify(event)
                                              : event}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-400 text-xs">
                                      No non-tech events selected
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    setEditingField(
                                      `nontech-${registration.id}`
                                    )
                                  }
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  <Edit2 className="inline h-3 w-3 mr-1" />
                                  Edit Non-Tech Events
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Team Members Section - Full Width */}
                      <div className="mt-6 pt-6 border-t border-gray-600">
                        <h5 className="font-medium text-emerald-400 mb-4">
                          Team Information
                        </h5>
                        {editingField === `team-${registration.id}` ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    editValues.isTeamEvent !== undefined
                                      ? editValues.isTeamEvent
                                      : registration.isTeamEvent
                                  }
                                  onChange={(e) =>
                                    setEditValues({
                                      ...editValues,
                                      isTeamEvent: e.target.checked,
                                    })
                                  }
                                />
                                <span className="text-sm">Is Team Event</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm">Team Size:</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  className="w-20 p-1 bg-gray-600 border border-gray-500 rounded text-sm"
                                  value={
                                    editValues.teamSize ??
                                    registration.teamSize ??
                                    1
                                  }
                                  onChange={(e) =>
                                    setEditValues({
                                      ...editValues,
                                      teamSize: parseInt(e.target.value) || 1,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            {(editValues.isTeamEvent !== undefined
                              ? editValues.isTeamEvent
                              : registration.isTeamEvent) && (
                              <div className="space-y-3">
                                <h6 className="font-medium text-blue-400">
                                  Team Members
                                </h6>
                                <textarea
                                  placeholder="Team Members (JSON format): [{'name': 'Name', 'email': 'email@example.com', 'department': 'CSE', 'year': '3'}]"
                                  className="w-full p-3 bg-gray-600 border border-gray-500 rounded text-sm"
                                  value={JSON.stringify(
                                    editValues.teamMembers ??
                                      registration.teamMembers ??
                                      [],
                                    null,
                                    2
                                  )}
                                  onChange={(e) => {
                                    try {
                                      const parsed = JSON.parse(e.target.value);
                                      setEditValues({
                                        ...editValues,
                                        teamMembers: parsed,
                                      });
                                    } catch (err) {
                                      // Invalid JSON, store as string temporarily
                                      setEditValues({
                                        ...editValues,
                                        teamMembersString: e.target.value,
                                      });
                                    }
                                  }}
                                  rows={6}
                                />
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  const isTeamEvent =
                                    editValues.isTeamEvent !== undefined
                                      ? editValues.isTeamEvent
                                      : registration.isTeamEvent;
                                  const teamSize =
                                    editValues.teamSize !== undefined
                                      ? editValues.teamSize
                                      : registration.teamSize;
                                  const teamMembers =
                                    editValues.teamMembers ??
                                    registration.teamMembers ??
                                    [];
                                  await handleTeamInfoUpdate(
                                    registration.registrationId,
                                    isTeamEvent,
                                    teamSize,
                                    teamMembers
                                  );
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                              >
                                Save Team Info
                              </button>
                              <button
                                onClick={() => {
                                  setEditingField(null);
                                  setEditValues({});
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm">
                                  <strong>Team Event:</strong>{" "}
                                  {registration.isTeamEvent ? "Yes" : "No"}
                                </p>
                                <p className="text-sm">
                                  <strong>Team Size:</strong>{" "}
                                  {registration.teamSize}
                                </p>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() =>
                                    setEditingField(`team-${registration.id}`)
                                  }
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  <Edit2 className="inline h-3 w-3 mr-1" />
                                  Edit Team Info
                                </button>
                              </div>
                            </div>

                            {registration.isTeamEvent &&
                              registration.teamMembers &&
                              registration.teamMembers.length > 0 && (
                                <div className="space-y-2">
                                  <h6 className="font-medium text-blue-400">
                                    Team Members:
                                  </h6>
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <div className="bg-gray-600 p-3 rounded">
                                      <p className="font-medium text-green-400">
                                        Team Leader
                                      </p>
                                      <p className="text-xs">
                                        <strong>Name:</strong>{" "}
                                        {registration.name}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Email:</strong>{" "}
                                        {registration.email}
                                      </p>
                                      <p className="text-xs">
                                        <strong>Dept:</strong>{" "}
                                        {registration.department}
                                      </p>
                                    </div>
                                    {registration.teamMembers.map(
                                      (member: any, index: number) => (
                                        <div
                                          key={index}
                                          className="bg-gray-600 p-3 rounded"
                                        >
                                          <p className="font-medium text-blue-400">
                                            Member {index + 2}
                                          </p>
                                          <p className="text-xs">
                                            <strong>Name:</strong>{" "}
                                            {member.name || "Not provided"}
                                          </p>
                                          <p className="text-xs">
                                            <strong>Email:</strong>{" "}
                                            {member.email || "Not provided"}
                                          </p>
                                          <p className="text-xs">
                                            <strong>Dept:</strong>{" "}
                                            {member.department ||
                                              "Not provided"}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredRegistrations.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            No registrations found matching your criteria.
          </div>
        )}
      </div>

      {/* Enhanced Registration Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedRegistration.name}
                  </h2>
                  <p className="text-blue-400 font-mono">
                    {selectedRegistration.registrationId}
                  </p>
                  {selectedRegistration.adminNotes?.flagged && (
                    <div className="flex items-center gap-2 mt-2">
                      <Flag className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 text-sm">
                        Flagged: {selectedRegistration.adminNotes.flagReason}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personal Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Email:</strong> {selectedRegistration.email}
                      </p>
                      <p>
                        <strong>WhatsApp:</strong>{" "}
                        {selectedRegistration.whatsapp}
                      </p>
                      <p>
                        <strong>College:</strong> {selectedRegistration.college}
                      </p>
                      <p>
                        <strong>Department:</strong>{" "}
                        {selectedRegistration.department}
                      </p>
                      <p>
                        <strong>Year:</strong> {selectedRegistration.year}
                      </p>
                      <p>
                        <strong>Team Event:</strong>{" "}
                        {selectedRegistration.isTeamEvent ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Team Size:</strong>{" "}
                        {selectedRegistration.teamSize}
                      </p>
                      <p>
                        <strong>Event Count:</strong>{" "}
                        {selectedRegistration.eventCount}
                      </p>
                      <p>
                        <strong>Has Pass:</strong>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            selectedRegistration.ispass
                              ? "bg-yellow-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {selectedRegistration.ispass
                            ? `Pass #${selectedRegistration.selectedPassId}`
                            : "No Pass"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Team Members */}
                  {selectedRegistration.isTeamEvent &&
                    selectedRegistration.teamMembers &&
                    selectedRegistration.teamMembers.length > 0 && (
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Team Members (
                          {selectedRegistration.teamMembers.length + 1} total)
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="bg-gray-600 p-3 rounded">
                            <p className="font-medium text-green-400">
                              Team Leader
                            </p>
                            <p>
                              <strong>Name:</strong> {selectedRegistration.name}
                            </p>
                            <p>
                              <strong>Email:</strong>{" "}
                              {selectedRegistration.email}
                            </p>
                            <p>
                              <strong>Department:</strong>{" "}
                              {selectedRegistration.department}
                            </p>
                            <p>
                              <strong>Year:</strong> {selectedRegistration.year}
                            </p>
                          </div>
                          {selectedRegistration.teamMembers.map(
                            (member: any, index: number) => (
                              <div
                                key={index}
                                className="bg-gray-600 p-3 rounded"
                              >
                                <p className="font-medium text-blue-400">
                                  Team Member {index + 2}
                                </p>
                                <p>
                                  <strong>Name:</strong>{" "}
                                  {member.name || "Not provided"}
                                </p>
                                <p>
                                  <strong>Email:</strong>{" "}
                                  {member.email || "Not provided"}
                                </p>
                                <p>
                                  <strong>Department:</strong>{" "}
                                  {member.department || "Not provided"}
                                </p>
                                <p>
                                  <strong>Year:</strong>{" "}
                                  {member.year || "Not provided"}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Contact Details */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact & Emergency Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Emergency Contact:</strong>{" "}
                        {selectedRegistration.contactDetails
                          ?.emergencyContact || "Not provided"}
                      </p>
                      <p>
                        <strong>Emergency Phone:</strong>{" "}
                        {selectedRegistration.contactDetails?.emergencyPhone ||
                          "Not provided"}
                      </p>
                      <p>
                        <strong>Dietary Restrictions:</strong>{" "}
                        {selectedRegistration.contactDetails
                          ?.dietaryRestrictions || "None"}
                      </p>
                      <p>
                        <strong>Accessibility Needs:</strong>{" "}
                        {selectedRegistration.contactDetails?.accessibility ||
                          "None"}
                      </p>
                    </div>
                  </div>

                  {/* Arrival Status */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Arrival Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            selectedRegistration.arrivalStatus?.hasArrived
                              ? "bg-green-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {selectedRegistration.arrivalStatus?.hasArrived
                            ? "Arrived"
                            : "Not Arrived"}
                        </span>
                        {editingField ===
                        `arrival-modal-${selectedRegistration.id}` ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleArrivalUpdate(
                                  selectedRegistration.registrationId,
                                  true
                                );
                                setEditingField(null);
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                            >
                              Mark Arrived
                            </button>
                            <button
                              onClick={() => {
                                handleArrivalUpdate(
                                  selectedRegistration.registrationId,
                                  false
                                );
                                setEditingField(null);
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                            >
                              Not Arrived
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setEditingField(
                                `arrival-modal-${selectedRegistration.id}`
                              )
                            }
                            className="p-1 text-gray-400 hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {selectedRegistration.arrivalStatus?.arrivalTime && (
                        <p className="text-sm text-gray-300">
                          <strong>Arrival Time:</strong>{" "}
                          {new Date(
                            selectedRegistration.arrivalStatus.arrivalTime
                              .seconds * 1000
                          ).toLocaleString()}
                        </p>
                      )}
                      {selectedRegistration.arrivalStatus?.checkedInBy && (
                        <p className="text-sm text-gray-300">
                          <strong>Checked in by:</strong>{" "}
                          {selectedRegistration.arrivalStatus.checkedInBy}
                        </p>
                      )}
                      {selectedRegistration.arrivalStatus?.notes && (
                        <p className="text-sm text-gray-300">
                          <strong>Notes:</strong>{" "}
                          {selectedRegistration.arrivalStatus.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Workshop Details */}
                  {selectedRegistration.workshopDetails && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Workshop Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Selected Workshop:</strong>{" "}
                          {selectedRegistration.workshopDetails.workshopTitle ||
                            "None"}
                        </p>
                        <p>
                          <strong>Can Edit Workshop:</strong>{" "}
                          {selectedRegistration.workshopDetails.canEditWorkshop
                            ? "Yes"
                            : "No"}
                        </p>
                        <p>
                          <strong>Attended:</strong>{" "}
                          {selectedRegistration.workshopDetails.workshopAttended
                            ? "Yes"
                            : "No"}
                        </p>
                        {selectedRegistration.workshopDetails
                          .workshopAttendanceTime && (
                          <p>
                            <strong>Attendance Time:</strong>{" "}
                            {new Date(
                              selectedRegistration.workshopDetails
                                .workshopAttendanceTime.seconds * 1000
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Registered Events */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Registered Events
                    </h3>
                    <div className="space-y-3">
                      {selectedRegistration.selectedEvents.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-400">
                            Technical Events
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRegistration.selectedEvents.map(
                              (event, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-600 rounded text-xs"
                                >
                                  {typeof event === "object" && event.title
                                    ? event.title
                                    : event}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {selectedRegistration.selectedWorkshops.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-purple-400">
                            Workshops
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRegistration.selectedWorkshops.map(
                              (workshop, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-purple-600 rounded text-xs"
                                >
                                  {typeof workshop === "object" &&
                                  workshop.title
                                    ? workshop.title
                                    : workshop}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {selectedRegistration.selectedNonTechEvents.length >
                        0 && (
                        <div>
                          <h4 className="text-sm font-medium text-yellow-400">
                            Non-Tech Events
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRegistration.selectedNonTechEvents.map(
                              (event, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-yellow-600 rounded text-xs"
                                >
                                  {typeof event === "object" && event.title
                                    ? event.title
                                    : event}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Info */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-3">
                      Registration Info
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Status:</strong>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs ${
                            selectedRegistration.status === "confirmed"
                              ? "bg-green-600"
                              : selectedRegistration.status === "pending"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                        >
                          {selectedRegistration.status}
                        </span>
                      </p>
                      <p>
                        <strong>Payment Status:</strong>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs ${
                            selectedRegistration.paymentStatus === "verified"
                              ? "bg-green-600"
                              : selectedRegistration.paymentStatus === "pending"
                              ? "bg-yellow-600"
                              : selectedRegistration.paymentStatus ===
                                "not-required"
                              ? "bg-blue-600"
                              : "bg-red-600"
                          }`}
                        >
                          {selectedRegistration.paymentStatus}
                        </span>
                      </p>
                      <p>
                        <strong>Created:</strong>{" "}
                        {selectedRegistration.createdAt
                          .toDate()
                          .toLocaleString()}
                      </p>
                      <p>
                        <strong>Updated:</strong>{" "}
                        {selectedRegistration.updatedAt
                          .toDate()
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Admin Notes
                    </h3>
                    <div className="space-y-3">
                      {selectedRegistration.adminNotes?.flagged && (
                        <div className="flex items-center gap-2 p-2 bg-red-600/20 border border-red-600 rounded">
                          <Flag className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-medium">
                            FLAGGED
                          </span>
                          {selectedRegistration.adminNotes.flagReason && (
                            <span className="text-sm text-gray-300">
                              - {selectedRegistration.adminNotes.flagReason}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>General Notes:</strong>
                          <p className="text-gray-300 mt-1">
                            {selectedRegistration.adminNotes?.generalNotes ||
                              "No notes"}
                          </p>
                        </div>
                        <div>
                          <strong>Special Requirements:</strong>
                          <p className="text-gray-300 mt-1">
                            {selectedRegistration.adminNotes
                              ?.specialRequirements || "None"}
                          </p>
                        </div>
                        {selectedRegistration.adminNotes?.lastModifiedAt && (
                          <p className="text-xs text-gray-400">
                            Last modified:{" "}
                            {new Date(
                              selectedRegistration.adminNotes.lastModifiedAt
                                .seconds * 1000
                            ).toLocaleString()}
                            {selectedRegistration.adminNotes.lastModifiedBy &&
                              ` by ${selectedRegistration.adminNotes.lastModifiedBy}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit History */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Edit History ({selectedRegistration.editHistory?.length || 0} edits)
                    </h3>
                    <div className="space-y-3">
                      {selectedRegistration.editHistory && selectedRegistration.editHistory.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-3">
                          {selectedRegistration.editHistory
                            .slice()
                            .reverse() // Show newest edits first
                            .map((edit, index) => (
                            <div key={index} className="bg-gray-600 p-3 rounded border-l-2 border-red-400">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium text-red-400">
                                    {edit.editedBy?.split('@')[0] || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {edit.editedAt && edit.editedAt.toDate 
                                      ? edit.editedAt.toDate().toLocaleString()
                                      : 'Unknown time'
                                    }
                                  </div>
                                </div>
                                <div className="text-xs text-gray-300">
                                  #{selectedRegistration.editHistory.length - index}
                                </div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="mb-2">
                                  <strong className="text-yellow-400">Fields Changed:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {edit.editedFields?.map((field, fieldIndex) => (
                                      <span key={fieldIndex} className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs">
                                        {field}
                                      </span>
                                    )) || <span className="text-gray-400">No fields specified</span>}
                                  </div>
                                </div>
                                
                                {edit.previousValues && Object.keys(edit.previousValues).length > 0 && (
                                  <div>
                                    <strong className="text-cyan-400">Previous Values:</strong>
                                    <div className="mt-1 text-xs">
                                      {Object.entries(edit.previousValues).map(([key, value]) => (
                                        <div key={key} className="text-gray-300">
                                          <span className="text-cyan-300">{key}:</span> {JSON.stringify(value)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          <Edit2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No edit history available</p>
                          <p className="text-xs">This registration hasn't been modified yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Form */}
      {showManualRegistration && (
        <ManualRegistrationForm
          onClose={() => setShowManualRegistration(false)}
          onSuccess={() => fetchRegistrations()}
        />
      )}

      {/* Email Management Modal */}
      {showEmailManagement && (
        <EmailManagement
          selectedRegistrations={selectedRegistrations}
          onClose={() => setShowEmailManagement(false)}
        />
      )}
    </div>
  );
}
