import MapView from './components/Map/MapView';
import InputForm from './components/InputForm/InputForm';
import { useRouteStore } from './store/routeStore';

function App() {
  const userLocation = useRouteStore((state) => state.userLocation);

  return (
    <div className="app">
      <div className="sidebar">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
          Running Route Painter
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
          {userLocation
            ? `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
            : '📍 Getting your location...'}
        </p>

        <InputForm />
      </div>
      <div className="map-container">
        <MapView />
      </div>
    </div>
  );
}

export default App;
