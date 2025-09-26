import { NextApiRequest, NextApiResponse } from 'next';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

// Backup function to log emails locally
function logEmailSubmission(data: any) {
  try {
    const logsDir = path.join(process.cwd(), 'email-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(
      logsDir,
      `email-submissions-${new Date().toISOString().split('T')[0]}.json`
    );
    const submission = {
      ...data,
      submittedAt: new Date().toISOString()
    };

    let logs = [] as any[];
    if (fs.existsSync(logFile)) {
      const existingLogs = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(existingLogs);
    }

    logs.push(submission);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log('✅ Email submission logged to file:', logFile);
  } catch (error) {
    console.error('Failed to log email submission:', error);
  }
}

// Web3Forms backup email function
async function sendViaWeb3Forms(emailData: any) {
  try {
    console.log('🔄 Sending via Web3Forms backup...');

    const web3FormsAccessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!web3FormsAccessKey) {
      console.warn('WEB3FORMS_ACCESS_KEY not set; skipping Web3Forms backup send.');
      return { success: false, error: 'WEB3FORMS not configured' };
    }

    const web3FormsData = {
      access_key: web3FormsAccessKey,
      subject: '🚀 New EventBuddy Demo Request',
      from_name: 'EventBuddy Lead System',
      email: 'amaobiokeoma@gmail.com',
      message: `
New demo request from EventBuddy landing page:

📧 Email: ${emailData.email}
🕒 Timestamp: ${emailData.timestamp}
📱 Source: ${emailData.source}
🌐 User Agent: ${emailData.userAgent}
🌍 IP Address: ${emailData.ip}

Please follow up with this potential customer within 24 hours for best conversion rates!

---
EventBuddy AI - Discord Event Bot
Automated lead notification system
      `,
      lead_email: emailData.email,
      lead_timestamp: emailData.timestamp,
      lead_source: emailData.source,
      lead_ip: emailData.ip
    } as Record<string, any>;

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(web3FormsData)
    });

    const result = await response.json();

    if (response.status === 200) {
      console.log('✅ Web3Forms email sent successfully:', result);
      return { success: true, result };
    } else {
      console.error('❌ Web3Forms failed:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('❌ Web3Forms error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send user confirmation email via Web3Forms
async function sendUserConfirmationViaWeb3Forms(userEmail: string) {
  try {
    console.log('📧 Sending user confirmation via Web3Forms...');

    const web3FormsAccessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!web3FormsAccessKey) {
      console.warn('WEB3FORMS_ACCESS_KEY not set; skipping user confirmation via Web3Forms.');
      return { success: false, error: 'WEB3FORMS not configured' };
    }

    const confirmationData = {
      access_key: web3FormsAccessKey,
      subject: "✅ Demo request received - I'll reach out personally within 48hrs",
      from_name: 'EventBuddy Team',
      email: userEmail,
      message: `
Hey there! 👋

Thanks for requesting an EventBuddy demo - your submission just came through!

**This is an automated confirmation**, but here's what happens next:

I'll personally reach out to you within the next 48 hours to schedule a personalized 15-minute demo. No generic presentation - just me walking through exactly how EventBuddy can save you 10+ hours per event.

🔥 **What I'll show you:**
• How to import 1,000+ attendees in under 30 seconds (yes, really)
• The AI assistant that cuts mod workload by 80%
• Live dashboard with real-time engagement metrics
• Auto-channel creation that community managers are raving about

I'll include a private scheduling link in my personal email so you can pick a time that works best for you.

P.S. - Our beta users are calling EventBuddy "the missing piece" for Discord events. One organizer went from 12 hours of setup to just 45 minutes!

Talk soon,
Okey Amy (EventBuddy Creator)

---
🚀 EventBuddy AI - Making Discord events effortless
Questions? Just reply to this email!
      `,
      reply_to: 'amaobiokeoma@gmail.com'
    } as Record<string, any>;

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(confirmationData)
    });

    const result = await response.json();

    if (response.status === 200) {
      console.log('✅ User confirmation sent via Web3Forms');
      return { success: true, result };
    } else {
      console.error('❌ User confirmation failed:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('❌ User confirmation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function setCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const submissionData = {
    email: req.body.email,
    forwardTo: req.body.forwardTo,
    timestamp: req.body.timestamp,
    source: req.body.source,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  };

  // Always log the submission first
  logEmailSubmission(submissionData);

  try {
    const { email, forwardTo, timestamp, source } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    console.log('=== EMAIL SUBMISSION START ===');
    console.log('Email:', email);
    console.log('Target Email:', forwardTo || 'amaobiokeoma@gmail.com');
    console.log('Timestamp:', timestamp);
    console.log('Source:', source);
    console.log('================================');

    let mailgunSuccess = false;
    let web3FormsSuccess = false;
    let userConfirmationSuccess = false;
    let mailgunResponse, web3FormsResponse, userConfirmationResponse;

    // Try Mailgun first (if activated)
    try {
      console.log('🚀 Attempting Mailgun first...');

      const mailgunApiKey = process.env.MAILGUN_API_KEY;
      const mailgunDomain = process.env.MAILGUN_DOMAIN; // e.g. sandboxXXXX.mailgun.org or your custom domain

      if (!mailgunApiKey || !mailgunDomain) {
        throw new Error('Mailgun not configured: set MAILGUN_API_KEY and MAILGUN_DOMAIN');
      }

      const mailgun = new Mailgun(FormData);
      const mg = mailgun.client({
        username: 'api',
        key: mailgunApiKey,
        url: 'https://api.mailgun.net'
      });

      const domain = mailgunDomain;
      const targetEmail = forwardTo || 'amaobiokeoma@gmail.com';

      // Notification email to you
      const notificationEmail: any = {
        from: `EventBuddy Notifications <postmaster@${domain}>`,
        to: [targetEmail],
        subject: '🚀 New EventBuddy Demo Request',
        text: `
New demo request from EventBuddy landing page:

Email: ${email}
Timestamp: ${timestamp}
Source: ${source}
User Agent: ${req.headers['user-agent']}
IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}

Please follow up with this potential customer!

---
EventBuddy AI - Discord Event Bot
        `
      } as Record<string, any>;

      // User confirmation email
      const confirmationEmail: any = {
        from: `EventBuddy Team <postmaster@${domain}>`,
        to: [email],
        subject: "✅ Demo request received - I'll reach out personally within 48hrs",
        text: `
Hey there! 👋

Thanks for requesting an EventBuddy demo - your submission just came through!

**This is an automated confirmation**, but here's what happens next:

I'll personally reach out to you within the next 48 hours to schedule a personalized 15-minute demo. No generic presentation - just me walking through exactly how EventBuddy can save you 10+ hours per event.

🔥 What I'll show you:
• How to import 1,000+ attendees in under 30 seconds (yes, really)
• The AI assistant that cuts mod workload by 80%
• Live dashboard with real-time engagement metrics
• Auto-channel creation that community managers are raving about

I'll include a private scheduling link in my personal email so you can pick a time that works best for you.

P.S. - Our beta users are calling EventBuddy "the missing piece" for Discord events. One organizer went from 12 hours of setup to just 45 minutes!

Talk soon,
Okey Amy (EventBuddy Creator)

---
🚀 EventBuddy AI - Making Discord events effortless
Questions? Just reply to this email!
        `
      } as Record<string, any>;

      // Send notification via Mailgun
      mailgunResponse = await (mg as any).messages.create(domain, notificationEmail);
      console.log('✅ Mailgun notification sent:', mailgunResponse.id);
      mailgunSuccess = true;

      // Send user confirmation via Web3Forms to avoid Mailgun sandbox recipient limits
      try {
        userConfirmationResponse = await sendUserConfirmationViaWeb3Forms(email);
        userConfirmationSuccess = (userConfirmationResponse as any).success;
        console.log('✅ Web3Forms user confirmation triggered');
      } catch (userError) {
        console.error('⚠️ Web3Forms user confirmation failed:', userError);
      }
    } catch (mailgunError) {
      console.error('⚠️ Mailgun failed:', mailgunError);

      // If Mailgun fails, try Web3Forms
      console.log('🔄 Falling back to Web3Forms...');

      web3FormsResponse = await sendViaWeb3Forms(submissionData);
      web3FormsSuccess = (web3FormsResponse as any).success;

      if (web3FormsSuccess) {
        // Also try to send user confirmation via Web3Forms
        userConfirmationResponse = await sendUserConfirmationViaWeb3Forms(email);
        userConfirmationSuccess = (userConfirmationResponse as any).success;
      }
    }

    // If Mailgun succeeded but user confirmation failed, try Web3Forms for user confirmation
    if (mailgunSuccess && !userConfirmationSuccess) {
      console.log('🔄 Trying Web3Forms for user confirmation...');
      userConfirmationResponse = await sendUserConfirmationViaWeb3Forms(email);
      userConfirmationSuccess = (userConfirmationResponse as any).success;
    }

    // Determine overall success
    const notificationSent = mailgunSuccess || web3FormsSuccess;

    if (notificationSent) {
      console.log('✅ Email notification sent successfully!');
      return res.status(200).json({
        success: true,
        message: "Demo request submitted successfully! We'll be in touch soon.",
        notificationSent: true,
        userConfirmationSent: userConfirmationSuccess,
        method: mailgunSuccess ? 'mailgun' : 'web3forms',
        mailgunId: (mailgunResponse as any)?.id,
        web3FormsSuccess: web3FormsSuccess
      });
    } else {
      console.log('⚠️ All email methods failed, but submission logged');
      return res.status(200).json({
        success: true,
        message: "Demo request received and logged. We'll follow up soon!",
        emailLogged: true,
        notificationSent: false,
        userConfirmationSent: userConfirmationSuccess
      });
    }
  } catch (error) {
    console.error('=== EMAIL API ERROR ===');
    console.error('Error details:', error);
    console.error('=====================');

    return res.status(200).json({
      success: true,
      message: 'Demo request received and logged for follow-up',
      emailLogged: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
