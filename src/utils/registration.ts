// Utility functions for registration

export const generateRegistrationUrl = (
  eventId?: number,
  eventType?: "event" | "workshop" | "non-tech"
): string => {
  const baseUrl = "/registration";

  if (!eventId || !eventType) {
    return baseUrl;
  }

  const params = new URLSearchParams({
    eventId: eventId.toString(),
    type: eventType,
  });

  return `${baseUrl}?${params.toString()}`;
};

export const formatPrice = (price: string): string => {
  if (price.toLowerCase() === "free") {
    return "Free";
  }

  // Add ₹ symbol if not present
  if (!price.includes("₹") && !price.toLowerCase().includes("free")) {
    return `₹${price}`;
  }

  return price;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  // Indian phone number validation
  // Mobile: 10 digits starting with 6,7,8,9 OR with country code +91
  // Landline: 10-11 digits
  const indianMobileRegex = /^[6-9]\d{9}$/; // 10 digits starting with 6,7,8,9
  const indianMobileWithCountryCodeRegex = /^91[6-9]\d{9}$/; // +91 followed by mobile
  const indianLandlineRegex = /^0\d{2,4}\d{6,8}$/; // Landline format

  return (
    indianMobileRegex.test(cleanPhone) ||
    indianMobileWithCountryCodeRegex.test(cleanPhone) ||
    indianLandlineRegex.test(cleanPhone)
  );
};

export const validateIndianTransactionId = (transactionId: string): boolean => {
  if (!transactionId || transactionId.trim().length === 0) {
    return false;
  }

  // Common Indian transaction ID patterns
  const patterns = [
    /^\d{12}$/, // UPI Transaction ID (12 digits)
    /^[A-Z0-9]{10,20}$/, // Bank transaction reference
    /^\d{6,16}$/, // Generic transaction ID
    /^[A-Z]{2,4}\d{8,16}$/, // Bank code + numbers
    /^T\d{10,15}$/, // Transaction IDs starting with T
    /^[0-9A-Z]{8,25}$/, // Alphanumeric transaction IDs
  ];

  return patterns.some((pattern) =>
    pattern.test(transactionId.trim().toUpperCase())
  );
};
