import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import HomePage from "./pages/HomePage/HomePage";
import AboutPage from "./pages/AboutPage/AboutPage";
import BillsPage from "./pages/BillsPage/BillsPage";
import LegislatorsPage from "./pages/LegislatorsPage/LegislatorsPage";
import BillDetailsPage from "./pages/BillDetailsPage/BillDetailsPage";
import LegislatorDetailsPage from "./pages/LegislatorDetailsPage/LegislatorDetailsPage";
import MapsPage from "./pages/MapsPage/MapsPage";
import AnalysisPage from "./pages/AnalysisPage/AnalysisPage";
import AnalysisDetailsPage from "./pages/AnalysisDetailsPage/AnalysisDetailsPage";

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
                <Route path="/maps" element={<MapsPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />

                <Route
                    path="/bills/:sessionId/:billId"
                    element={<BillDetailsPage />}
                />
                <Route
                    path="/legislators/:legislatorId"
                    element={<LegislatorDetailsPage />}
                />
                <Route
                    path="/analysis/:legislatorId/:year/:policyTopic/:policyDirection"
                    element={<AnalysisDetailsPage />}
                />
            </Route>
        </Routes>
    );
}

export default App;
