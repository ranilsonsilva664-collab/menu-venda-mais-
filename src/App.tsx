import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import RestaurantMenu from "./pages/RestaurantMenu";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/:tenantId" element={<RestaurantMenu />} />
      </Routes>
    </BrowserRouter>
  );
}
