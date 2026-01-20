import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import HomePage from "./pages/HomePage/HomePage";
import AboutPage from "./pages/AboutPage/AboutPage";
import BillsPage from "./pages/BillsPage/BillsPage";
import LegislatorsPage from "./pages/LegislatorsPage/LegislatorsPage";

import "./App.css";

function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/bills" element={<BillsPage />} />
                <Route path="/legislators" element={<LegislatorsPage />} />
            </Route>
        </Routes>
    );
}

export default App;
