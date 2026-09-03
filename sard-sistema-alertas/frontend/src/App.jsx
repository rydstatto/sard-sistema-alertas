import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const crearIconoSeveridad = (severidad) => {
  const colores = {
    alta: '#dc2626',   // Rojo
    media: '#f59e0b',  // Amarillo
    baja: '#10b981',   // Verde
  };

  const color = colores[severidad?.toLowerCase()] || '#2563eb';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0px 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

function ManejadorClicMapa({ setFormData }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setFormData((prev) => ({
        ...prev,
        latitud: lat.toFixed(6),
        longitud: lng.toFixed(6),
      }));
    },
  });
  return null;
}

function App() {
  const [alertas, setAlertas] = useState([]);
  const [filtroSeveridad, setFiltroSeveridad] = useState('todas');
  const [formData, setFormData] = useState({
    tipo_incidente: 'accidente_vial',
    descripcion: '',
    nivel_severidad: 'alta',
    latitud: '10.2606',
    longitud: '-67.6881',
  });

  const cargarAlertas = () => {
    fetch('http://localhost:3000/api/alertas')
      .then((res) => res.json())
      .then((data) => setAlertas(data))
      .catch((err) => console.error('Error cargando alertas:', err));
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData((prev) => ({ ...prev, descripcion: '' }));
        cargarAlertas();
      }
    } catch (err) {
      console.error('Error guardando alerta:', err);
    }
  };

  const resolverAlerta = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/alertas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'resuelto' }),
      });
      if (res.ok) cargarAlertas();
    } catch (err) {
      console.error('Error al resolver alerta:', err);
    }
  };

  const eliminarAlerta = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/alertas/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) cargarAlertas();
    } catch (err) {
      console.error('Error al eliminar alerta:', err);
    }
  };

  const alertasFiltradas = alertas.filter((alerta) => {
    if (filtroSeveridad === 'todas') return true;
    return alerta.nivel_severidad?.toLowerCase() === filtroSeveridad;
  });

  const centroInicial = [10.2606, -67.6881];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Panel Lateral */}
      <div style={{
        width: '320px',
        padding: '20px',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          Registrar Alerta
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tipo de Incidente</label>
            <select
              name="tipo_incidente"
              value={formData.tipo_incidente}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            >
              <option value="accidente_vial">Accidente Vial</option>
              <option value="obstruccion">Obstrucción de Vía</option>
              <option value="falla_electrica">Falla Eléctrica</option>
              <option value="presencia_sospechosa">Presencia Sospechosa</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Severidad</label>
            <select
              name="nivel_severidad"
              value={formData.nivel_severidad}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            >
              <option value="alta">Alta (Rojo)</option>
              <option value="media">Media (Amarillo)</option>
              <option value="baja">Baja (Verde)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              rows="2"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Latitud</label>
              <input
                type="text"
                name="latitud"
                value={formData.latitud}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Longitud</label>
              <input
                type="text"
                name="longitud"
                value={formData.longitud}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '10px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Emitir Alerta
          </button>
        </form>

        {/* Filtros */}
        <div style={{ marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
            Filtrar en Mapa:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {['todas', 'alta', 'media', 'baja'].map((nivel) => (
              <button
                key={nivel}
                onClick={() => setFiltroSeveridad(nivel)}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  backgroundColor: filtroSeveridad === nivel ? '#3b82f6' : '#0f172a',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {nivel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, height: '100%' }}>
        <MapContainer center={centroInicial} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <ManejadorClicMapa setFormData={setFormData} />
          {alertasFiltradas.map((alerta) => {
            const coords = typeof alerta.coordenadas === 'string' 
              ? JSON.parse(alerta.coordenadas) 
              : alerta.coordenadas;
            
            if (!coords?.coordinates) return null;
            const posicion = [coords.coordinates[1], coords.coordinates[0]]; 

            return (
              <Marker 
                key={alerta.id} 
                position={posicion}
                icon={crearIconoSeveridad(alerta.nivel_severidad)}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{alerta.tipo_incidente.toUpperCase()}</strong><br />
                    <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>{alerta.descripcion}</p>
                    <small>Estado: <b>{alerta.estado || 'activo'}</b></small><br />
                    <small>Severidad: <b>{alerta.nivel_severidad}</b></small>

                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                      {alerta.estado !== 'resuelto' && (
                        <button
                          onClick={() => resolverAlerta(alerta.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Resolver
                        </button>
                      )}
                      <button
                        onClick={() => eliminarAlerta(alerta.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;