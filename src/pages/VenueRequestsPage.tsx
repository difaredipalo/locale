import React, { useState } from 'react';
import {
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Check,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import type { VenueRequest, RequestStatus } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface VenueRequestsPageProps {
  requests: VenueRequest[];
  onRequestSubmitted: (newReq: VenueRequest) => void;
  onRequestReviewed: (updatedReq: VenueRequest) => void;
}

export const VenueRequestsPage: React.FC<VenueRequestsPageProps> = ({
  requests,
  onRequestSubmitted,
  onRequestReviewed,
}) => {
  const { currentUser, isManager } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VenueRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  // Form states
  const [date, setDate] = useState('2026-10-18');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [reason, setReason] = useState('');
  const [attendeesCount, setAttendeesCount] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<{ available: boolean; text: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Filter
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRequests = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const checkSlotAvailability = async () => {
    if (!date || !startTime || !endTime) return;
    setCheckingAvailability(true);
    setAvailabilityMessage(null);
    try {
      const res = await api.checkAvailability(date, startTime, endTime);
      if (res.available) {
        setAvailabilityMessage({
          available: true,
          text: 'Fascia oraria libera! Nessun conflitto con eventi o prenotazioni esistenti.',
        });
      } else {
        setAvailabilityMessage({
          available: false,
          text: res.conflictReason || 'Attenzione: conflitto di orario rilevato per questa fascia.',
        });
      }
    } catch (err: any) {
      setAvailabilityMessage({
        available: false,
        text: err.message || 'Impossibile verificare disponibilità.',
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!reason || !date || !startTime || !endTime) {
      setFormError('Compila tutti i campi obbligatori.');
      return;
    }

    try {
      setSubmitting(true);
      const newReq = await api.createVenueRequest({
        user_id: currentUser?.id,
        user_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
        user_email: currentUser?.email,
        date,
        start_time: startTime,
        end_time: endTime,
        reason,
        attendees_count: attendeesCount,
        notes,
      });

      onRequestSubmitted(newReq);
      setModalOpen(false);
      setReason('');
      setNotes('');
      setAvailabilityMessage(null);
    } catch (err: any) {
      setFormError(err.message || 'Errore durante linvio della richiesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return;
    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('Inserisci una motivazione per il rifiuto della richiesta.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.reviewVenueRequest(
        selectedRequest.id,
        reviewAction,
        rejectionReason,
        currentUser?.id,
        `${currentUser?.first_name} ${currentUser?.last_name}`
      );
      onRequestReviewed(res.request);
      setReviewModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Errore nella revisione della richiesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            In attesa
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Approvata
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            Rifiutata
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            Annullata
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Richiesta Utilizzo Locale
          </h1>
          <p className="text-xs text-slate-400">
            Prenota il locale per serate private, studio o progetti. Verifica sovrapposizioni in tempo reale.
          </p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
            setAvailabilityMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Richiedi Utilizzo Locale</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'pending', 'approved', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors capitalize ${
              filterStatus === st
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st === 'all' ? 'Tutte le richieste' : st === 'pending' ? 'In Attesa' : st === 'approved' ? 'Approvate' : 'Rifiutate'}
          </button>
        ))}
      </div>

      {/* REQUESTS LIST */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            Nessuna richiesta di utilizzo trovata con lo stato selezionato.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-sm">{req.reason}</span>
                  {getStatusBadge(req.status)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">{req.user_name}</span>
                  <span>·</span>
                  <span className="font-mono text-amber-300 font-semibold">{req.date}</span>
                  <span>·</span>
                  <span className="font-mono">{req.start_time} - {req.end_time}</span>
                  <span>·</span>
                  <span>~{req.attendees_count} persone</span>
                </div>

                {req.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    Note: {req.notes}
                  </p>
                )}

                {req.status === 'rejected' && req.rejection_reason && (
                  <div className="text-xs text-red-300 bg-red-950/30 p-2.5 rounded-lg border border-red-500/30">
                    <strong>Motivo rifiuto:</strong> {req.rejection_reason}
                  </div>
                )}

                {req.reviewed_by_name && req.status !== 'pending' && (
                  <div className="text-[11px] text-slate-500">
                    Esaminata da {req.reviewed_by_name} il {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString('it-IT') : ''}
                  </div>
                )}
              </div>

              {/* Action Buttons for Managers / Admins */}
              {isManager && req.status === 'pending' && (
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setReviewAction('approve');
                      setReviewModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approva</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setReviewAction('reject');
                      setRejectionReason('');
                      setReviewModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 font-semibold text-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rifiuta</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CREATE REQUEST MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Nuova Richiesta di Utilizzo Locale</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Motivo / Tipo di Utilizzo *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Festa di laurea, prove musicali, studio di gruppo..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setAvailabilityMessage(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ora Inizio *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setAvailabilityMessage(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ora Fine *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setAvailabilityMessage(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* LIVE AVAILABILITY CHECK BUTTON */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Verifica disponibilità oraria immediata:</span>
                <button
                  type="button"
                  onClick={checkSlotAvailability}
                  disabled={checkingAvailability}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold border border-slate-700 transition-colors"
                >
                  {checkingAvailability ? 'Verifica in corso...' : 'Verifica Sovrapposizioni'}
                </button>
              </div>

              {availabilityMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    availabilityMessage.available
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  {availabilityMessage.available ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  )}
                  <span>{availabilityMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Numero indicativo di persone</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Note o richieste particolari</label>
                <textarea
                  rows={2}
                  placeholder="Es. Utilizzeremo il proiettore, puliremo subito dopo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={Boolean(submitting || (availabilityMessage && !availabilityMessage.available))}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold"
                >
                  {submitting ? 'Invio in corso...' : 'Invia Richiesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW (APPROVE / REJECT) MODAL */}
      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">
              {reviewAction === 'approve' ? 'Approva Richiesta Locale' : 'Rifiuta Richiesta Locale'}
            </h3>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-white">{selectedRequest.reason}</div>
              <div className="text-slate-400">
                Richiedente: <strong>{selectedRequest.user_name}</strong>
              </div>
              <div className="text-amber-400 font-mono">
                {selectedRequest.date} ({selectedRequest.start_time} - {selectedRequest.end_time})
              </div>
            </div>

            {reviewAction === 'approve' ? (
              <p className="text-slate-300">
                Approvando questa richiesta, il locale verrà riservato, l'evento comparirà automaticamente nel calendario e il socio riceverà una notifica di conferma.
              </p>
            ) : (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Motivazione del rifiuto (obbligatoria) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Es. Locale già occupato per manutenzione programmata..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg font-bold text-white ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {submitting ? 'Attendere...' : reviewAction === 'approve' ? 'Conferma Approvazione' : 'Conferma Rifiuto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
