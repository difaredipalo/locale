import webpush from 'web-push';
import { db } from './db';
import type {
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationDelivery,
  MultiChannelNotification,
  NotificationChannelConfig,
  UserProfile,
  UserRole,
} from '../src/types/database';

export interface NotificationEvent {
  type: string; // e.g. 'USER_PRESENCE_STARTED', 'VENUE_REQUEST_APPROVED', 'CLEANING_SHIFT_ASSIGNED', etc.
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actor_id?: string;
  actor_name?: string;
  target_type: 'all' | 'role' | 'users';
  target_role?: UserRole;
  target_user_ids?: string[];
  scheduled_at?: string;
  metadata?: Record<string, any>;
  channels_override?: NotificationChannel[];
}

export interface SendResult {
  success: boolean;
  error?: string;
  external_id?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  isConfigured(config: NotificationChannelConfig): boolean;
  send(
    delivery: NotificationDelivery,
    notification: MultiChannelNotification,
    recipient: UserProfile,
    config: NotificationChannelConfig
  ): Promise<SendResult>;
}

// ==========================================
// 1. IN-APP NOTIFICATION PROVIDER
// ==========================================
export class InAppNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = 'in_app';

  isConfigured(): boolean {
    return true; // Always available
  }

  async send(
    delivery: NotificationDelivery,
    notification: MultiChannelNotification,
    recipient: UserProfile
  ): Promise<SendResult> {
    try {
      const state = db.getState();
      state.notifications.unshift({
        id: `notif_inapp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: notification.title,
        content: notification.message,
        priority: (notification.priority === 'critical' ? 'urgente' : notification.priority === 'high' ? 'alta' : 'normale'),
        category: (notification.category === 'finances' ? 'Economico' :
          notification.category === 'cleaning' ? 'Pulizie' :
          notification.category === 'venue' ? 'Eventi' :
          notification.category === 'polls' ? 'Informazione' :
          notification.category === 'purchases' ? 'Acquisti' : 'Informazione'),
        is_pinned: notification.priority === 'critical',
        is_archived: false,
        read_by: [],
        created_by_id: notification.created_by_id || 'system',
        created_by_name: notification.created_by_name || 'Sistema Il Covo',
        created_at: new Date().toISOString(),
      });
      db.save();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Errore salvataggio notifica interna' };
    }
  }
}

// ==========================================
// 2. WEB PUSH NOTIFICATION PROVIDER
// ==========================================
export class WebPushProvider implements NotificationProvider {
  channel: NotificationChannel = 'web_push';

  isConfigured(config: NotificationChannelConfig): boolean {
    return Boolean(
      config.web_push?.enabled &&
      config.web_push?.public_key &&
      config.web_push?.private_key
    );
  }

  async send(
    delivery: NotificationDelivery,
    notification: MultiChannelNotification,
    recipient: UserProfile,
    config: NotificationChannelConfig
  ): Promise<SendResult> {
    if (!this.isConfigured(config)) {
      return {
        success: false,
        error: 'Web Push non configurato: VAPID keys mancanti nelle impostazioni server.',
      };
    }

    try {
      webpush.setVapidDetails(
        config.web_push.subject || 'mailto:admin@covo.local',
        config.web_push.public_key,
        config.web_push.private_key
      );

      const state = db.getState();
      const subscriptions = (state.push_subscriptions || []).filter(
        s => s.user_id === recipient.id
      );

      if (subscriptions.length === 0) {
        return {
          success: false,
          error: 'Nessun browser o dispositivo registrato per questo socio.',
        };
      }

      const payload = JSON.stringify({
        title: `[Il Covo] ${notification.title}`,
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notif_${notification.id}`,
        data: {
          notificationId: notification.id,
          category: notification.category,
          url: '/',
        },
      });

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );
        } catch (err: any) {
          // If subscription has expired or is unsubscribed (404/410), clean it up
          if (err.statusCode === 404 || err.statusCode === 410) {
            state.push_subscriptions = state.push_subscriptions.filter(s => s.id !== sub.id);
            db.save();
          }
          throw err;
        }
      });

      await Promise.all(sendPromises);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Errore durante la consegna Web Push' };
    }
  }
}

