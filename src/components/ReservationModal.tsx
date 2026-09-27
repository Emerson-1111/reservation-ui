import { useState } from 'react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerName: string, serviceName: string) => void;
  startTime: Date | null;
  endTime: Date | null;
}

export default function ReservationModal({ isOpen, onClose, onSave, startTime, endTime }: ReservationModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [serviceName, setServiceName] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '300px' }}>
        <h2>Nueva Reserva</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {startTime?.toLocaleTimeString()} - {endTime?.toLocaleTimeString()}
        </p>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nombre del Cliente</label>
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Servicio</label>
          <input type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Ej. Corte de pelo" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ padding: '8px 15px', cursor: 'pointer' }}>Cancelar</button>
          <button 
            onClick={() => {
              onSave(customerName, serviceName);
              setCustomerName('');
              setServiceName('');
            }} 
            style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            disabled={!customerName || !serviceName}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}