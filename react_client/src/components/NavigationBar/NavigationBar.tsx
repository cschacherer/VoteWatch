import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import BinocularIcon from "../../assets/icons-binoculars1.svg";

import style from "./NavigationBar.module.css";

const NavigationBar = () => {
    return (
        <Navbar expand="lg" className={style.navigationBar__background}>
            <Navbar.Collapse className={style.navigationBar__container}>
                <Navbar.Brand href="/" className={style.navigationBar__brand}>
                    <img
                        className={style.navigationBar__icon}
                        src={BinocularIcon}
                    />
                    Utah Vote Watch
                </Navbar.Brand>
                <div className={style.navigationBar__linkContainer}>
                    <Nav.Link className={style.navigationBar__link} href="/">
                        Home
                    </Nav.Link>

                    <Nav.Link
                        className={style.navigationBar__link}
                        href="/bills"
                    >
                        Bills
                    </Nav.Link>

                    <Nav.Link
                        className={style.navigationBar__link}
                        href="/legislators"
                    >
                        Legislators
                    </Nav.Link>

                    <Nav.Link
                        className={style.navigationBar__link}
                        href="/maps"
                    >
                        Maps
                    </Nav.Link>
                </div>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default NavigationBar;