// ==========================================
// 3. TELEGRAM BOT NOTIFICATION PROVIDER
// ==========================================
export class TelegramProvider implements NotificationProvider {
  channel: NotificationChannel = 'telegram';

  isConfigured(config: NotificationChannelConfig): boolean {
    return Boolean(config.telegram?.enabled && config.telegram?.bot_token);
  }

  async send(
    delivery: NotificationDelivery,
    notification: MultiChannelNotification,
    recipient: UserProfile,
    config: NotificationChannelConfig
  ): Promise<SendResult> {
    if (!this.isConfigured(config)) {
      return {
        success: false,
        error: 'Telegram Bot non configurato: Bot Token mancante nelle impostazioni server.',
      };
    }

    const state = db.getState();
    const conn = (state.telegram_connections || []).find(
      c => c.user_id === recipient.id && c.is_connected
    );

    if (!conn || !conn.telegram_user_id) {
      return {
        success: false,
        error: 'Account Telegram non collegato dal socio (ID Telegram mancante).',
      };
    }

    try {
      const priorityEmoji =
        notification.priority === 'critical' ? '🚨 CRITICO:' :
        notification.priority === 'high' ? '⚠️ IMPORTANTE:' : '📢';

      const text = `${priorityEmoji} *${notification.title}*\n\n${notification.message}\n\n_Gestionale Il Covo_`;

      const res = await fetch(`https://api.telegram.org/bot${config.telegram.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: conn.telegram_user_id,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          success: false,
          error: data.description || `Errore Telegram API (Status ${res.status})`,
        };
      }

      return {
        success: true,
        external_id: String(data.result?.message_id || ''),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Timeout o errore di rete con Telegram API' };
    }
  }
}

// ==========================================
// 4. WHATSAPP BUSINESS PLATFORM CLOUD API PROVIDER
// ==========================================
export class WhatsAppProvider implements NotificationProvider {
  channel: NotificationChannel = 'whatsapp';

  isConfigured(config: NotificationChannelConfig): boolean {
    return Boolean(
      config.whatsapp?.enabled &&
      config.whatsapp?.phone_number_id &&
      config.whatsapp?.access_token
    );
  }

  async send(
    delivery: NotificationDelivery,
    notification: MultiChannelNotification,
    recipient: UserProfile,
    config: NotificationChannelConfig
  ): Promise<SendResult> {
    if (!this.isConfigured(config)) {
      return {
        success: false,
        error: 'WhatsApp Business Platform non configurato: Phone ID o Access Token mancanti.',
      };
    }

    const state = db.getState();
    const conn = (state.whatsapp_connections || []).find(
      c => c.user_id === recipient.id && c.is_opted_in
    );

    const recipientPhone = conn?.phone_number || recipient.phone;
    if (!recipientPhone) {
      return {
        success: false,
        error: 'Numero di telefono WhatsApp non registrato o non autorizzato dal socio.',
      };
    }

    // Clean phone number to E.164 without spaces or dashes
    const cleanPhone = recipientPhone.replace(/[\s\-\(\)]/g, '').replace('+', '');

    try {
      // Official Meta WhatsApp Business Cloud API endpoint
      const url = `https://graph.facebook.com/v19.0/${config.whatsapp.phone_number_id}/messages`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: `*[Il Covo] ${notification.title}*\n\n${notification.message}`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || `Errore Meta WhatsApp Cloud API (${res.status})`,
        };
      }

      return {
        success: true,
        external_id: data.messages?.[0]?.id || '',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Timeout o errore di rete con Meta Cloud API' };
    }
  }
}

// ==========================================
// 5. EMAIL NOTIFICATION PROVIDER
// ==========================================
export class EmailProvider implements NotificationProvider {
  channel: NotificationChannel = 'email';

  isConfigured(config: NotificationChannelConfig): boolean {
    return Boolean(config.email?.enabled);
  }

