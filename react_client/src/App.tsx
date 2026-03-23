import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import HomePage from "./pages/HomePage/HomePage";
import AboutPage from "./pages/AboutPage/AboutPage";
import BillsPage from "./pages/BillsPage/BillsPage";
import LegislatorsPage from "./pages/LegislatorsPage/LegislatorsPage";
import BillDetailsPage from "./pages/BillDetailsPage/BillDetailsPage";

import "./App.css";

function App() {
    return (
        <Routes>
            <Route path="index.html" element={<Navigate to="/" replace />} />
            <Route path="/" element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/bills" element={<BillsPage />} />
                <Route path="/legislators" element={<LegislatorsPage />} />
                <Route path="/bills/:billId" element={<BillDetailsPage />} />
            </Route>
        </Routes>
    );
}

export default App;
