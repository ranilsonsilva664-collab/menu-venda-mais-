import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import RestaurantMenu from "./pages/RestaurantMenu";

import MasterAdmin from "./pages/MasterAdmin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/master-admin" element={<MasterAdmin />} />
        <Route path="/:tenantId" element={<RestaurantMenu />} />
      </Routes>
    </BrowserRouter>
  );
}