  async send(
    delivery: NotificationDelivery,
    notification: MultiChannelNotification,
    recipient: UserProfile,
    config: NotificationChannelConfig
  ): Promise<SendResult> {
    if (!recipient.email) {
      return { success: false, error: 'Indirizzo email del socio non presente.' };
    }

    // Email delivery log / dispatch simulation (in sandbox mode)
    return {
      success: true,
      external_id: `email_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }
}

// ==========================================
// NOTIFICATION SERVICE ROUTING & DISPATCH ENGINE
// ==========================================
export class NotificationService {
  private providers: Map<NotificationChannel, NotificationProvider> = new Map();
  private schedulerTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.registerProvider(new InAppNotificationProvider());
    this.registerProvider(new WebPushProvider());
    this.registerProvider(new TelegramProvider());
    this.registerProvider(new WhatsAppProvider());
    this.registerProvider(new EmailProvider());
    this.startScheduler();
  }

  registerProvider(provider: NotificationProvider) {
    this.providers.set(provider.channel, provider);
  }

  getProvider(channel: NotificationChannel): NotificationProvider | undefined {
    return this.providers.get(channel);
  }

  /**
   * Main entry point for CMS events.
   * Resolves recipients, checks permissions & preferences, creates notification and deliveries.
   */
  async emitEvent(event: NotificationEvent): Promise<MultiChannelNotification> {
    const state = db.getState();
    const config = state.notification_channel_configs;

    // 1. Determine target recipients
    let recipients: UserProfile[] = [];
    if (event.target_type === 'all') {
      recipients = state.users.filter(u => u.is_active);
    } else if (event.target_type === 'role') {
      recipients = state.users.filter(u => u.is_active && u.role === event.target_role);
    } else if (event.target_type === 'users' && event.target_user_ids) {
      recipients = state.users.filter(u => u.is_active && event.target_user_ids?.includes(u.id));
    }

    // 2. Privacy & Permission Filtering:
    // If category is 'finances', only users with role 'admin' or 'manager' can receive financial details
    if (event.category === 'finances') {
      recipients = recipients.filter(u => u.role === 'admin' || u.role === 'manager');
    }

    // 3. Create Master MultiChannelNotification record
    const notificationId = `notif_mc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notification: MultiChannelNotification = {
      id: notificationId,
      title: event.title,
      message: event.message,
      category: event.category,
      priority: event.priority,
      target_type: event.target_type,
      target_role: event.target_role,
      recipient_ids: recipients.map(u => u.id),
      channels: event.channels_override || ['in_app', 'web_push', 'telegram', 'whatsapp', 'email'],
      status: event.scheduled_at ? 'pending' : 'processing',
      created_by_id: event.actor_id || 'system',
      created_by_name: event.actor_name || 'Sistema Il Covo',
      created_at: new Date().toISOString(),
      scheduled_at: event.scheduled_at,
      metadata: event.metadata,
      deliveries: [],
    };

    if (!state.notifications_multichannel) state.notifications_multichannel = [];
    state.notifications_multichannel.unshift(notification);
    db.save();

    // If scheduled for future, leave as pending for the scheduler worker
    if (event.scheduled_at && new Date(event.scheduled_at) > new Date()) {
      return notification;
    }

    // 4. Create individual delivery records per recipient and channel
    const deliveries: NotificationDelivery[] = [];
    for (const recipient of recipients) {
      const userPref = (state.notification_preferences || []).find(p => p.user_id === recipient.id);

      // Category filter: check if user muted this category (unless critical priority)
      if (userPref && !userPref.categories[event.category] && event.priority !== 'critical') {
        continue; // user explicitly disabled this category
      }

      // Check allowed channels
      const allowedChannels = notification.channels.filter(ch => {
        if (!userPref) return true; // default: all channels enabled
        if (event.priority === 'critical' && userPref.critical_always_all) return true;
        return userPref.channels[ch] ?? true;
      });

      for (const channel of allowedChannels) {
        const delivery: NotificationDelivery = {
          id: `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          notification_id: notificationId,
          recipient_id: recipient.id,
          recipient_name: `${recipient.first_name} ${recipient.last_name}`,
          channel,
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
          created_at: new Date().toISOString(),
        };

        deliveries.push(delivery);
        if (!state.notification_deliveries) state.notification_deliveries = [];
        state.notification_deliveries.push(delivery);
      }
    }

    notification.deliveries = deliveries;
    db.save();

    // 5. Asynchronously process deliveries
    this.processDeliveries(deliveries, notification);

    return notification;
  }

  /**
   * Dispatches deliveries to their respective providers.
   */
  async processDeliveries(deliveries: NotificationDelivery[], notification: MultiChannelNotification) {
    const state = db.getState();
    const config = state.notification_channel_configs;

    for (const delivery of deliveries) {
      const recipient = state.users.find(u => u.id === delivery.recipient_id);
      if (!recipient) continue;

      const provider = this.getProvider(delivery.channel);
      if (!provider) {
        delivery.status = 'failed';
        delivery.last_error = `Nessun provider registrato per il canale ${delivery.channel}`;
        continue;
      }

      delivery.attempts += 1;
      try {
        const res = await provider.send(delivery, notification, recipient, config);
        if (res.success) {
          delivery.status = 'sent';
          delivery.sent_at = new Date().toISOString();
          delivery.last_error = undefined;
        } else {
          delivery.status = 'failed';
          delivery.last_error = res.error;
        }
      } catch (err: any) {
        delivery.status = 'failed';
        delivery.last_error = err.message || 'Errore imprevisto durante l invio';
      }
    }

    // Update parent notification status
    const allSent = deliveries.every(d => d.status === 'sent');
    const allFailed = deliveries.every(d => d.status === 'failed');
    notification.status = allSent ? 'sent' : allFailed ? 'failed' : 'sent';
    notification.sent_at = new Date().toISOString();

    db.save();
  }

  /**
   * Retry single delivery or all failed deliveries of a notification
   */
  async retryDelivery(deliveryId: string): Promise<NotificationDelivery | null> {
    const state = db.getState();
    const delivery = (state.notification_deliveries || []).find(d => d.id === deliveryId);
    if (!delivery) return null;

    const notification = (state.notifications_multichannel || []).find(n => n.id === delivery.notification_id);
    if (!notification) return null;

    const recipient = state.users.find(u => u.id === delivery.recipient_id);
    if (!recipient) return null;

    const provider = this.getProvider(delivery.channel);
    if (!provider) return null;

    delivery.attempts += 1;
    try {
      const res = await provider.send(delivery, notification, recipient, state.notification_channel_configs);
      if (res.success) {
        delivery.status = 'sent';
        delivery.sent_at = new Date().toISOString();
        delivery.last_error = undefined;
      } else {
        delivery.status = 'failed';
        delivery.last_error = res.error;
      }
    } catch (err: any) {
      delivery.status = 'failed';
      delivery.last_error = err.message;
    }

    db.save();
    return delivery;
  }

  /**
   * Background Scheduler: runs every 30 seconds to check scheduled notifications and shift reminders.
   */
  startScheduler() {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);

    this.schedulerTimer = setInterval(async () => {
      try {
        const state = db.getState();
        const now = new Date();

        // 1. Check pending scheduled notifications
        const pendingScheduled = (state.notifications_multichannel || []).filter(
          n => n.status === 'pending' && n.scheduled_at && new Date(n.scheduled_at) <= now
        );

        for (const notif of pendingScheduled) {
          notif.status = 'processing';
          db.save();
          const deliveries = (state.notification_deliveries || []).filter(d => d.notification_id === notif.id);
          await this.processDeliveries(deliveries, notif);
        }

        // 2. Check automated cleaning reminders: 24h before upcoming shift
        const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const tomorrowShifts = (state.cleaning_shifts || []).filter(
          s => s.status === 'upcoming' && s.date === tomorrowStr
        );

        for (const shift of tomorrowShifts) {
          // Avoid duplicate reminder by checking metadata
          const reminderKey = `cleaning_reminder_${shift.id}_${tomorrowStr}`;
          const alreadySent = (state.notifications_multichannel || []).some(
            n => n.metadata?.reminder_key === reminderKey
          );

          if (!alreadySent) {
            await this.emitEvent({
              type: 'CLEANING_SHIFT_REMINDER',
              category: 'cleaning',
              priority: 'high',
              title: '⏰ Promemoria: Domani hai il turno di pulizia',
              message: `Ciao ${shift.assigned_user_name}, ti ricordiamo che domani (${shift.date} alle ore ${shift.time}) sei assegnato al turno di pulizia del locale.`,
              target_type: 'users',
              target_user_ids: [shift.assigned_user_id],
              metadata: { reminder_key: reminderKey, shift_id: shift.id },
            });
          }
        }
      } catch (err) {
        console.error('[Notification Scheduler Worker Error]:', err);
      }
    }, 30000);
  }
}

export const notificationService = new NotificationService();
