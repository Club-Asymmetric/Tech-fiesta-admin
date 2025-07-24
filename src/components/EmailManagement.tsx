import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  MessageSquare,
  Activity,
  Clock,
  Loader,
} from "lucide-react";
import {
  getEmailServiceStatus,
  sendRegistrationConfirmationEmail,
  sendTestEmail,
  sendNotificationEmail,
  EmailServiceStatus,
} from "@/services/emailService";
import { FirebaseRegistration } from "@/services/registrationService";

interface EmailManagementProps {
  selectedRegistrations?: FirebaseRegistration[];
  onClose: () => void;
}

interface EmailResult {
  type: string;
  message: string;
  success: boolean;
  timestamp: number;
}

export default function EmailManagement({
  selectedRegistrations = [],
  onClose,
}: EmailManagementProps) {
  const [emailStatus, setEmailStatus] = useState<EmailServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [customEmail, setCustomEmail] = useState({
    to: "",
    subject: "",
    content: "",
  });
  const [activeTab, setActiveTab] = useState<"status" | "send" | "custom">(
    "status"
  );
  const [results, setResults] = useState<EmailResult[]>([]);

  const fetchEmailStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getEmailServiceStatus();
      setEmailStatus(response.data.emailConfigs);
    } catch (error) {
      console.error("Error fetching email status:", error);
      addResult("error", "Failed to fetch email service status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailStatus();
  }, [fetchEmailStatus]);

  const addResult = (
    type: string,
    message: string,
    success: boolean = type === "success"
  ) => {
    setResults((prev) => [
      { type, message, success, timestamp: Date.now() },
      ...prev.slice(0, 9),
    ]);
  };

  const handleSendConfirmationEmails = async () => {
    if (selectedRegistrations.length === 0) {
      addResult("warning", "No registrations selected");
      return;
    }

    setSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (const registration of selectedRegistrations) {
      try {
        const result = await sendRegistrationConfirmationEmail(
          registration,
          true
        );
        if (result.success) {
          successCount++;
          addResult("success", `Email sent to ${registration.email}`);
        } else {
          errorCount++;
          addResult(
            "error",
            `Failed to send email to ${registration.email}: ${result.error}`
          );
        }
        // Add a small delay to avoid overwhelming the email service
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
        addResult(
          "error",
          `Error sending email to ${registration.email}: ${
            (error as Error).message || "Unknown error"
          }`
        );
      }
    }

    addResult("info", `Completed: ${successCount} sent, ${errorCount} failed`);
    setSending(false);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      addResult("warning", "Please enter a recipient email");
      return;
    }

    setSending(true);
    try {
      const result = await sendTestEmail("registration", testEmailRecipient);
      if (result.success) {
        addResult("success", `Test email sent to ${testEmailRecipient}`);
        setTestEmailRecipient("");
      } else {
        addResult("error", `Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      addResult(
        "error",
        `Error sending test email: ${
          (error as Error).message || "Unknown error"
        }`
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendCustomEmail = async () => {
    if (
      !customEmail.to.trim() ||
      !customEmail.subject.trim() ||
      !customEmail.content.trim()
    ) {
      addResult("warning", "Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const result = await sendNotificationEmail(
        customEmail.to,
        customEmail.subject,
        customEmail.content.replace(/\n/g, "<br>"),
        customEmail.content
      );

      if (result.success) {
        addResult("success", `Custom email sent to ${customEmail.to}`);
        setCustomEmail({ to: "", subject: "", content: "" });
      } else {
        addResult("error", `Failed to send custom email: ${result.error}`);
      }
    } catch (error) {
      addResult(
        "error",
        `Error sending custom email: ${
          (error as Error).message || "Unknown error"
        }`
      );
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (config: EmailServiceStatus) => {
    if (!config.isConfigured) return "bg-gray-600";
    if (!config.isActive) return "bg-red-600";
    const usagePercent = (config.currentUsage / config.dailyLimit) * 100;
    if (usagePercent > 80) return "bg-orange-600";
    if (usagePercent > 50) return "bg-yellow-600";
    return "bg-green-600";
  };

  const totalConfigured = emailStatus.filter(
    (config) => config.isConfigured
  ).length;
  const totalUsage = emailStatus.reduce(
    (sum, config) => sum + config.currentUsage,
    0
  );
  const activeConfigs = emailStatus.filter((config) => config.isActive).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                Email Management
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-600 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-medium">Configured</h3>
                  <p className="text-2xl font-bold">{totalConfigured}/5</p>
                </div>
              </div>
            </div>
            <div className="bg-green-600 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-medium">Active</h3>
                  <p className="text-2xl font-bold">{activeConfigs}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-600 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-medium">Today&apos;s Usage</h3>
                  <p className="text-2xl font-bold">{totalUsage}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-600 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-medium">Selected</h3>
                  <p className="text-2xl font-bold">
                    {selectedRegistrations.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
            {[
              { id: "status", label: "Service Status", icon: Activity },
              { id: "send", label: "Send Emails", icon: Send },
              { id: "custom", label: "Custom Email", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "status" | "send" | "custom")
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-600"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Service Status Tab */}
          {activeTab === "status" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Email Service Status
                </h3>
                <button
                  onClick={fetchEmailStatus}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-400" />
                  <p className="text-gray-400">Loading email status...</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {emailStatus.map((config) => (
                    <div
                      key={config.index}
                      className="bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              config
                            )}`}
                          ></div>
                          <div>
                            <h4 className="font-medium text-white">
                              Email Config {config.index}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {config.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">
                            {config.currentUsage}/{config.dailyLimit}
                          </p>
                          <p className="text-xs text-gray-400">
                            {config.isConfigured
                              ? config.isActive
                                ? "Active"
                                : "Limit Reached"
                              : "Not Configured"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(
                            config
                          )}`}
                          style={{
                            width: `${
                              (config.currentUsage / config.dailyLimit) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send Emails Tab */}
          {activeTab === "send" && (
            <div className="space-y-6">
              {/* Bulk Send Confirmation Emails */}
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Send Confirmation Emails
                </h3>
                <p className="text-gray-400 mb-4">
                  Send registration confirmation emails to{" "}
                  {selectedRegistrations.length} selected registration(s).
                </p>
                <button
                  onClick={handleSendConfirmationEmails}
                  disabled={sending || selectedRegistrations.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sending
                    ? "Sending..."
                    : `Send ${selectedRegistrations.length} Email(s)`}
                </button>
              </div>

              {/* Test Email */}
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Send Test Email
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Enter recipient email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={sending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Email Tab */}
          {activeTab === "custom" && (
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">
                Send Custom Email
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To:
                  </label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={customEmail.to}
                    onChange={(e) =>
                      setCustomEmail({ ...customEmail, to: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject:
                  </label>
                  <input
                    type="text"
                    placeholder="Email subject"
                    value={customEmail.subject}
                    onChange={(e) =>
                      setCustomEmail({
                        ...customEmail,
                        subject: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content:
                  </label>
                  <textarea
                    placeholder="Email content"
                    rows={6}
                    value={customEmail.content}
                    onChange={(e) =>
                      setCustomEmail({
                        ...customEmail,
                        content: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                  />
                </div>
                <button
                  onClick={handleSendCustomEmail}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
                >
                  {sending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Custom Email
                </button>
              </div>
            </div>
          )}

          {/* Results Log */}
          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Activity
              </h3>
              <div className="bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border-b border-gray-600 last:border-b-0"
                  >
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          result.success ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {result.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
