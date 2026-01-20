// layouts/AppLayout.tsx
import { Outlet } from "react-router-dom";
import NavigationBar from "../components/NavigationBar/NavigationBar";

//Used to always have the navigation bar at the top of the page and only have to render it once while the other pages change
export function AppLayout() {
    return (
        <>
            <NavigationBar></NavigationBar>
            <main>
                <Outlet />
            </main>
        </>
    );
}
