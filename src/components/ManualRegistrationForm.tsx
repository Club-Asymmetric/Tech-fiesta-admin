//@ts-nocheck

"use client";

import { useState } from "react";
import { createManualRegistration } from "@/services/registrationService";
import { getCurrentAdminUser } from "@/utils/adminAuth";
import {
  X,
  Save,
  Plus,
  Trash2,
  UserPlus,
  Calendar,
  Building,
  Mail,
  Phone,
  Users,
  Star,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Book,
} from "lucide-react";

interface ManualRegistrationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualRegistrationForm({
  onClose,
  onSuccess,
}: ManualRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    whatsapp: "",
    college: "",
    department: "",
    year: "",

    // Event Selections
    selectedEvents: [],
    selectedWorkshops: [],
    selectedNonTechEvents: [],
    isTeamEvent: false,
    teamSize: 1,
    teamMembers: [],

    // Pass Information
    ispass: false,
    selectedPassId: null,

    // Contact Details
    contactDetails: {
      emergencyContact: "",
      emergencyPhone: "",
      dietaryRestrictions: "",
      accessibility: "",
    },

    // Status
    status: "confirmed",
    paymentStatus: "verified",

    // Admin Notes
    adminNotes: {
      generalNotes: "",
      specialRequirements: "",
      flagged: false,
      flagReason: "",
    },
  });

  // Predefined options (these should ideally come from your backend)
  const techEvents = [
    { id: 1, title: "Try, If you can..?", price: "₹99", citPrice: "₹59" },
    { id: 2, title: "Reverse Code", price: "₹99", citPrice: "₹59" },
    { id: 3, title: "Escape Room", price: "₹99", citPrice: "₹59" },
    { id: 4, title: "Memory Forensics", price: "₹99", citPrice: "₹59" },
    { id: 5, title: "Bug Bounty", price: "₹99", citPrice: "₹59" },
    { id: 6, title: "Code Breaking", price: "₹99", citPrice: "₹59" },
    { id: 7, title: "Crack the Code", price: "₹99", citPrice: "₹59" },
    { id: 8, title: "Trace the Flag", price: "₹99", citPrice: "₹59" },
    { id: 9, title: "AI Prompt Challenge", price: "₹99", citPrice: "₹59" },
  ];

  const workshops = [
    { id: 1, title: "Blend with Blender", price: "₹100" },
    { id: 2, title: "Product Cyber Security", price: "₹100" },
    { id: 3, title: "Web Application Security", price: "₹100" },
    { id: 4, title: "Android Security", price: "₹100" },
    { id: 5, title: "Networking with IT Corporates", price: "₹100" },
    { id: 6, title: "Introduction to OSINT", price: "₹100" },
  ];

  const nonTechEvents = [
    {
      id: 1,
      title: "Photo Contest",
      description: "Capture the perfect moment",
    },
    { id: 2, title: "Meme Contest", description: "Create viral memes" },
    { id: 3, title: "Reel Contest", description: "Short video creativity" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-600" },
    { value: "confirmed", label: "Confirmed", color: "bg-green-600" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-600" },
  ];

  const paymentStatusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-600" },
    { value: "verified", label: "Verified", color: "bg-green-600" },
    { value: "failed", label: "Failed", color: "bg-red-600" },
    { value: "not-required", label: "Not Required", color: "bg-blue-600" },
  ];

  const handleEventSelection = (
    event: any,
    type: "tech" | "workshop" | "nontech"
  ) => {
    const fieldName =
      type === "tech"
        ? "selectedEvents"
        : type === "workshop"
        ? "selectedWorkshops"
        : "selectedNonTechEvents";

    const currentList = formData[fieldName];
    const isSelected = currentList.some((item: any) => item.id === event.id);

    if (isSelected) {
      setFormData({
        ...formData,
        [fieldName]: currentList.filter((item: any) => item.id !== event.id),
      });
    } else {
      setFormData({
        ...formData,
        [fieldName]: [...currentList, event],
      });
    }
  };

  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [
        ...formData.teamMembers,
        { name: "", email: "", whatsapp: "" },
      ],
    });
  };

  const removeTeamMember = (index: number) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter((_, i) => i !== index),
    });
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updatedMembers = [...formData.teamMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData({
      ...formData,
      teamMembers: updatedMembers,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.name ||
        !formData.email ||
        !formData.whatsapp ||
        !formData.college
      ) {
        alert("Please fill in all required personal information fields.");
        return;
      }

      if (
        formData.isTeamEvent &&
        formData.teamSize > 1 &&
        formData.teamMembers.length < formData.teamSize - 1
      ) {
        alert(
          `Please add ${
            formData.teamSize - 1
          } team member(s) for team registration.`
        );
        return;
      }

      const result = await createManualRegistration({
        ...formData,
        createdBy: getCurrentAdminUser() || "Admin User",
      }, getCurrentAdminUser());

      if (result.success) {
        alert(result.message);
        onSuccess();
        onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error creating manual registration:", error);
      alert("Failed to create registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Personal Info", icon: UserPlus },
    { id: 2, title: "Events & Team", icon: Calendar },
    { id: 3, title: "Contact & Status", icon: CheckCircle },
    { id: 4, title: "Review", icon: Save },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Create Manual Registration
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-2">
                  <div
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      College/Institution *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={formData.college}
                      onChange={(e) =>
                        setFormData({ ...formData, college: e.target.value })
                      }
                      placeholder="Enter college name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="Enter department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Year of Study
                    </label>
                    <select
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Events & Team */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Event Selection & Team Details
                </h3>

                {/* Technical Events */}
                <div>
                  <h4 className="text-md font-medium text-blue-400 mb-3">
                    Technical Events
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {techEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.selectedEvents.some(
                            (e: any) => e.id === event.id
                          )
                            ? "bg-blue-600 border-blue-500"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                        }`}
                        onClick={() => handleEventSelection(event, "tech")}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">
                            {event.title}
                          </span>
                          <span className="text-gray-300 text-xs">
                            {event.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workshops */}
                <div>
                  <h4 className="text-md font-medium text-green-400 mb-3">
                    Workshops
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {workshops.map((workshop) => (
                      <div
                        key={workshop.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.selectedWorkshops.some(
                            (w: any) => w.id === workshop.id
                          )
                            ? "bg-green-600 border-green-500"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                        }`}
                        onClick={() =>
                          handleEventSelection(workshop, "workshop")
                        }
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">
                            {workshop.title}
                          </span>
                          <span className="text-gray-300 text-xs">
                            {workshop.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-Tech Events */}
                <div>
                  <h4 className="text-md font-medium text-purple-400 mb-3">
                    Non-Technical Events
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {nonTechEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.selectedNonTechEvents.some(
                            (e: any) => e.id === event.id
                          )
                            ? "bg-purple-600 border-purple-500"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                        }`}
                        onClick={() => handleEventSelection(event, "nontech")}
                      >
                        <div className="text-white text-sm">{event.title}</div>
                        <div className="text-gray-400 text-xs">
                          {event.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Configuration */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-yellow-400 mb-3">
                    Team Configuration
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isTeamEvent}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isTeamEvent: e.target.checked,
                              teamSize: e.target.checked
                                ? formData.teamSize
                                : 1,
                              teamMembers: e.target.checked
                                ? formData.teamMembers
                                : [],
                            })
                          }
                        />
                        <span className="text-white">Team Event</span>
                      </label>

                      {formData.isTeamEvent && (
                        <div className="flex items-center gap-2">
                          <label className="text-white text-sm">
                            Team Size:
                          </label>
                          <select
                            className="p-2 bg-gray-600 border border-gray-500 rounded text-white"
                            value={formData.teamSize}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                teamSize: parseInt(e.target.value),
                              })
                            }
                          >
                            {[2, 3, 4, 5].map((size) => (
                              <option key={size} value={size}>
                                {size} members
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {formData.isTeamEvent && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-white">
                            Team Members (excluding leader)
                          </h5>
                          <button
                            type="button"
                            onClick={addTeamMember}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          >
                            <Plus className="h-3 w-3" />
                            Add Member
                          </button>
                        </div>

                        {formData.teamMembers.map(
                          (member: any, index: number) => (
                            <div
                              key={index}
                              className="flex gap-2 items-center"
                            >
                              <input
                                type="text"
                                placeholder="Member name"
                                className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                value={member.name}
                                onChange={(e) =>
                                  updateTeamMember(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="email"
                                placeholder="Member email"
                                className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                value={member.email}
                                onChange={(e) =>
                                  updateTeamMember(
                                    index,
                                    "email",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="tel"
                                placeholder="WhatsApp"
                                className="w-32 p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                value={member.whatsapp}
                                onChange={(e) =>
                                  updateTeamMember(
                                    index,
                                    "whatsapp",
                                    e.target.value
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeTeamMember(index)}
                                className="p-2 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pass Information */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-orange-400 mb-3">
                    Pass Information
                  </h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.ispass}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ispass: e.target.checked,
                            selectedPassId: e.target.checked
                              ? formData.selectedPassId
                              : null,
                          })
                        }
                      />
                      <span className="text-white">Has Pass</span>
                    </label>

                    {formData.ispass && (
                      <div className="flex items-center gap-2">
                        <label className="text-white text-sm">Pass ID:</label>
                        <input
                          type="number"
                          className="w-24 p-2 bg-gray-600 border border-gray-500 rounded text-white"
                          value={formData.selectedPassId || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              selectedPassId: parseInt(e.target.value) || null,
                            })
                          }
                          placeholder="Pass #"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact & Status */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Contact Details & Status
                </h3>

                {/* Contact Details */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-green-400 mb-3">
                    Emergency Contact & Preferences
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white"
                        value={formData.contactDetails.emergencyContact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactDetails: {
                              ...formData.contactDetails,
                              emergencyContact: e.target.value,
                            },
                          })
                        }
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white"
                        value={formData.contactDetails.emergencyPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactDetails: {
                              ...formData.contactDetails,
                              emergencyPhone: e.target.value,
                            },
                          })
                        }
                        placeholder="Emergency contact phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Dietary Restrictions
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white"
                        value={formData.contactDetails.dietaryRestrictions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactDetails: {
                              ...formData.contactDetails,
                              dietaryRestrictions: e.target.value,
                            },
                          })
                        }
                        placeholder="Any dietary restrictions"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Accessibility Needs
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white"
                        value={formData.contactDetails.accessibility}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactDetails: {
                              ...formData.contactDetails,
                              accessibility: e.target.value,
                            },
                          })
                        }
                        placeholder="Any accessibility needs"
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Status */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-blue-400 mb-3">
                      Registration Status
                    </h4>
                    <div className="space-y-2">
                      {statusOptions.map((status) => (
                        <label
                          key={status.value}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status.value}
                            checked={formData.status === status.value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value as any,
                              })
                            }
                          />
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-purple-400 mb-3">
                      Payment Status
                    </h4>
                    <div className="space-y-2">
                      {paymentStatusOptions.map((status) => (
                        <label
                          key={status.value}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="paymentStatus"
                            value={status.value}
                            checked={formData.paymentStatus === status.value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                paymentStatus: e.target.value as any,
                              })
                            }
                          />
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-yellow-400 mb-3">
                    Admin Notes
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        General Notes
                      </label>
                      <textarea
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white"
                        rows={3}
                        value={formData.adminNotes.generalNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adminNotes: {
                              ...formData.adminNotes,
                              generalNotes: e.target.value,
                            },
                          })
                        }
                        placeholder="Any general notes about this registration"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Special Requirements
                      </label>
                      <textarea
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white"
                        rows={2}
                        value={formData.adminNotes.specialRequirements}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adminNotes: {
                              ...formData.adminNotes,
                              specialRequirements: e.target.value,
                            },
                          })
                        }
                        placeholder="Any special requirements or accommodations"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.adminNotes.flagged}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              adminNotes: {
                                ...formData.adminNotes,
                                flagged: e.target.checked,
                                flagReason: e.target.checked
                                  ? formData.adminNotes.flagReason
                                  : "",
                              },
                            })
                          }
                        />
                        <Flag className="h-4 w-4 text-red-400" />
                        <span className="text-white">
                          Flag this registration
                        </span>
                      </label>

                      {formData.adminNotes.flagged && (
                        <input
                          type="text"
                          className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white"
                          value={formData.adminNotes.flagReason}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              adminNotes: {
                                ...formData.adminNotes,
                                flagReason: e.target.value,
                              },
                            })
                          }
                          placeholder="Reason for flagging"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Review Registration Details
                </h3>

                <div className="bg-gray-700 p-6 rounded-lg space-y-4">
                  {/* Personal Info Summary */}
                  <div>
                    <h4 className="text-md font-medium text-blue-400 mb-2">
                      Personal Information
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong> {formData.name}
                      </div>
                      <div>
                        <strong>Email:</strong> {formData.email}
                      </div>
                      <div>
                        <strong>WhatsApp:</strong> {formData.whatsapp}
                      </div>
                      <div>
                        <strong>College:</strong> {formData.college}
                      </div>
                      <div>
                        <strong>Department:</strong>{" "}
                        {formData.department || "Not specified"}
                      </div>
                      <div>
                        <strong>Year:</strong>{" "}
                        {formData.year || "Not specified"}
                      </div>
                    </div>
                  </div>

                  {/* Event Summary */}
                  <div>
                    <h4 className="text-md font-medium text-green-400 mb-2">
                      Event Selection
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Technical Events:</strong>{" "}
                        {formData.selectedEvents.length > 0
                          ? formData.selectedEvents
                              .map((e: any) => e.title)
                              .join(", ")
                          : "None"}
                      </div>
                      <div>
                        <strong>Workshops:</strong>{" "}
                        {formData.selectedWorkshops.length > 0
                          ? formData.selectedWorkshops
                              .map((w: any) => w.title)
                              .join(", ")
                          : "None"}
                      </div>
                      <div>
                        <strong>Non-Tech Events:</strong>{" "}
                        {formData.selectedNonTechEvents.length > 0
                          ? formData.selectedNonTechEvents
                              .map((e: any) => e.title)
                              .join(", ")
                          : "None"}
                      </div>
                    </div>
                  </div>

                  {/* Team Summary */}
                  {formData.isTeamEvent && (
                    <div>
                      <h4 className="text-md font-medium text-yellow-400 mb-2">
                        Team Details
                      </h4>
                      <div className="text-sm">
                        <div>
                          <strong>Team Size:</strong> {formData.teamSize}{" "}
                          members
                        </div>
                        {formData.teamMembers.length > 0 && (
                          <div className="mt-2">
                            <strong>Team Members:</strong>
                            <ul className="ml-4 mt-1">
                              {formData.teamMembers.map(
                                (member: any, index: number) => (
                                  <li key={index}>
                                    {member.name} ({member.email}) -{" "}
                                    {member.whatsapp}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Summary */}
                  <div>
                    <h4 className="text-md font-medium text-purple-400 mb-2">
                      Status & Pass
                    </h4>
                    <div className="flex gap-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          statusOptions.find((s) => s.value === formData.status)
                            ?.color
                        }`}
                      >
                        {
                          statusOptions.find((s) => s.value === formData.status)
                            ?.label
                        }
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full ${
                          paymentStatusOptions.find(
                            (s) => s.value === formData.paymentStatus
                          )?.color
                        }`}
                      >
                        {
                          paymentStatusOptions.find(
                            (s) => s.value === formData.paymentStatus
                          )?.label
                        }
                      </span>
                      {formData.ispass && (
                        <span className="px-3 py-1 rounded-full bg-orange-600">
                          Pass #{formData.selectedPassId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes Summary */}
                  {(formData.adminNotes.generalNotes ||
                    formData.adminNotes.specialRequirements ||
                    formData.adminNotes.flagged) && (
                    <div>
                      <h4 className="text-md font-medium text-red-400 mb-2">
                        Admin Notes
                      </h4>
                      <div className="text-sm space-y-1">
                        {formData.adminNotes.generalNotes && (
                          <div>
                            <strong>Notes:</strong>{" "}
                            {formData.adminNotes.generalNotes}
                          </div>
                        )}
                        {formData.adminNotes.specialRequirements && (
                          <div>
                            <strong>Special Requirements:</strong>{" "}
                            {formData.adminNotes.specialRequirements}
                          </div>
                        )}
                        {formData.adminNotes.flagged && (
                          <div className="flex items-center gap-1 text-red-400">
                            <Flag className="h-3 w-3" />
                            <strong>Flagged:</strong>{" "}
                            {formData.adminNotes.flagReason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-600">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-3">
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
