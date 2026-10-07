// src/components/AppointmentsList.tsx
import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Appointment {
  id?: number;
  customerName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  parseUtcDate: (dateStr: string) => Date;
  onDeleteAppointment: (id: number | undefined, customerName: string) => void;
  onNavigateToDate: (date: Date) => void;
}

// Genera un color consistente basado en el nombre para el avatar
function getAvatarColor(name: string): { bg: string; color: string } {
  const colors = [
    { bg: '#dbeafe', color: '#1d4ed8' }, // Blue
    { bg: '#fef3c7', color: '#b45309' }, // Amber
    { bg: '#dcfce7', color: '#15803d' }, // Green
    { bg: '#f3e8ff', color: '#7e22ce' }, // Purple
    { bg: '#ffe4e6', color: '#be123c' }, // Rose
    { bg: '#e0e7ff', color: '#4338ca' }, // Indigo
    { bg: '#ffedd5', color: '#c2410c' }, // Orange
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AppointmentsList({
  appointments,
  parseUtcDate,
  onDeleteAppointment,
  onNavigateToDate
}: AppointmentsListProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const now = useMemo(() => new Date(), []);

  // Ordenar todas las citas cronológicamente por startTime ascendente
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = parseUtcDate(a.startTime).getTime();
      const dateB = parseUtcDate(b.startTime).getTime();
      return dateA - dateB;
    });
  }, [appointments, parseUtcDate]);

  // Identificar la siguiente cita inmediata (la primera futura o en curso)
  const nextAppointment = useMemo(() => {
    return sortedAppointments.find(app => {
      const end = parseUtcDate(app.endTime);
      return end > now;
    }) || null;
  }, [sortedAppointments, parseUtcDate, now]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = appointments.length;
    const todayCount = appointments.filter(app => isToday(parseUtcDate(app.startTime))).length;
    const upcomingCount = appointments.filter(app => parseUtcDate(app.endTime) > now).length;
    return { total, todayCount, upcomingCount };
  }, [appointments, parseUtcDate, now]);

  // Filtrado de citas
  const filteredAppointments = useMemo(() => {
    return sortedAppointments.filter(app => {
      const start = parseUtcDate(app.startTime);
      const end = parseUtcDate(app.endTime);

      // Filtro de tab
      if (filter === 'upcoming' && end <= now) return false;
      if (filter === 'today' && !isToday(start)) return false;

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCustomer = app.customerName.toLowerCase().includes(query);
        const matchService = app.serviceName.toLowerCase().includes(query);
        return matchCustomer || matchService;
      }

      return true;
    });
  }, [sortedAppointments, filter, searchQuery, parseUtcDate, now]);

  // Agrupación por fecha (Día)
  const groupedAppointments = useMemo(() => {
    const groups: { [key: string]: { date: Date; items: Appointment[] } } = {};

    filteredAppointments.forEach(app => {
      const start = parseUtcDate(app.startTime);
      const key = format(start, 'yyyy-MM-dd');
      if (!groups[key]) {
        groups[key] = { date: start, items: [] };
      }
      groups[key].items.push(app);
    });

    return Object.values(groups);
  }, [filteredAppointments, parseUtcDate]);

  const getStatusBadge = (start: Date, end: Date, isImmediateNext: boolean) => {
    if (now >= start && now <= end) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            display: 'inline-block'
          }} />
          En curso
        </span>
      );
    }

    if (isImmediateNext) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          ⭐ Próxima
        </span>
      );
    }

    if (end < now) {
      return (
        <span style={{
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          Completada
        </span>
      );
    }

    return (
      <span style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#475569',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        Pendiente
      </span>
    );
  };

  const getDateGroupTitle = (date: Date): string => {
    if (isToday(date)) {
      return `Hoy · ${format(date, "d 'de' MMMM", { locale: es })}`;
    }
    if (isTomorrow(date)) {
      return `Mañana · ${format(date, "d 'de' MMMM", { locale: es })}`;
    }
    const formatted = format(date, "EEEE, d 'de' MMMM", { locale: es });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 1. Encabezado del Panel */}
      <div style={{ padding: '20px 20px 16px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01" />
                <path d="M12 14h.01" />
                <path d="M16 14h.01" />
                <path d="M8 18h.01" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                Citas Agendadas
              </h2>
            </div>
          </div>
          <span style={{
            backgroundColor: '#f1f5f9',
            color: '#334155',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            {filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'}
          </span>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b' }}>
          Cronograma organizado según la fecha y hora de reserva
        </p>

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Buscar por cliente o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 32px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
          />
          <svg
            style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '7px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 4px'
              }}
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pestañas de Filtro */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilter('upcoming')}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: filter === 'upcoming' ? '600' : '500',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filter === 'upcoming' ? '#2563eb' : '#f1f5f9',
              color: filter === 'upcoming' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            Próximas ({stats.upcomingCount})
          </button>
          <button
            onClick={() => setFilter('today')}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: filter === 'today' ? '600' : '500',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filter === 'today' ? '#2563eb' : '#f1f5f9',
              color: filter === 'today' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            Hoy ({stats.todayCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: filter === 'all' ? '600' : '500',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filter === 'all' ? '#2563eb' : '#f1f5f9',
              color: filter === 'all' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            Todas ({stats.total})
          </button>
        </div>
      </div>

      {/* 2. Lista de Citas con Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Banner destacado: Siguiente Cita Inmediata */}
        {nextAppointment && filter !== 'today' && !searchQuery && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#1d4ed8'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Siguiente Cita en Agenda
              </span>
              {getStatusBadge(
                parseUtcDate(nextAppointment.startTime),
                parseUtcDate(nextAppointment.endTime),
                true
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                  {nextAppointment.customerName}
                </h3>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
                  {nextAppointment.serviceName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>
                    {format(parseUtcDate(nextAppointment.startTime), "d 'de' MMM, h:mm a", { locale: es })} - {format(parseUtcDate(nextAppointment.endTime), "h:mm a", { locale: es })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => onNavigateToDate(parseUtcDate(nextAppointment.startTime))}
                  title="Ver en el calendario"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 3h6v6" />
                    <path d="M10 14L21 3" />
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                  Ver
                </button>
                <button
                  onClick={() => onDeleteAppointment(nextAppointment.id, nextAppointment.customerName)}
                  title="Cancelar esta cita"
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sin citas para mostrar */}
        {groupedAppointments.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              color: '#94a3b8'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
              No hay citas programadas
            </p>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '240px' }}>
              {searchQuery
                ? 'No se encontraron citas con ese criterio de búsqueda.'
                : filter === 'today'
                ? 'No tienes citas agendadas para el día de hoy.'
                : 'Selecciona una celda en el calendario para crear tu primera reserva.'}
            </p>
          </div>
        ) : (
          /* Grupos por fecha */
          groupedAppointments.map(group => {
            const dateStr = format(group.date, 'yyyy-MM-dd');
            return (
              <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Separador de Fecha */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 2
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: isToday(group.date) ? '#2563eb' : '#475569',
                    letterSpacing: '0.2px'
                  }}>
                    {getDateGroupTitle(group.date)}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    backgroundColor: '#f1f5f9',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {group.items.length}
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#f1f5f9' }} />
                </div>

                {/* Tarjetas de Cita en ese día */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map(app => {
                    const startDate = parseUtcDate(app.startTime);
                    const endDate = parseUtcDate(app.endTime);
                    const isImmediate = nextAppointment?.id === app.id;
                    const avatarColors = getAvatarColor(app.customerName);

                    return (
                      <div
                        key={app.id || `${app.customerName}-${app.startTime}`}
                        style={{
                          backgroundColor: '#ffffff',
                          border: isImmediate ? '1.5px solid #60a5fa' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          boxShadow: isImmediate
                            ? '0 2px 6px rgba(37, 99, 235, 0.12)'
                            : '0 1px 3px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Cabecera de la tarjeta: Horario y Estado */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>
                              {format(startDate, 'h:mm a', { locale: es })} - {format(endDate, 'h:mm a', { locale: es })}
                            </span>
                          </div>

                          {getStatusBadge(startDate, endDate, isImmediate)}
                        </div>

                        {/* Contenido: Avatar + Nombre + Servicio */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: avatarColors.bg,
                              color: avatarColors.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '13px',
                              flexShrink: 0
                            }}>
                              {getInitials(app.customerName)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {app.customerName}
                              </h4>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '12px',
                                color: '#2563eb',
                                fontWeight: '500',
                                backgroundColor: '#eff6ff',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                marginTop: '3px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {app.serviceName}
                              </span>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => onNavigateToDate(startDate)}
                              title="Ver en el calendario"
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#475569',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                e.currentTarget.style.color = '#2563eb';
                                e.currentTarget.style.borderColor = '#bfdbfe';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#475569';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h6v6" />
                                <path d="M10 14L21 3" />
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteAppointment(app.id, app.customerName)}
                              title="Cancelar cita"
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee2e2';
                                e.currentTarget.style.color = '#dc2626';
                                e.currentTarget.style.borderColor = '#fecaca';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
