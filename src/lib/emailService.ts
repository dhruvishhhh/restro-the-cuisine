import emailjs from "@emailjs/browser";

// EmailJS Configuration
// To set up: Go to https://www.emailjs.com/
// 1. Create an account & email service (Gmail, Outlook, etc.)
// 2. Create a template with variables: {{to_email}}, {{to_name}}, {{date}}, {{time}}, {{guests}}, {{location}}, {{table_marking}}, {{qr_code_url}}, {{check_in_token}}
// 3. Replace these IDs with your own:
const EMAILJS_SERVICE_ID = "service_dxdyseb";
const EMAILJS_TEMPLATE_ID = "template_lqzq74b";
const EMAILJS_PUBLIC_KEY = "268rLLEoF7z_VEAEX";

export interface ApprovalEmailData {
  to_email: string;
  to_name: string;
  date: string;
  time: string;
  guests: string;
  location: string;
  table_marking: string;
  check_in_token: string;
  html_content?: string;
  location_map_url?: string;
}

export const getMapUrl = (location: string): string => {
  if (location.toLowerCase().includes("anand")) {
    return "https://maps.app.goo.gl/x8ZDg1hwzR7gSJUv6";
  }
  if (location.toLowerCase().includes("vadodara")) {
    return "https://maps.app.goo.gl/pzJaAyTHi8DjG1nM7";
  }
  return "#";
};

export const sendApprovalEmail = async (data: ApprovalEmailData): Promise<boolean> => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.check_in_token)}&color=000000&bgcolor=FFFFFF&margin=20&format=png&qzone=4`;
  const mapUrl = data.location_map_url || getMapUrl(data.location);

  const templateParams = {
    to_email: data.to_email,
    to_name: data.to_name,
    date: data.date,
    time: data.time,
    guests: data.guests,
    location: data.location,
    table_marking: data.table_marking,
    qr_code_url: qrCodeUrl,
    check_in_token: data.check_in_token,
    location_map_url: mapUrl,
    html_content: data.html_content || "",
    subject: "Your Reservation at Restro Global Cuisine is Approved!",
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error("[EmailJS] Failed to send approval email:", error);
    return false;
  }
};

/**
 * Send a reminder email 30 minutes before the reservation.
 */
export const sendReminderEmail = async (data: ApprovalEmailData): Promise<boolean> => {
  const mapUrl = data.location_map_url || getMapUrl(data.location);
  const reminderTemplateId = "template_lqzq74b"; // Re-using same for now if another isn't ready, but with custom HTML

  const templateParams = {
    ...data,
    location_map_url: mapUrl,
    subject: `See you in 30 Minutes! Your table is ready at ${data.location}`,
    html_content: generateReminderEmailHTML(data),
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, reminderTemplateId, templateParams, EMAILJS_PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error("[EmailJS] Failed to send reminder email:", error);
    return false;
  }
};

export const generateApprovalEmailHTML = (data: ApprovalEmailData): string => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.check_in_token)}&color=000000&bgcolor=FFFFFF&margin=20&format=png&qzone=4`;
  const mapUrl = data.location_map_url || getMapUrl(data.location);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#1a1a1a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#2a2a2a;border:1px solid #3a3a3a;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2d3a2e,#1a1a1a);padding:40px 40px 30px;text-align:center;">
          <p style="color:#c4a86b;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px;">Restro Global Cuisine</p>
          <h1 style="color:#f5f0eb;font-size:24px;margin:0;font-weight:normal;">Your Reservation is Confirmed</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:30px 40px;">
          <p style="color:#c4a86b;font-size:14px;margin:0 0 20px;">Dear ${data.to_name},</p>
          <p style="color:#a0998f;font-size:14px;line-height:1.7;margin:0 0 30px;">We are delighted to confirm your reservation. Your table is prepared and ready for <strong>${data.guests} guests</strong> at our <strong>${data.location}</strong> hub.</p>
          
          <div style="text-align:center;margin-bottom:30px;">
            <a href="${mapUrl}" style="display:inline-block;padding:12px 24px;background-color:#c4a86b;color:#1a1a1a;text-decoration:none;border-radius:4px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">View Location on Maps</a>
          </div>

          <!-- Details Grid -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border:1px solid #3a3a3a;border-radius:8px;margin-bottom:30px;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #3a3a3a;border-right:1px solid #3a3a3a;width:50%;">
                <p style="color:#888;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Date</p>
                <p style="color:#f5f0eb;font-size:16px;font-weight:bold;margin:0;">${data.date}</p>
              </td>
              <td style="padding:16px 20px;border-bottom:1px solid #3a3a3a;">
                <p style="color:#888;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Time</p>
                <p style="color:#f5f0eb;font-size:16px;font-weight:bold;margin:0;">${data.time}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-right:1px solid #3a3a3a;">
                <p style="color:#888;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Guests</p>
                <p style="color:#f5f0eb;font-size:16px;font-weight:bold;margin:0;">${data.guests} People</p>
              </td>
              <td style="padding:16px 20px;">
                <p style="color:#888;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Table</p>
                <p style="color:#c4a86b;font-size:16px;font-weight:bold;margin:0;">${data.table_marking}</p>
              </td>
            </tr>
          </table>
          <!-- QR Code -->
          <div style="text-align:center;padding:40px;background:#FFFFFF;border-radius:16px;margin-bottom:30px;border:3px solid #e0e0e0;">
            <p style="color:#1a1a1a;font-size:9px;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin:0 0 20px;font-family:sans-serif;">Your Entry Pass</p>
            <img src="${qrCodeUrl}" alt="Entry QR Code" width="250" height="250" style="display:block;margin:0 auto 16px;border:2px solid #f0f0f0;border-radius:8px;" />
            <p style="color:#555;font-size:11px;margin:0;font-style:italic;">Present this QR code at the entrance for seamless check-in.</p>
          </div>
          <p style="color:#a0998f;font-size:14px;line-height:1.7;margin:0;">We look forward to hosting you soon.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #3a3a3a;text-align:center;">
          <p style="color:#666;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0;">Restro Global Cuisine</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

export const generateReminderEmailHTML = (data: ApprovalEmailData): string => {
  const mapUrl = data.location_map_url || getMapUrl(data.location);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#1a1a1a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#2a2a2a;border:1px solid #3a3a3a;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2d3a2e,#1a1a1a);padding:40px 40px 30px;text-align:center;">
          <p style="color:#c4a86b;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px;">Excitement Awaits</p>
          <h1 style="color:#f5f0eb;font-size:24px;margin:0;font-weight:normal;">Your Experience Starts in 30 Minutes</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:30px 40px;">
          <p style="color:#c4a86b;font-size:14px;margin:0 0 20px;">Hi ${data.to_name},</p>
          <p style="color:#a0998f;font-size:14px;line-height:1.7;margin:0 0 30px;">Just a friendly reminder that your table for <strong>${data.guests} guests</strong> is being prepared at <strong>${data.location}</strong>. We're excited to see you very soon!</p>
          
          <div style="text-align:center;margin:30px 0;">
             <p style="color:#f5f0eb;font-size:16px;margin:0 0 15px;">Need directions?</p>
            <a href="${mapUrl}" style="display:inline-block;padding:12px 24px;background-color:#c4a86b;color:#1a1a1a;text-decoration:none;border-radius:4px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">View Location Map</a>
          </div>

          <p style="color:#a0998f;font-size:14px;line-height:1.7;margin:0;">Safe travels. Your seat at ${data.table_marking} is waiting.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #3a3a3a;text-align:center;">
          <p style="color:#666;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0;">Restro Global Cuisine</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
