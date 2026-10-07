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

  // 1. Estilos para el fondo oscuro (Overlay)
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)', // Efecto cristalino moderno
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  // 2. Estilos para la caja blanca del Modal
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  // 3. Estilos compartidos para los inputs
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    marginTop: '6px',
    marginBottom: '20px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontSize: '15px',
    outline: 'none',
  };

  const isNameValid = customerName.trim().length >= 3;
  const isServiceValid = serviceName.trim().length > 0;
  const canSubmit = isNameValid && isServiceValid;

  // 4. Estilos para los botones
  const btnPrimaryStyle: React.CSSProperties = {
    backgroundColor: canSubmit ? '#0066ff' : '#99c2ff', // Cambia de color si está deshabilitado
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: canSubmit ? 'pointer' : 'not-allowed',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  };

  const btnSecondaryStyle: React.CSSProperties = {
    backgroundColor: '#f1f3f5',
    color: '#333',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '10px',
    fontWeight: 'bold',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>

        <h2 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>Nueva Reserva</h2>

        {/* Etiqueta de la hora seleccionada con estilo de "pill" (píldora) */}
        <p style={{
          backgroundColor: '#e6f0ff',
          color: '#0066ff',
          padding: '6px 12px',
          borderRadius: '20px',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '20px',
          marginTop: '0'
        }}>
          {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>

        <div>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#4a4a4a' }}>Nombre del Cliente</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Ej. Emerson Ozoria (mín. 3 caracteres)"
            style={{ ...inputStyle, marginBottom: customerName.length > 0 && !isNameValid ? '6px' : '20px' }}
          />
          {customerName.length > 0 && !isNameValid && (
            <span style={{ color: '#e11d48', fontSize: '12px', marginBottom: '14px', display: 'block' }}>
              El nombre debe tener al menos 3 caracteres
            </span>
          )}
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#4a4a4a' }}>Servicio</label>
          <input
            type="text"
            value={serviceName}
            onChange={e => setServiceName(e.target.value)}
            placeholder="Ej. Corte de pelo"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button onClick={onClose} style={btnSecondaryStyle}>
            Cancelar
          </button>
          <button
            onClick={() => {
              if (canSubmit) {
                onSave(customerName.trim(), serviceName.trim());
                setCustomerName('');
                setServiceName('');
              }
            }}
            disabled={!canSubmit}
            style={btnPrimaryStyle}
          >
            Guardar Cita
          </button>
        </div>

      </div>
    </div>
  );
}