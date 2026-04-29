import { Navigate, Route, Routes } from 'react-router-dom';
import UnitsPage from './pages/UnitsPage';
import ParkingGridPage from './pages/ParkingGridPage';
import SpotDetailsPage from './pages/SpotDetailsPage';
import MyParkingPage from './pages/MyParkingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/units" replace />} />
      <Route path="/units" element={<UnitsPage />} />
      <Route path="/units/:unitId/spots" element={<ParkingGridPage />} />
      <Route path="/units/:unitId/spots/:spotId" element={<SpotDetailsPage />} />
      <Route path="/my-parking" element={<MyParkingPage />} />
      <Route path="*" element={<Navigate to="/units" replace />} />
    </Routes>
  );
}