import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  Tag,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import type { CalendarEvent, EventCategory } from '../types/database';
import { useAuth } from '../context/AuthContext';

interface CalendarPageProps {
  events: CalendarEvent[];
  onCreateEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  onCreateEvent,
  onDeleteEvent,
}) => {
  const { currentUser, isManager } = useAuth();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 9, 5)); // October 2026 default
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form state for creating new event
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-10-15');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [category, setCategory] = useState<EventCategory>('🎉 Evento');
  const [participantsStr, setParticipantsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: EventCategory[] = [
    '🎉 Evento',
    '🏠 Utilizzo del locale',
    '🧹 Pulizia',
    '🔧 Manutenzione',
    '💰 Pagamento/scadenza',
    '📌 Altro',
  ];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const monthName = selectedDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  // Month grid calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title || !date || !startTime || !endTime) {
      setFormError('Compila tutti i campi obbligatori.');
      return;
    }

    try {
      setSubmitting(true);
      await onCreateEvent({
        title,
        description,
        date,
        start_time: startTime,
        end_time: endTime,
        category,
        created_by_id: currentUser?.id,
        created_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
        participants: participantsStr ? participantsStr.split(',').map(s => s.trim()) : [currentUser?.first_name || 'Socio'],
        notes,
        status: 'confirmed',
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setParticipantsStr('');
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Errore nella creazione dell evento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Calendario del Covo</h1>
          <p className="text-xs text-slate-400">
            Pianificazione eventi, serate condivise, turni di pulizia e prenotazioni confermate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode segmented buttons */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'month' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mese
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Elenco
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Evento</span>
          </button>
        </div>
      </div>

      {/* CATEGORY FILTER BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tutti ({events.length})
        </button>
        {categories.map((cat) => {
          const count = events.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Month Navigation */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white capitalize">{monthName}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 text-center text-xs font-semibold text-slate-400 py-2.5 bg-slate-950/40">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Gio</div>
            <div>Ven</div>
            <div>Sab</div>
            <div>Dom</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60 bg-slate-900/40">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[90px] p-2 bg-slate-950/20 text-slate-600 text-xs" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter(e => e.date === dateStr);
              const isToday = dayNum === 5 && currentMonth === 9 && currentYear === 2026;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setDate(dateStr);
                    setModalOpen(true);
                  }}
                  className={`min-h-[100px] p-2 transition-colors cursor-pointer hover:bg-slate-800/40 flex flex-col justify-between ${
                    isToday ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {dayEvents.length} ev.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        className="truncate text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-amber-400/50"
                        title={`${evt.title} (${evt.start_time} - ${evt.end_time})`}
                      >
                        <span className="font-semibold text-amber-300 font-mono text-[10px] mr-1">
                          {evt.start_time}
                        </span>
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
              Nessun evento in programma con i filtri selezionati.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{evt.title}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-xs text-amber-400 font-medium">{evt.category}</span>
                  </div>
                  {evt.description && (
                    <p className="text-xs text-slate-400">{evt.description}</p>
                  )}
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Partecipanti: {evt.participants.join(', ') || 'Tutti'}</span>
                    <span>·</span>
                    <span>Creato da: {evt.created_by_name}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-amber-300 font-mono">{evt.date}</div>
                  <div className="text-xs text-slate-400 font-mono">{evt.start_time} - {evt.end_time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] text-amber-400 font-semibold">{selectedEvent.category}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-mono">
                  {selectedEvent.date} · {selectedEvent.start_time} - {selectedEvent.end_time}
                </span>
              </div>

              {selectedEvent.description && (
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
                  {selectedEvent.description}
                </div>
              )}

              <div className="space-y-1">
                <div className="text-slate-400">Partecipanti:</div>
                <div className="font-medium text-slate-200">
                  {selectedEvent.participants.join(', ') || 'Nessun partecipante specificato'}
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="text-slate-400">
                  Note: <span className="text-slate-300">{selectedEvent.notes}</span>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-500">
                Registrato da: {selectedEvent.created_by_name}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {(isManager || selectedEvent.created_by_id === currentUser?.id) ? (
                <button
                  onClick={async () => {
                    if (window.confirm('Eliminare questo evento dal calendario?')) {
                      await onDeleteEvent(selectedEvent.id);
                      setSelectedEvent(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina evento</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Nuovo Evento in Calendario</h3>
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
                <label className="block text-slate-300 font-medium mb-1">Titolo Evento *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Cena sociale o Torneo calcetto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ora Inizio *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ora Fine *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrizione</label>
                <textarea
                  rows={2}
                  placeholder="Dettagli aggiuntivi per i soci..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Partecipanti (separati da virgola)</label>
                <input
                  type="text"
                  placeholder="Gianluca, Marco, Sofia..."
                  value={participantsStr}
                  onChange={(e) => setParticipantsStr(e.target.value)}
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
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {submitting ? 'Salvataggio...' : 'Crea Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
