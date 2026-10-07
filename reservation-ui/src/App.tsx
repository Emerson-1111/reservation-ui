// src/App.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { HubConnectionBuilder } from '@microsoft/signalr';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ReservationModal from './components/ReservationModal';
import AppointmentsList, { type Appointment } from './components/AppointmentsList';
import { appointmentsApi, getHubUrl, getApiKey } from './services/api';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  serviceName: string;
  customerName: string;
}

function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Función auxiliar para parsear fechas UTC consistentemente
  const parseUtcDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (!dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
      return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
  };

  const fetchAppointments = () => {
    appointmentsApi.getAll()
      .then(res => setAppointments(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchAppointments();

    const apiKey = getApiKey();
    const connection = new HubConnectionBuilder()
      .withUrl(getHubUrl(), apiKey ? {
        headers: { 'X-Api-Key': apiKey },
        accessTokenFactory: () => apiKey
      } : {})
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNewAppointment", (newAppointment: Appointment) => {
      setAppointments(prev => {
        if (newAppointment.id && prev.some(a => a.id === newAppointment.id)) {
          return prev;
        }
        return [...prev, newAppointment];
      });
    });

    connection.on("ReceiveDeletedAppointment", (deletedId: number) => {
      setAppointments(prev => prev.filter(app => app.id !== deletedId));
    });

    connection.start()
      .then(() => setIsConnected(true))
      .catch((err) => {
        console.error("SignalR Connection Error: ", err);
        setIsConnected(false);
      });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));

    return () => { connection.stop(); };
  }, []);

  const events: CalendarEvent[] = appointments.map(app => ({
    id: app.id,
    title: `${app.serviceName} - ${app.customerName}`,
    start: parseUtcDate(app.startTime),
    end: parseUtcDate(app.endTime),
    serviceName: app.serviceName,
    customerName: app.customerName
  }));

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    let start = new Date(slotInfo.start);
    let end = new Date(slotInfo.end);
    const now = new Date();

    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 23) {
      if (start.toDateString() === now.toDateString()) {
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        start = nextHour;
      } else {
        start.setHours(9, 0, 0, 0);
      }
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }

    if (start < now) {
      toast.error("No puedes seleccionar un horario en el pasado.", {
        style: { borderRadius: '8px', background: '#1e293b', color: '#fff' }
      });
      return;
    }

    setSelectedSlot({ start, end });
    setIsModalOpen(true);
  };

  const handleSaveReservation = async (customerName: string, serviceName: string) => {
    if (!selectedSlot) return;

    const newAppointment = {
      customerName,
      serviceName,
      startTime: selectedSlot.start.toISOString(),
      endTime: selectedSlot.end.toISOString()
    };

    const toastId = toast.loading('Guardando reserva...');

    try {
      await appointmentsApi.create(newAppointment);
      setIsModalOpen(false);
      toast.success('¡Reserva creada exitosamente!', { id: toastId });
    } catch (error: unknown) {
      let errorMessage = 'Error al guardar la reserva';

      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data as { errors?: Record<string, string[]>; title?: string } | string;
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.errors) {
          errorMessage = Object.values(responseData.errors).flat().join(' - ');
        } else if (responseData.title) {
          errorMessage = responseData.title;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: toastId, style: { background: '#1e293b', color: '#fff' } });
    }
  };

  const handleDeleteAppointment = (id: number | undefined, customerName: string) => {
    if (!id) return;

    toast(
      (t) => (
        <div style={{ fontFamily: 'system-ui', minWidth: '220px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
            ¿Cancelar cita de <b>{customerName}</b>?
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}>
              No
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading('Cancelando reserva...');
                try {
                  await appointmentsApi.delete(id);
                  toast.success('Reserva cancelada', { id: toastId });
                } catch {
                  toast.error('Error al cancelar la reserva', { id: toastId });
                }
              }}
              style={{
                background: '#e11d48',
                color: 'white',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}>
              Sí, cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 7000 }
    );
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    handleDeleteAppointment(event.id, event.customerName);
  };

  const handleNavigateToDate = (targetDate: Date) => {
    setCurrentDate(targetDate);
    toast('Calendario centrado en la cita', {
      icon: '📍',
      duration: 2500,
      style: { borderRadius: '8px', background: '#1e293b', color: '#fff', fontSize: '13px' }
    });
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#eff6ff',
        borderLeft: '4px solid #2563eb',
        color: '#1e3a8a',
        borderRadius: '6px',
        opacity: 0.95,
        display: 'block',
        border: '1px solid #bfdbfe',
        padding: '3px 6px',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 1px 2px rgba(37, 99, 235, 0.08)'
      }
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <strong style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {event.serviceName}
      </strong>
      <span style={{ fontSize: '11px', opacity: 0.85, lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '1px' }}>
        {event.customerName}
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* 1. Barra de navegación superior profesional */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '18px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)'
          }}>
            R
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
              Panel de Reservas
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Gestión de citas y reservas en tiempo real
            </p>
          </div>
        </div>

        {/* Indicadores en la barra superior */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isConnected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            color: isConnected ? '#15803d' : '#b91c1c'
          }}>
            <span className={isConnected ? "live-indicator-dot" : ""} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              display: 'inline-block'
            }} />
            {isConnected ? 'SignalR En vivo' : 'Desconectado'}
          </div>

          <div className="header-date">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </div>
        </div>
      </header>

      <Toaster position="bottom-right" />

      {/* 2. Contenedor principal: Calendario a la izquierda y Panel de Citas a la derecha */}
      <main className="dashboard-main" style={{
        display: 'flex',
        gap: '20px',
        padding: '20px 24px',
        width: '100%',
        boxSizing: 'border-box',
        flex: 1
      }}>
        {/* Lado Izquierdo: Calendario pegado a la izquierda */}
        <section className="calendar-panel" style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 105px)',
          minHeight: '700px',
          boxSizing: 'border-box'
        }}>
          <div style={{ flex: 1, height: '100%' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable={true}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              date={currentDate}
              onNavigate={(newDate) => setCurrentDate(newDate)}
              view={currentView}
              onView={(newView) => setCurrentView(newView)}
              culture="es"
              eventPropGetter={eventStyleGetter}
              messages={{
                next: "Sig.",
                previous: "Ant.",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda"
              }}
              components={{
                event: CustomEvent
              }}
            />
          </div>
        </section>

        {/* Lado Derecho: Sección de Citas Agendadas ordenadas cronológicamente */}
        <aside className="sidebar-panel" style={{
          width: '420px',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02)',
          height: 'calc(100vh - 105px)',
          minHeight: '700px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          <AppointmentsList
            appointments={appointments}
            parseUtcDate={parseUtcDate}
            onDeleteAppointment={handleDeleteAppointment}
            onNavigateToDate={handleNavigateToDate}
          />
        </aside>
      </main>

      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReservation}
        startTime={selectedSlot?.start || null}
        endTime={selectedSlot?.end || null}
      />
    </div>
  );
}

export default App;