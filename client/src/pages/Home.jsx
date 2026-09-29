import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import PoojaCard from "../components/PoojaCard";
import { api } from "../api";
import { useLang } from "../context/LanguageContext";
export default function Home() {
  const [poojas, setPoojas] = useState([]);
  const { lang, t } = useLang();
  useEffect(() => {
    api("/poojas")
      .then((d) => setPoojas(d.poojas || []))
      .catch(() => setPoojas([]));
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="wrap hero-content">
          <div className="hero-copy">
            <span className="pill">
              <i className="pi pi-sparkles" />{" "}
              {t("WELCOME TO SVSVDAC TEMPLE", "SVSVDAC ఆలయానికి స్వాగతం")}
            </span>
            <h1>
              {t("Book your pooja.", "మీ పూజను")}
              <em>{t("R eceive divine blessings.", "బుక్ చేసుకోండి.")}</em>
            </h1>
            <p>
              {t(
                "Plan your temple seva with a simple and secure online booking experience for you and your family.",
                "మీరు మరియు మీ కుటుంబం కోసం సులభమైన ఆన్‌లైన్ బుకింగ్ ద్వారా ఆలయ సేవలను ప్లాన్ చేసుకోండి.",
              )}
            </p>
            <div className="hero-actions">
              <Link to="/poojas">
                <Button
                  label={t("Explore Poojas", "పూజలను చూడండి")}
                  icon="pi pi-arrow-right"
                  iconPos="right"
                />
              </Link>
              <Link to="/my-bookings" className="text-link">
                {t("Track a booking", "బుకింగ్ వివరాలు")}{" "}
                <i className="pi pi-angle-right" />
              </Link>
            </div>
            <div className="hero-points">
              <span>
                <i className="pi pi-check-circle" />{" "}
                {t("Easy booking", "సులభమైన బుకింగ్")}
              </span>
              <span>
                <i className="pi pi-shield" />{" "}
                {t("Secure details", "సురక్షిత వివరాలు")}
              </span>
            </div>
          </div>
          <div className="hero-art">
            {/* <div className="mandala">ॐ</div> */}
            {/* <div className="art-card">
              <div className="diya">🪔</div>
              <span>{t("With devotion", "భక్తితో")}</span>
              <b>{t("Every prayer matters", "ప్రతి ప్రార్థన పవిత్రమే")}</b>
              <small>శుభం భవతు</small>
            </div> */}
            {/* <div className="float flower">✿</div> */}
            {/* <div className="float star">✧</div> */}
            <img src="/temple.png" alt="Temple" className="hero-image" />
          </div>
        </div>
      </section>
      <section className="wrap section">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              {t("SEVA & RITUALS", "సేవలు & పూజలు")}
            </span>
            <h2>{t("Popular Poojas", "ప్రసిద్ధ పూజలు")}</h2>
            <p>
              {t(
                "Choose a seva and complete your booking in a few steps.",
                "మీకు కావలసిన సేవను ఎంచుకొని సులభంగా బుక్ చేసుకోండి.",
              )}
            </p>
          </div>
          <Link to="/poojas" className="view-all">
            {t("View all poojas", "అన్ని పూజలు")}{" "}
            <i className="pi pi-arrow-up-right" />
          </Link>
        </div>
        <div className="grid-cards">
          {poojas.slice(0, 3).map((p) => (
            <PoojaCard key={p.id} pooja={p} lang={lang} />
          ))}
        </div>
        {!poojas.length && (
          <div className="empty">
            {t(
              "Poojas will appear here once the service is connected.",
              "సేవ కనెక్ట్ అయిన తర్వాత పూజలు ఇక్కడ కనిపిస్తాయి.",
            )}
          </div>
        )}
      </section>
      <section className="blessing">
        <div className="wrap blessing-inner">
          <div className="blessing-icon">ॐ</div>
          <div>
            <h2>
              {t(
                "A sacred moment for your family",
                "మీ కుటుంబానికి ఒక పవిత్రమైన క్షణం",
              )}
            </h2>
            <p>
              {t(
                "Provide your gotram and family details while booking so the temple can prepare for your seva.",
                "మీ సేవకు ఆలయం సిద్ధం కావడానికి గోత్రం మరియు కుటుంబ వివరాలను నమోదు చేయండి.",
              )}
            </p>
          </div>
          <Link to="/poojas">
            <Button
              label={t("Book a Pooja", "పూజ బుక్ చేయండి")}
              severity="secondary"
            />
          </Link>
        </div>
      </section>
    </>
  );
}
