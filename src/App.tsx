/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout, ActiveTab } from './components/layout/AppLayout';
import { AuthModal } from './components/auth/AuthModal';

import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { VenueRequestsPage } from './pages/VenueRequestsPage';
import { CleaningPage } from './pages/CleaningPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PollsPage } from './pages/PollsPage';
import { RegulationsPage } from './pages/RegulationsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { GoalsPage } from './pages/GoalsPage';
import { FinancesPage } from './pages/FinancesPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ProfilePage } from './pages/ProfilePage';
import { SupabaseGuidePage } from './pages/SupabaseGuidePage';

import type {
  CalendarEvent,
  CleaningShift,
  NotificationItem,
  FinancialGoal,
  FinancialSummary,
  Poll,
  VenueRequest,
  RegulationSection,
  RegulationVersion,
  PurchaseItem,
  FinancialTransaction,
  AuditLog,
} from './types/database';
import { api } from './lib/api';

function MainApp() {
  const { currentUser, loading: authLoading, users, refreshUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Application data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cleaningShifts, setCleaningShifts] = useState<CleaningShift[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [venueRequests, setVenueRequests] = useState<VenueRequest[]>([]);
  const [regulationSections, setRegulationSections] = useState<RegulationSection[]>([]);
  const [regulationVersions, setRegulationVersions] = useState<RegulationVersion[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [
        evts,
        shifts,
        notifs,
        gls,
        finSummary,
        finTxs,
        plls,
        vRequests,
        regs,
        prchs,
        logs,
      ] = await Promise.all([
        api.getEvents(),
        api.getCleaningShifts(),
        api.getNotifications(),
        api.getGoals(),
        api.getFinancialSummary(),
        api.getFinancialTransactions(),
        api.getPolls(),
        api.getVenueRequests(),
        api.getRegulations(),
        api.getPurchases(),
        api.getAuditLogs(),
      ]);

      setEvents(evts);
      setCleaningShifts(shifts);
      setNotifications(notifs);
      setGoals(gls);
      setFinancialSummary(finSummary);
      setFinancialTransactions(finTxs);
      setPolls(plls);
      setVenueRequests(vRequests);
      setRegulationSections(regs.sections);
      setRegulationVersions(regs.versions);
      setPurchases(prchs);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading initial app data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Compute unread count for current user
  const unreadCount = notifications.filter(
    n => !n.is_archived && (!currentUser || !n.read_by.includes(currentUser.id))
  ).length;

  if (authLoading || loadingData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <div className="text-sm font-semibold tracking-wide text-slate-300">
          Caricamento Il Covo...
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Auth modal
  if (!currentUser) {
    return <AuthModal />;
  }

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      unreadCount={unreadCount}
    >
      {/* 1. DASHBOARD */}
      {activeTab === 'dashboard' && (
        <DashboardPage
          events={events}
          cleaningShifts={cleaningShifts}
          notifications={notifications}
          goals={goals}
          financialSummary={financialSummary}
          polls={polls}
          venueRequests={venueRequests}
          onNavigate={setActiveTab}
          onVotePoll={async (pollId, optionId) => {
            try {
              const updated = await api.votePoll(
                pollId,
                optionId,
                currentUser.id,
                `${currentUser.first_name} ${currentUser.last_name}`
              );
              setPolls(polls.map(p => (p.id === updated.id ? updated : p)));
            } catch (err: any) {
              alert(err.message || 'Errore votazione');
            }
          }}
        />
      )}

      {/* 2. CALENDARIO */}
      {activeTab === 'calendar' && (
        <CalendarPage
          events={events}
          onCreateEvent={async (evtData) => {
            const created = await api.createEvent(evtData);
            setEvents([...events, created]);
          }}
          onDeleteEvent={async (id) => {
            await api.deleteEvent(id);
            setEvents(events.filter(e => e.id !== id));
          }}
        />
      )}

      {/* 3. RICHIESTA LOCALE */}
      {activeTab === 'venue-requests' && (
        <VenueRequestsPage
          requests={venueRequests}
          onRequestSubmitted={(newReq) => {
            setVenueRequests([newReq, ...venueRequests]);
            // refresh notifications & logs
            loadAllData();
          }}
          onRequestReviewed={(updatedReq) => {
            setVenueRequests(venueRequests.map(r => (r.id === updatedReq.id ? updatedReq : r)));
            // re-fetch events & notifications
            loadAllData();
          }}
        />
      )}

      {/* 4. TURNI DI PULIZIA */}
      {activeTab === 'cleaning' && (
        <CleaningPage
          shifts={cleaningShifts}
          onShiftCreated={(newShift) => {
            setCleaningShifts([...cleaningShifts, newShift]);
            loadAllData();
          }}
          onChecklistToggled={(shiftId, updatedShift) => {
            setCleaningShifts(cleaningShifts.map(s => (s.id === shiftId ? updatedShift : s)));
          }}
        />
      )}

      {/* 5. NOTIFICHE */}
      {activeTab === 'notifications' && (
        <NotificationsPage
          notifications={notifications}
          onNotificationCreated={(notif) => setNotifications([notif, ...notifications])}
          onNotificationUpdated={(notif) =>
            setNotifications(notifications.map(n => (n.id === notif.id ? notif : n)))
          }
          onNotificationDeleted={(id) =>
            setNotifications(notifications.filter(n => n.id !== id))
          }
        />
      )}

      {/* 6. SONDAGGI */}
      {activeTab === 'polls' && (
        <PollsPage
          polls={polls}
          onPollCreated={(newPoll) => setPolls([newPoll, ...polls])}
          onPollUpdated={(updatedPoll) =>
            setPolls(polls.map(p => (p.id === updatedPoll.id ? updatedPoll : p)))
          }
        />
      )}

      {/* 7. REGOLAMENTO */}
      {activeTab === 'regulations' && (
        <RegulationsPage
          sections={regulationSections}
          versions={regulationVersions}
          onSectionUpdated={(sec, ver) => {
            setRegulationSections(regulationSections.map(s => (s.id === sec.id ? sec : s)));
            setRegulationVersions([ver, ...regulationVersions]);
          }}
        />
      )}

      {/* 8. ACQUISTI */}
      {activeTab === 'purchases' && (
        <PurchasesPage
          purchases={purchases}
          onPurchaseCreated={(item) => setPurchases([item, ...purchases])}
          onPurchaseUpdated={(item) =>
            setPurchases(purchases.map(p => (p.id === item.id ? item : p)))
          }
          onPurchaseDeleted={(id) => setPurchases(purchases.filter(p => p.id !== id))}
        />
      )}

      {/* 9. OBIETTIVI */}
      {activeTab === 'goals' && (
        <GoalsPage
          goals={goals}
          onGoalCreated={(goal) => setGoals([goal, ...goals])}
          onGoalUpdated={(goal) => {
            setGoals(goals.map(g => (g.id === goal.id ? goal : g)));
            loadAllData();
          }}
        />
      )}

      {/* 10. FINANZE */}
      {activeTab === 'finances' && (
        <FinancesPage
          summary={financialSummary}
          transactions={financialTransactions}
          onTransactionCreated={(tx, newSummary) => {
            setFinancialTransactions([tx, ...financialTransactions]);
            setFinancialSummary(newSummary);
          }}
        />
      )}

      {/* 11. GESTIONE UTENTI */}
      {activeTab === 'users' && (
        <UsersManagementPage
          users={users}
          onUserUpdated={async () => {
            await refreshUsers();
            await loadAllData();
          }}
        />
      )}

      {/* 12. LOG ATTIVITÀ */}
      {activeTab === 'audit-logs' && <AuditLogPage logs={auditLogs} />}

      {/* 13. PROFILO PERSONALE */}
      {activeTab === 'profile' && (
        <ProfilePage onDatabaseReset={loadAllData} />
      )}

      {/* 14. GUIDA SUPABASE */}
      {activeTab === 'supabase-guide' && <SupabaseGuidePage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
