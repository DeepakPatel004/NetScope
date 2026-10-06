import prisma from '../../config/database.js';
import redisConnection from '../../config/redis.js';
import { notificationQueue } from '../../config/queue.js';
import nodemailer from 'nodemailer';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[NotificationService] Custom DNS setServers fallback:', err.message);
}

const severityRanks = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const notificationService = {
  async getUserPreferences(userId) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          email: user?.email || null,
          minSeverity: 'MEDIUM',
        },
      });
    }

    return prefs;
  },

  async updateUserPreferences(userId, data) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        notifyAnomaly: data.notifyAnomaly,
        notifyUnavailable: data.notifyUnavailable,
        notifyCritical: data.notifyCritical,
        notifyRecovery: data.notifyRecovery,
        minSeverity: data.minSeverity || 'MEDIUM',
        email: data.email,
      },
      create: {
        userId,
        notifyAnomaly: data.notifyAnomaly ?? true,
        notifyUnavailable: data.notifyUnavailable ?? true,
        notifyCritical: data.notifyCritical ?? true,
        notifyRecovery: data.notifyRecovery ?? true,
        minSeverity: data.minSeverity || 'MEDIUM',
        email: data.email,
      },
    });
  },

  async dispatchNotification(payload) {
    const { userId, deviceId, incidentId, type, title, message, severity = 'MEDIUM', force = false } = payload;

    const prefs = await this.getUserPreferences(userId);

    // Filter by minSeverity
    const minRank = severityRanks[prefs.minSeverity] || 2;
    const currentRank = severityRanks[severity] || 2;
    if (currentRank < minRank && !force && type !== 'RECOVERY') {
      console.log(`[NotificationService] Suppressed ${type} for user ${userId} (Severity ${severity} below min ${prefs.minSeverity})`);
      return { status: 'suppressed', reason: 'below_min_severity' };
    }

    // Check type preference
    if (type === 'ANOMALY' && !prefs.notifyAnomaly) return { status: 'suppressed', reason: 'type_disabled' };
    if (type === 'INCIDENT' && severity === 'CRITICAL' && !prefs.notifyCritical) return { status: 'suppressed', reason: 'critical_disabled' };
    if (type === 'RECOVERY' && !prefs.notifyRecovery) return { status: 'suppressed', reason: 'recovery_disabled' };

    // Redis Cooldown & Deduplication check
    const cooldownKey = `noti_cooldown:${deviceId || 'global'}:${incidentId || type}`;
    const previousSeverity = await redisConnection.get(cooldownKey);

    if (previousSeverity && !force && type !== 'RECOVERY') {
      const prevRank = severityRanks[previousSeverity] || 0;
      if (currentRank <= prevRank) {
        console.log(`[NotificationService] Anti-Spam Cooldown active for ${cooldownKey}. Suppressing duplicate.`);
        return { status: 'suppressed', reason: 'cooldown_active' };
      }
    }

    // Set cooldown in Redis for 15 minutes (900s)
    if (type !== 'RECOVERY') {
      await redisConnection.set(cooldownKey, severity, 'EX', 900);
    } else {
      await redisConnection.del(cooldownKey);
    }

    // Enqueue job to async BullMQ worker
    await notificationQueue.add('send-notification', {
      userId,
      deviceId,
      incidentId,
      type,
      title,
      message,
      severity,
      recipientEmail: prefs.email,
    });

    return { status: 'enqueued' };
  },

  async processNotificationJob(jobData) {
    const { userId, deviceId, incidentId, type, title, message, severity, recipientEmail } = jobData;

    // 1. Create In-App Notification in DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        deviceId,
        incidentId,
        type,
        title,
        message,
        severity,
      },
    });

    // 2. Send SMTP Email if configured & recipient present
    if (mailTransporter && recipientEmail) {
      try {
        const resolveUrl = `${process.env.APP_URL || 'http://localhost:5173'}/incidents${incidentId ? `?id=${incidentId}` : ''}`;
        
        await mailTransporter.sendMail({
          from: `"NetScope Observability Intelligence" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject: `🚨 [NetScope Alert - ${severity}] ${title}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #E2E8F0; padding: 32px; border-radius: 16px; border: 1px solid #1E293B; max-width: 620px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              
              <!-- Header -->
              <div style="border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
                <h2 style="color: #818CF8; margin: 0; font-size: 20px; font-weight: 800; tracking-tight: -0.02em;">
                  NETSCOPE SRE OBSERVABILITY ALERT
                </h2>
              </div>
              
              <!-- Severity Card -->
              <div style="background-color: #111827; padding: 24px; border-left: 5px solid ${severity === 'CRITICAL' ? '#EF4444' : '#F97316'}; border-radius: 12px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 800; padding: 5px 10px; border-radius: 6px; background-color: ${severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)'}; color: ${severity === 'CRITICAL' ? '#EF4444' : '#F97316'}; text-transform: uppercase; border: 1px solid ${severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(249, 115, 22, 0.4)'}; font-family: monospace;">
                    ${severity} INCIDENT
                  </span>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #FFFFFF; font-size: 18px; font-weight: 700;">${title}</h3>
                <p style="margin: 0; font-size: 14px; color: #94A3B8; line-height: 1.6;">${message}</p>
              </div>

              <!-- Incident Description Details -->
              <div style="background-color: #0B0F19; padding: 18px; border: 1px solid #1E293B; border-radius: 10px; margin-bottom: 24px; font-size: 13px; color: #CBD5E1;">
                <p style="margin: 0 0 8px 0; font-weight: 700; color: #FFFFFF; font-family: monospace;">INCIDENT SUMMARY & METRIC SIGNALS:</p>
                <ul style="margin: 0; padding-left: 20px; color: #94A3B8; line-height: 1.6;">
                  <li>Event Type: <strong style="color: #E2E8F0;">${type}</strong></li>
                  <li>Incident ID: <strong style="color: #818CF8; font-family: monospace;">${incidentId || 'SYS-EVENT'}</strong></li>
                  <li>Impact: <strong style="color: #F87171;">Endpoint degradation or service unresponsiveness</strong></li>
                  <li>Governance: <strong style="color: #34D399;">Read-only incident investigation</strong></li>
                </ul>
              </div>

              <!-- Primary CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resolveUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #FFFFFF; font-weight: 800; font-size: 15px; padding: 16px 36px; border-radius: 12px; text-decoration: none; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); text-transform: uppercase; tracking-wider: 0.05em;">
                  ⚡ VIEW INCIDENT DETAILS &rarr;
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #1E293B; padding-top: 20px; font-size: 12px; color: #64748B; text-align: center; font-family: monospace;">
                Clicking the button above redirects directly to the <strong>Incident Investigation Console</strong> to inspect telemetry evidence and diagnostic guidance.
              </div>

            </div>
          `,
        });
        console.log(`[NotificationService] Email delivered to ${recipientEmail} for notification ${notification.id}`);
      } catch (err) {
        console.error(`[NotificationService] Email delivery failed to ${recipientEmail}:`, err.message);
      }
    }

    return notification;
  },

  async getUserNotifications(userId, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  },

  async markAsRead(userId, notificationId) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async sendTestEmail(userId, targetEmail = null) {
    const prefs = await this.getUserPreferences(userId);
    const emailToUse = targetEmail || prefs.email || process.env.SMTP_USER;

    if (!mailTransporter || process.env.SMTP_HOST !== 'smtp.gmail.com') {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        mailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        throw new Error('SMTP credentials not configured in environment');
      }
    }

    const info = await mailTransporter.sendMail({
      from: `"NetScope Observability Alert" <${process.env.SMTP_USER}>`,
      to: emailToUse,
      subject: `[NetScope TEST ALERT] System Telemetry Verification`,
      html: `
        <div style="font-family: sans-serif; background: #0B0F19; color: #e2e8f0; padding: 24px; border-radius: 12px;">
          <h2 style="color: #6366F1; margin-top: 0;">NetScope Infrastructure Alert Verification</h2>
          <div style="background: #131A2B; padding: 16px; border-left: 4px solid #10B981; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; color: #ffffff;">SMTP Email Delivery Test Successful</h3>
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">This is a test notification confirming that NetScope SMTP email alerts are active and connected via Gmail SMTP server (${process.env.SMTP_HOST}:${process.env.SMTP_PORT}).</p>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            Timestamp: <strong>${new Date().toISOString()}</strong> | Recipient: <strong>${emailToUse}</strong>
          </p>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId, recipient: emailToUse };
  },
};
