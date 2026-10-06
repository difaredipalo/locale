import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Radio,
  Smartphone,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  Filter,
  Shield,
  Layers,
  Settings,
  ExternalLink,
  RotateCw,
  X,
  Search,
} from 'lucide-react';
import type {
  MultiChannelNotification,
  NotificationDelivery,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationChannelConfig,
  UserProfile,
} from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface NotificationCenterPageProps {
  onNotificationUpdated?: () => void;
}

export const NotificationCenterPage: React.FC<NotificationCenterPageProps> = () => {
  const { currentUser, isAdmin, isManager, users } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin_center' | 'channels'>('admin_center');
  const [loading, setLoading] = useState(true);

  // Data states
  const [notifications, setNotifications] = useState<MultiChannelNotification[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [stats, setStats] = useState({
    total_notifications: 0,
    sent_deliveries: 0,
    failed_deliveries: 0,
    pending_deliveries: 0,
  });
  const [channelConfigs, setChannelConfigs] = useState<any>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Notification for Detail Modal
  const [selectedNotif, setSelectedNotif] = useState<MultiChannelNotification | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeCategory, setComposeCategory] = useState<NotificationCategory>('admin');
  const [composePriority, setComposePriority] = useState<NotificationPriority>('normal');
  const [composeTargetType, setComposeTargetType] = useState<'all' | 'role' | 'users'>('all');
  const [composeTargetRole, setComposeTargetRole] = useState<'admin' | 'manager' | 'user'>('user');
  const [composeTargetUserIds, setComposeTargetUserIds] = useState<string[]>([]);
  const [composeChannels, setComposeChannels] = useState<NotificationChannel[]>([
    'in_app',
    'web_push',
    'telegram',
  ]);
  const [composeScheduledAt, setComposeScheduledAt] = useState('');
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  // Channel Config Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editWebPushKey, setEditWebPushKey] = useState('');
  const [editTelegramToken, setEditTelegramToken] = useState('');
  const [editTelegramBot, setEditTelegramBot] = useState('IlCovoLocaleBot');
  const [editWhatsAppPhoneId, setEditWhatsAppPhoneId] = useState('');
  const [editWhatsAppToken, setEditWhatsAppToken] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Test Channel State
  const [testingChannel, setTestingChannel] = useState<NotificationChannel | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [centerData, configs] = await Promise.all([
        api.getNotificationCenterData(),
        api.getNotificationChannelConfig(),
      ]);

      setNotifications(centerData.notifications || []);
      setDeliveries(centerData.deliveries || []);
      setStats(centerData.stats);
      setChannelConfigs(configs);

      // Populate config form
      setEditWebPushKey(configs.web_push?.public_key || '');
      setEditTelegramBot(configs.telegram?.bot_username || 'IlCovoLocaleBot');
      setEditWhatsAppPhoneId(configs.whatsapp?.phone_number_id || '');
    } catch (err) {
      console.error('Error loading notification center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle || !composeMessage) {
      alert('Inserisci titolo e messaggio.');
      return;
    }

    try {
      setSubmittingBroadcast(true);
      await api.broadcastNotification({
        title: composeTitle,
        message: composeMessage,
        category: composeCategory,
        priority: composePriority,
        target_type: composeTargetType,
        target_role: composeTargetType === 'role' ? composeTargetRole : undefined,
        target_user_ids: composeTargetType === 'users' ? composeTargetUserIds : undefined,
        channels: composeChannels,
        scheduled_at: composeScheduledAt ? new Date(composeScheduledAt).toISOString() : undefined,
        actor_id: currentUser?.id,
        actor_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });

      setComposerOpen(false);
      setComposeTitle('');
      setComposeMessage('');
      setComposeScheduledAt('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Errore durante la trasmissione');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      setRetryingId(deliveryId);
      const updated = await api.retryDelivery(deliveryId);
      setDeliveries(deliveries.map(d => (d.id === updated.id ? updated : d)));
      if (selectedNotif) {
        const refreshedDeliveries = (selectedNotif.deliveries || []).map(d =>
          d.id === updated.id ? updated : d
        );
        setSelectedNotif({ ...selectedNotif, deliveries: refreshedDeliveries });
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Errore retry consegna');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      await api.updateNotificationChannelConfig({
        web_push: {
          public_key: editWebPushKey,
        },
        telegram: {
          bot_token: editTelegramToken,
          bot_username: editTelegramBot,
          enabled: Boolean(editTelegramToken),
        },
        whatsapp: {
          phone_number_id: editWhatsAppPhoneId,
          access_token: editWhatsAppToken,
          enabled: Boolean(editWhatsAppToken && editWhatsAppPhoneId),
        },
      });

      setConfigModalOpen(false);
      await loadData();
      alert('Configurazioni canali aggiornate con successo!');
    } catch (err: any) {
      alert(err.message || 'Errore nel salvataggio');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestChannel = async (channel: NotificationChannel) => {
    if (!currentUser) return;
    try {
      setTestingChannel(channel);
      setTestResult(null);
      const res = await api.testNotificationChannel(channel, currentUser.id);
      setTestResult(`✓ Test per canale ${channel.toUpperCase()} completato: ${res.message}`);
      await loadData();
      setTimeout(() => setTestResult(null), 6000);
    } catch (err: any) {
      alert(err.message || `Errore durante il test del canale ${channel}`);
    } finally {
      setTestingChannel(null);
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'in_app':
        return <Bell className="w-3.5 h-3.5 text-amber-400" />;
      case 'web_push':
        return <Radio className="w-3.5 h-3.5 text-sky-400" />;
      case 'telegram':
        return <Send className="w-3.5 h-3.5 text-blue-400" />;
      case 'whatsapp':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'normal':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'low':
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'failed':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'processing':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter(n => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    if (channelFilter !== 'all' && !n.channels.includes(channelFilter as any)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Sistema Notifiche Multi-Canale & Routing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Centro Notifiche de Il Covo
          </h1>
          <p className="text-xs text-slate-400">
            Controllo centralizzato di invio e monitoraggio consegne attraverso App, Web Push, Telegram, WhatsApp ed Email.
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configura Canali</span>
            </button>
            <button
              onClick={() => setComposerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuova Notifica Multi-Canale</span>
            </button>
          </div>
        )}
      </div>

      {testResult && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('admin_center')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'admin_center'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Registro Invii & Consegne</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'channels'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Stato Canali & Credenziali</span>
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
          title="Aggiorna dati"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Aggiorna</span>
        </button>
      </div>

      {/* TAB 1: REGISTRO INVII & CONSEGNE */}
      {activeTab === 'admin_center' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Notifiche Generate</span>
              <span className="text-xl font-bold text-white font-mono mt-0.5 block">{stats.total_notifications}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Consegne Riuscite</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">{stats.sent_deliveries}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Errori Consegna</span>
              <span className="text-xl font-bold text-red-400 font-mono mt-0.5 block">{stats.failed_deliveries}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Schedulate / In Coda</span>
              <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">{stats.pending_deliveries}</span>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cerca per titolo, messaggio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">Tutte le Categorie</option>
                <option value="presence">Presenze</option>
                <option value="venue">Prenotazioni Locale</option>
                <option value="cleaning">Pulizie</option>
                <option value="polls">Sondaggi</option>
                <option value="purchases">Acquisti</option>
                <option value="finances">Finanze</option>
                <option value="calendar">Calendario</option>
                <option value="admin">Avvisi Admin</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">Tutte le Priorità</option>
                <option value="critical">🚨 Critica</option>
                <option value="high">⚠️ Alta</option>
                <option value="normal">Normale</option>
                <option value="low">Bassa</option>
              </select>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">Tutti i Canali</option>
                <option value="in_app">App</option>
                <option value="web_push">Web Push</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          {/* NOTIFICATIONS MASTER TABLE */}
          <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="p-3.5">Notifica & Messaggio</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Priorità</th>
                    <th className="p-3.5">Canali</th>
                    <th className="p-3.5">Destinatari</th>
                    <th className="p-3.5">Data / Ora</th>
                    <th className="p-3.5">Stato</th>
                    <th className="p-3.5 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => {
                      const notifDeliveries = deliveries.filter(d => d.notification_id === notif.id);
                      const hasFailures = notifDeliveries.some(d => d.status === 'failed');

                      return (
                        <tr key={notif.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-white truncate text-sm">{notif.title}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{notif.message}</div>
                            {notif.scheduled_at && new Date(notif.scheduled_at) > new Date() && (
                              <div className="mt-1 text-[10px] text-amber-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Schedulata per: {new Date(notif.scheduled_at).toLocaleString('it-IT')}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="capitalize text-slate-300 font-medium">
                              {notif.category}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(notif.priority)}`}>
                              {notif.priority}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {notif.channels.map(ch => (
                                <span
                                  key={ch}
                                  className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300"
                                  title={ch}
                                >
                                  {getChannelIcon(ch)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-slate-300">
                            {notif.target_type === 'all'
                              ? 'Tutti i soci'
                              : notif.target_type === 'role'
                              ? `Ruolo ${notif.target_role}`
                              : `${notif.recipient_ids?.length || 0} soci`}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                            {new Date(notif.created_at).toLocaleDateString('it-IT')}{' '}
                            {new Date(notif.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(notif.status)}`}>
                                {notif.status}
                              </span>
                              {hasFailures && (
                                <span className="p-1 rounded bg-red-950/80 text-red-400 border border-red-500/40" title="Errori di consegna presenti">
                                  <AlertTriangle className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                const enriched = {
                                  ...notif,
                                  deliveries: deliveries.filter(d => d.notification_id === notif.id),
                                };
                                setSelectedNotif(enriched);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Dettagli ({notifDeliveries.length})</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                        Nessuna notifica trovata con i filtri correnti.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATO CANALI & CREDENZIALI */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. WEB PUSH */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Web Push (Notifiche Browser)</h3>
                    <p className="text-[11px] text-slate-400">Notifiche native desktop e smartphone anche con sito chiuso</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  channelConfigs?.web_push?.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {channelConfigs?.web_push?.enabled ? '🟢 Configurato' : '🔴 Non Configurato'}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chiave Pubblica VAPID:</span>
                  <span className="font-mono text-[10px] text-sky-300 truncate max-w-[200px]" title={channelConfigs?.web_push?.public_key}>
                    {channelConfigs?.web_push?.public_key || 'Non presente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contatto Oggetto:</span>
                  <span className="font-mono text-[11px] text-slate-200">{channelConfigs?.web_push?.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dispositivi soci registrati:</span>
                  <span className="font-mono font-bold text-white">
                    {deliveries.filter(d => d.channel === 'web_push').length} registrazioni
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => handleTestChannel('web_push')}
                  disabled={testingChannel === 'web_push'}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/40 font-semibold"
                >
                  {testingChannel === 'web_push' ? 'Invio test...' : 'Test Notifica Push'}
                </button>
              </div>
            </div>

            {/* 2. TELEGRAM BOT */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Telegram Bot Ufficiale</h3>
                    <p className="text-[11px] text-slate-400">Invio messaggi privati e notifiche di emergenza</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  channelConfigs?.telegram?.has_bot_token ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {channelConfigs?.telegram?.has_bot_token ? '🟢 Configurato' : '🔴 Non Configurato'}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Username Bot Telegram:</span>
                  <span className="font-mono text-blue-300 font-bold">@{channelConfigs?.telegram?.bot_username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bot Token API:</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {channelConfigs?.telegram?.has_bot_token ? '••••••••••••••••••••••••' : 'Non configurato'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Soci con Telegram collegato:</span>
                  <span className="font-mono font-bold text-white">1 socio attivo (Gianluca)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => handleTestChannel('telegram')}
                  disabled={testingChannel === 'telegram'}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 font-semibold"
                >
                  {testingChannel === 'telegram' ? 'Invio test...' : 'Test Notifica Telegram'}
                </button>
              </div>
            </div>

            {/* 3. WHATSAPP BUSINESS PLATFORM CLOUD API */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">WhatsApp Business Platform (Meta)</h3>
                    <p className="text-[11px] text-slate-400">Integrazione ufficiale Meta Cloud API (senza scraping o librerie web)</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  channelConfigs?.whatsapp?.has_access_token ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {channelConfigs?.whatsapp?.has_access_token ? '🟢 Configurato' : '🟡 In attesa credenziali Meta'}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">WhatsApp Phone Number ID:</span>
                  <span className="font-mono text-emerald-300 font-bold">{channelConfigs?.whatsapp?.phone_number_id || 'Mancante'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Meta Access Token:</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {channelConfigs?.whatsapp?.has_access_token ? '••••••••••••••••••••••••' : 'Non configurato'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Template Predefinito:</span>
                  <span className="font-mono text-slate-200">{channelConfigs?.whatsapp?.default_template_name}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => handleTestChannel('whatsapp')}
                  disabled={testingChannel === 'whatsapp'}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 font-semibold"
                >
                  {testingChannel === 'whatsapp' ? 'Invio test...' : 'Test Notifica WhatsApp'}
                </button>
              </div>
            </div>

            {/* 4. EMAIL PROVIDER */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Email Istituzionale</h3>
                    <p className="text-[11px] text-slate-400">Riepiloghi, report finanziari e avvisi urgenti</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  🟢 Attivo (Sandbox)
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Indirizzo Mittente:</span>
                  <span className="font-mono text-purple-300 font-bold">{channelConfigs?.email?.from_address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stato Consegna:</span>
                  <span className="text-slate-200">Sandbox / Dispatch certifcato</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => handleTestChannel('email')}
                  disabled={testingChannel === 'email'}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 font-semibold"
                >
                  {testingChannel === 'email' ? 'Invio test...' : 'Test Notifica Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DETTAGLI CONSEGNE NOTIFICA (INSPECTOR) */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(selectedNotif.priority)}`}>
                    {selectedNotif.priority}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 capitalize">{selectedNotif.category}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedNotif.title}</h3>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed shrink-0">
              {selectedNotif.message}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1">
                Log Singole Consegne per Destinatario & Canale:
              </div>

              {(selectedNotif.deliveries || []).length > 0 ? (
                <div className="space-y-2">
                  {(selectedNotif.deliveries || []).map((deliv) => (
                    <div
                      key={deliv.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                          {getChannelIcon(deliv.channel)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{deliv.recipient_name}</span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">({deliv.channel})</span>
                          </div>
                          {deliv.last_error ? (
                            <div className="text-[11px] text-red-400 mt-0.5 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{deliv.last_error}</span>
                            </div>
                          ) : deliv.sent_at ? (
                            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                              Consegnato il {new Date(deliv.sent_at).toLocaleString('it-IT')}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 mt-0.5">In attesa elaborazione</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(deliv.status)}`}>
                          {deliv.status}
                        </span>
                        {deliv.status === 'failed' && (
                          <button
                            onClick={() => handleRetryDelivery(deliv.id)}
                            disabled={retryingId === deliv.id}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingId === deliv.id ? 'animate-spin' : ''}`} />
                            <span>Riprova</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500">Nessuna consegna registrata per questo messaggio.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPOSITORE NOTIFICA MULTI-CANALE (ADMIN) */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Send className="w-5 h-5 text-amber-400" />
                <span>Trasmetti Notifica Multi-Canale</span>
              </div>
              <button onClick={() => setComposerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Titolo Notifica *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Chiusura anticipata locale"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Messaggio Completo *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Inserisci il testo della notifica..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Categoria *</label>
                  <select
                    value={composeCategory}
                    onChange={(e) => setComposeCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="admin">Avvisi Amministrativi</option>
                    <option value="presence">Presenze</option>
                    <option value="venue">Prenotazioni Locale</option>
                    <option value="cleaning">Pulizie</option>
                    <option value="polls">Sondaggi</option>
                    <option value="purchases">Acquisti & Obiettivi</option>
                    <option value="finances">Finanze (Solo autorizzati)</option>
                    <option value="calendar">Calendario Eventi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Livello Priorità *</label>
                  <select
                    value={composePriority}
                    onChange={(e) => setComposePriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="normal">Normale</option>
                    <option value="low">Bassa</option>
                    <option value="high">Alta</option>
                    <option value="critical">🚨 Critica (Scavalca silenziamenti)</option>
                  </select>
                </div>
              </div>

              {/* CANALI DA UTILIZZARE */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Canali di Trasmissione:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'in_app', label: 'App Interna' },
                    { id: 'web_push', label: 'Web Push (Browser)' },
                    { id: 'telegram', label: 'Telegram Bot' },
                    { id: 'whatsapp', label: 'WhatsApp Meta' },
                    { id: 'email', label: 'Email' },
                  ].map((ch) => {
                    const isChecked = composeChannels.includes(ch.id as any);
                    return (
                      <label
                        key={ch.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setComposeChannels([...composeChannels, ch.id as any]);
                            } else {
                              setComposeChannels(composeChannels.filter(c => c !== ch.id));
                            }
                          }}
                          className="rounded text-amber-500 bg-slate-800 border-slate-700"
                        />
                        <span className="font-semibold text-xs">{ch.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* DESTINATARI */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Destinatari:</label>
                <div className="grid grid-cols-3 gap-2 font-medium">
                  {[
                    { id: 'all', label: 'Tutti i Soci' },
                    { id: 'role', label: 'Per Ruolo' },
                    { id: 'users', label: 'Soci Selezionati' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setComposeTargetType(t.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        composeTargetType === t.id
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {composeTargetType === 'role' && (
                  <div className="mt-2">
                    <select
                      value={composeTargetRole}
                      onChange={(e) => setComposeTargetRole(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                    >
                      <option value="admin">Solo Amministratori</option>
                      <option value="manager">Gestori & Admin</option>
                      <option value="user">Tutti gli Utenti (Membri)</option>
                    </select>
                  </div>
                )}

                {composeTargetType === 'users' && (
                  <div className="mt-2 max-h-32 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-1.5">
                    {users.map((u) => {
                      const isChecked = composeTargetUserIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setComposeTargetUserIds([...composeTargetUserIds, u.id]);
                              } else {
                                setComposeTargetUserIds(composeTargetUserIds.filter(id => id !== u.id));
                              }
                            }}
                            className="rounded text-amber-500 bg-slate-800 border-slate-700"
                          />
                          <span className="text-white truncate">{u.first_name} {u.last_name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SCHEDULAZIONE PROGRAMMATA */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Programma Invio Futuro (Opzionale):</label>
                <input
                  type="datetime-local"
                  value={composeScheduledAt}
                  onChange={(e) => setComposeScheduledAt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Se impostato, il Notification Service automatico trasmetterà il messaggio alla data programmata.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submittingBroadcast}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-md"
                >
                  {submittingBroadcast ? 'Trasmissione in corso...' : 'Invia Notifica Ora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIGURAZIONE CANALI & CREDENZIALI (ADMIN) */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>Impostazioni Credenziali Canali</span>
              </div>
              <button onClick={() => setConfigModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfigs} className="space-y-4">
              {/* TELEGRAM */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-blue-300 flex items-center gap-2 text-xs">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Telegram Bot (@BotFather)</span>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Bot Token (da @BotFather):</label>
                  <input
                    type="password"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRstuvwxyZ..."
                    value={editTelegramToken}
                    onChange={(e) => setEditTelegramToken(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Bot Username:</label>
                  <input
                    type="text"
                    value={editTelegramBot}
                    onChange={(e) => setEditTelegramBot(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* WHATSAPP */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-emerald-300 flex items-center gap-2 text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Meta WhatsApp Business Cloud API</span>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Phone Number ID:</label>
                  <input
                    type="text"
                    placeholder="Es. 109283746501928"
                    value={editWhatsAppPhoneId}
                    onChange={(e) => setEditWhatsAppPhoneId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Permanent Access Token (Meta for Developers):</label>
                  <input
                    type="password"
                    placeholder="EAAGm0PX4ZC... (System User Token)"
                    value={editWhatsAppToken}
                    onChange={(e) => setEditWhatsAppToken(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* WEB PUSH */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-sky-300 flex items-center gap-2 text-xs">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span>Web Push (VAPID)</span>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Chiave Pubblica VAPID:</label>
                  <input
                    type="text"
                    value={editWebPushKey}
                    onChange={(e) => setEditWebPushKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-[10px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-md"
                >
                  {savingConfig ? 'Salvataggio...' : 'Salva Impostazioni'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
