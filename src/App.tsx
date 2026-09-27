// src/App.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 1. Configuración del idioma y formato de fechas para el calendario en Español
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Nuestra interfaz del Backend
interface Appointment {
  id?: number; 
  customerName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
}

// Interfaz que necesita react-big-calendar para pintar en pantalla
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Carga de configuración desde variables de entorno (.env)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5170/api/appointments';
  const API_KEY = import.meta.env.VITE_API_KEY;

  const axiosHeaders = API_KEY ? { 'X-Api-Key': API_KEY } : undefined;

  const fetchAppointments = () => {
    axios.get(API_URL, { headers: axiosHeaders })
      .then(response => setAppointments(response.data))
      .catch(error => console.error("Error cargando citas:", error));
  };

  useEffect(() => {
    fetchAppointments(); // Cargar al iniciar
  }, []);

  // 2. Transformar nuestros datos al formato visual del calendario
  const events: CalendarEvent[] = appointments.map(app => ({
    title: `${app.serviceName} - ${app.customerName}`,
    start: new Date(app.startTime),
    end: new Date(app.endTime),
  }));

  // 3. Función que se ejecuta al hacer clic o arrastrar en un espacio vacío
  const handleSelectSlot = async (slotInfo: SlotInfo) => {
    // Usamos prompts nativos por simplicidad. (En un proyecto final, esto sería un Modal hermoso).
    const customerName = window.prompt('Nombre del cliente:');
    if (!customerName) return;

    const serviceName = window.prompt('Servicio a reservar (Ej: Sala B, Corte, Consulta):');
    if (!serviceName) return;

    // Preparamos el objeto para enviar al backend
    const newAppointment: Appointment = {
      customerName,
      serviceName,
      startTime: slotInfo.start.toISOString(),
      endTime: slotInfo.end.toISOString()
    };

    try {
      // Hacemos el POST a .NET
      await axios.post(API_URL, newAppointment, { headers: axiosHeaders });
      alert('¡Reserva creada con éxito!');
      fetchAppointments(); // Recargamos las citas para ver la nueva
    } catch (error) {
      console.error("Error creando reserva:", error);
      alert('Hubo un error al guardar la reserva.');
    }
  };

  return (
    <div style={{ height: '100vh', padding: '20px', boxSizing: 'border-box', backgroundColor: '#f8f9fa' }}>
      <h1 style={{ textAlign: 'center', fontFamily: 'sans-serif', color: '#333' }}>
        Sistema de Reservas
      </h1>
      
      {/* Contenedor del calendario */}
      <div style={{ height: 'calc(100% - 100px)', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable={true} // Permite seleccionar espacios vacíos
          onSelectSlot={handleSelectSlot} // Evento al seleccionar
          defaultView="week" // Empieza en la vista semanal
          culture="es" // Aplica el idioma español
          messages={{ // Traduce los botones
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda"
          }}
        />
      </div>
    </div>
  );
}

export default App;