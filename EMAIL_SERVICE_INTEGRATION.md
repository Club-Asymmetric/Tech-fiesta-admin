# Email Service Integration for Admin Dashboard

This document explains how to use the email service integration in the Tech Fiesta 2025 Admin Dashboard.

## Features

The email service integration provides the following features:

- ✅ **Email Service Status**: Monitor the status of all 5 configured email accounts
- ✅ **Manual Email Sending**: Send confirmation emails for manual registrations
- ✅ **Test Email Functionality**: Send test emails to verify service functionality
- ✅ **Custom Email Sending**: Send custom notification emails
- ✅ **Individual Email Buttons**: Send emails directly from the registration list
- ✅ **Bulk Email Operations**: Send emails to multiple registrations at once
- ✅ **Real-time Status Updates**: View email usage and service health
- ✅ **Authentication**: Secure API communication with Firebase authentication

## How to Use

### 1. Access Email Management

- Click the **"Email Management"** button in the admin dashboard header
- This opens the Email Management modal with three tabs:
  - **Service Status**: View email service health and usage
  - **Send Emails**: Send confirmation emails and test emails
  - **Custom Email**: Send custom notification emails

### 2. Service Status Tab

Monitor your email service health:

- **Configured**: Shows how many email accounts are properly configured (out of 5)
- **Active**: Shows how many accounts are currently available for sending
- **Today's Usage**: Total emails sent today across all accounts
- **Individual Account Status**: Each account shows:
  - Configuration status (configured/not configured)
  - Current usage vs daily limit (500 emails per account)
  - Activity status (active/limit reached)
  - Usage progress bar

### 3. Send Emails Tab

#### Send Confirmation Emails

- Select registrations from the main table (checkbox functionality to be added)
- Click "Send X Email(s)" to send confirmation emails to selected registrations
- Monitor progress and results in the activity log

#### Send Test Email

- Enter a recipient email address
- Click "Send Test" to send a test registration email
- Useful for verifying email service functionality

### 4. Custom Email Tab

Send custom notification emails:

- **To**: Enter recipient email address
- **Subject**: Enter email subject line
- **Content**: Enter email content (supports plain text with line breaks)
- Click "Send Custom Email" to send

### 5. Individual Email Buttons

Send emails directly from the registration list:

- Click the **mail icon** (📧) in the Actions column of any registration
- This sends a confirmation email immediately to that specific registration
- Button shows spinning icon while sending
- Success/error message appears as alert

## Email Templates

The service uses the same comprehensive email templates as the backend:

### Registration Confirmation Email Features:

- **Personalized greeting** with participant details
- **Event details** including selected tech events, workshops, and non-tech events
- **Team information** for team registrations
- **Payment details** or free registration indication
- **Pass information** if applicable
- **Important instructions** for event participation
- **Contact information** for support

### Test Email Features:

- **Service verification** with timestamp
- **Sample registration data** to test template rendering
- **Clean formatting** matching the main template design

## Backend Integration

### API Endpoints Used:

- `GET /api/payment/email-status` - Get email service status
- `POST /api/payment/send-manual-email` - Send confirmation emails for manual entries
- `POST /api/payment/test-email` - Send test emails
- `POST /api/payment/send-notification` - Send custom notification emails

### Authentication:

- All API calls are authenticated using Firebase ID tokens
- Tokens are automatically included in request headers
- Handles authentication errors gracefully

## Email Account Configuration

The backend uses 5 Gmail accounts with app passwords:

- **Email rotation** prevents hitting daily limits
- **500 emails per account per day** (2500 total daily capacity)
- **Automatic failover** if an account reaches its limit
- **Usage tracking** to monitor email quotas

## Troubleshooting

### Common Issues:

1. **"Authentication required" error**:

   - Ensure you're logged in to the admin dashboard
   - Check that your email is in the admin whitelist

2. **"Failed to get email service status" error**:

   - Verify the backend server is running
   - Check the API URL configuration in `.env.local`
   - Ensure the backend has proper email configuration

3. **Email sending failures**:

   - Check the email service status tab for account health
   - Verify recipient email addresses are valid
   - Check backend logs for detailed error messages

4. **High email usage warnings**:
   - Monitor the Service Status tab
   - If usage is high, consider spacing out bulk email operations
   - The system will automatically rotate to available accounts

### Configuration Files:

**Frontend (`/Tech-fiesta-admin/.env.local`):**

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend (`/Tech-fiesta-backend/.env`):**

```bash
EMAIL_1=asymmetricmailer1@gmail.com
EMAIL_1_PASSWORD=trzs aazd neyy kopt
# ... (other email accounts)
```

## Best Practices

1. **Monitor Usage**: Regularly check the Service Status tab to monitor email quotas
2. **Test First**: Use the test email functionality before sending bulk emails
3. **Batch Processing**: For large numbers of emails, send in smaller batches
4. **Error Handling**: Check the activity log for any failed email sends
5. **Custom Emails**: Use custom emails for special announcements or updates

## Security Notes

- All email communications are authenticated through Firebase
- Email account passwords are stored securely in environment variables
- API endpoints require valid authentication tokens
- Admin access is restricted to whitelisted email addresses

For technical support or configuration issues, contact the development team.
