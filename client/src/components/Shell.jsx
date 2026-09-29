import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "primereact/button";
import { useLang } from "../context/LanguageContext";
export default function Shell({ children }) {
  const { lang, setLang, t } = useLang();
  return (
    <>
      <header className="topbar">
        <div className="wrap nav">
          <Link to="/" className="brand">
            <span className="brandmark">ॐ</span>
            <span>
              <b>SVSVDAC Temple</b>
              <small>
                {t(
                  "Divine blessings for every family",
                  "ప్రతి కుటుంబానికి దైవ ఆశీస్సులు",
                )}
              </small>
            </span>
          </Link>
          <nav>
            <NavLink to="/">{t("Home", "హోమ్")}</NavLink>
            <NavLink to="/poojas">{t("Poojas", "పూజలు")}</NavLink>
            <NavLink to="/my-bookings">
              {t("My Bookings", "నా బుకింగ్స్")}
            </NavLink>
          </nav>
          <div className="navright">
            <Button
              label={lang === "en" ? "తెలుగు" : "English"}
              outlined
              size="small"
              onClick={() => setLang(lang === "en" ? "te" : "en")}
            />
            <Link to="/admin/login" className="adminlink">
              <i className="pi pi-lock" /> {t("Admin", "అడ్మిన్")}
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div className="wrap foot">
          <div>
            <b>SVSVDAC Temple</b>
            <p>
              {t(
                "Book your seva with devotion and ease.",
                "భక్తితో మీ సేవను సులభంగా బుక్ చేసుకోండి.",
              )}
            </p>
          </div>
          <span>© {new Date().getFullYear()} SVSVDAC Temple</span>
        </div>
      </footer>
    </>
  );
}
