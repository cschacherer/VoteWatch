import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, NavLink } from "react-router-dom";
import BinocularIcon from "../../assets/icons-binoculars1.svg";

import style from "./NavigationBar.module.css";

const navLinks = [
    { label: "Home", to: "/" },
    { label: "Bills", to: "/bills" },
    { label: "Legislators", to: "/legislators" },
    { label: "Analysis", to: "/analysis" },
    { label: "Maps", to: "/maps" },
];

const NavigationBar = () => {
    return (
        <Navbar expand="md" collapseOnSelect className={style.navigationBar}>
            <Navbar.Brand
                as={Link}
                to="/"
                className={style.navigationBar__brand}
            >
                <img
                    className={style.navigationBar__icon}
                    src={BinocularIcon}
                    alt=""
                />
                Utah Vote Watch
            </Navbar.Brand>

            <Navbar.Toggle
                aria-controls="main-navigation"
                className={style.navigationBar__toggle}
            />

            <Navbar.Collapse
                id="main-navigation"
                className={style.navigationBar__collapse}
            >
                <Nav className={style.navigationBar__links}>
                    {navLinks.map((link) => (
                        <Nav.Link
                            key={link.to}
                            as={NavLink}
                            to={link.to}
                            end={link.to === "/"}
                            eventKey={link.to}
                            className={style.navigationBar__link}
                        >
                            {link.label}
                        </Nav.Link>
                    ))}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default NavigationBar;
