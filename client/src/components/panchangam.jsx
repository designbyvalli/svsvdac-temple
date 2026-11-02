import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { toPng } from "html-to-image";
import "../stylesp.css";

const PROKERALA_CLIENT_ID = "f76aae4d-6b81-4511-a58a-b06df34c04a7";
const PROKERALA_CLIENT_SECRET = "zBgXx5x99bbGoUmozJZCHhN3NqeQLWYxDRXvPUz2";
const HYD_COORDS = "17.385,78.487";
const MAX_DATE = new Date(2027, 11, 31);

const TELUGU_MAP = {
  "prathama": "పాడ్యమి", "dwitiya": "విదియ", "tritiya": "తదియ", "chaturthi": "చవితి",
  "panchami": "పంచమి", "shashthi": "షష్ఠి", "saptami": "సప్తమి", "ashtami": "అష్టమి",
  "navami": "నవమి", "dashami": "దశమి", "ekadashi": "ఏకాదశి", "dwadashi": "ద్వాదశి",
  "trayodashi": "త్రయోదశి", "chaturdashi": "చతుర్దశి", "purnima": "పూర్ణిమ", "amavasya": "అమావాస్య",
  "shukla": "శుక్ల పక్షం", "krishna": "కృష్ణ పక్షం", "shuklapaksha": "శుక్ల పక్షం", "krishnapaksha": "కృష్ణ పక్షం",
  "ashwini": "అశ్విని", "bharani": "భరణి", "krittika": "కృత్తిక", "rohini": "రోహిణి",
  "mrigashirsha": "మృగశిర", "ardra": "ఆరుద్ర", "punarvasu": "పునర్వసు", "pushya": "పుష్యమి",
  "ashlesha": "ఆశ్లేష", "magha": "మఖ", "purva phalguni": "పూర్వ ఫల్గుణి", "uttara phalguni": "ఉత్తర ఫల్గుణి",
  "hasta": "హస్త", "chitra": "చిత్ర", "swati": "స్వాతి", "vishakha": "విశాఖ",
  "anuradha": "అనూరాధ", "jyeshtha": "జ్యేష్ఠ", "mula": "మూల", "purva ashadha": "పూర్వాషాఢ",
  "uttara ashadha": "ఉత్తరాషాఢ", "shravana": "శ్రవణం", "dhanishta": "ధనిష్ఠ",
  "shatabhisha": "శతభిషం", "purva bhadrapada": "పూర్వాభాద్ర", "uttara bhadrapada": "ఉత్తరాభాద్ర", "revati": "రేవతి",
  "vishkambha": "విష్కంభం", "priti": "ప్రీతి", "ayushman": "ఆయుష్మాన్", "saubhagya": "సౌభాగ్య",
  "shobhana": "శోభన", "atiganda": "అతిగండ", "sukarma": "సుకుర్మ", "dhriti": "ధృతి",
  "shula": "శూల", "ganda": "గండ", "vriddhi": "వృద్ధి", "dhruva": "ధ్రువ",
  "vyaghata": "వ్యాఘాత", "harshana": "హర్షణ", "vajra": "వజ్ర", "siddhi": "సిద్ధి",
  "vyatipata": "వ్యతీపాత", "variyan": "వరియాన్", "parigha": "పరిఘ", "shiva": "శివ",
  "siddha": "సిద్ధ", "sadhya": "సాధ్య", "shubha": "శుభ", "shukla yoga": "శుభ్ర",
  "brahma": "బ్రహ్మ", "aindra": "ఐంద్ర", "vaidhriti": "వైధృతి",
  "bava": "బవ", "balava": "బాలవ", "kaulava": "కౌలవ", "taitila": "తైతుల",
  "garaja": "గరజి", "vanija": "వణిజ", "vishti": "విష్టి (భద్ర)", "shakuni": "శకుని",
  "chatushpada": "చతుష్పాత్", "naga": "నాగవ", "kimstughna": "కింస్తుఘ్న",
  "tuesday": "మంగళవారం", "wednesday": "బుధవారం", "thursday": "గురువారం",
  "friday": "శుక్రవారం", "saturday": "శనివారం", "sunday": "ఆదివారం", "monday": "సోమవారం"
};

const norm = (str) => String(str ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function translate(text) {
  if (!text) return "వివరాలు అందుబాటులో లేవు";
  const key = norm(text);
  for (const [k, v] of Object.entries(TELUGU_MAP)) {
    if (norm(k) === key) return v;
  }
  return String(text);
}

function formatIsoTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("te-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(d);
}

function formatAngaList(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "వివరాలు అందుబాటులో లేవు";
  return arr.map(item => {
    const name = translate(item.name);
    const end = formatIsoTime(item.end);
    return end ? `${name} (${end} వరకు)` : name;
  }).join(", ");
}

function getPeriodByName(allMuhurats, searchNames) {
  if (!allMuhurats || !Array.isArray(allMuhurats)) return "వివరాలు అందుబాటులో లేవు";
  const targetNames = searchNames.map(norm);
  const found = allMuhurats.find(m => targetNames.includes(norm(m.name)));
  if (!found || !found.period || !Array.isArray(found.period) || found.period.length === 0) {
    return "వివరాలు అందుబాటులో లేవు";
  }
  const timings = found.period.map(p => {
    const s = formatIsoTime(p.start);
    const e = formatIsoTime(p.end);
    return s && e ? `${s} – ${e}` : "";
  }).filter(Boolean);

  return timings.length > 0 ? timings.join(", ") : "వివరాలు అందుబాటులో లేవు";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("te-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Detail({ label, value, icon, accent = "" }) {
  return (
    <div className={`panchang-detail ${accent}`}>
      <div className="detail-icon"><i className={`pi ${icon}`} /></div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || "వివరాలు అందుబాటులో లేవు"}</div>
    </div>
  );
}

export default function Panchagam() {
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const posterRef = useRef(null);
  const iso = useMemo(() => isoDate(date), [date]);

  const getAccessToken = async () => {
    const res = await fetch("/prokerala-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: PROKERALA_CLIENT_ID,
        client_secret: PROKERALA_CLIENT_SECRET
      })
    });
    if (!res.ok) throw new Error("Prokerala Token పొందడంలో సమస్య వచ్చింది.");
    const json = await res.json();
    return json.access_token;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const datetimeParam = encodeURIComponent(`${iso}T06:00:00+05:30`);
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

      const res = await fetch(`/prokerala-api/v2/astrology/panchang/advanced?ayanamsa=1&coordinates=${HYD_COORDS}&datetime=${datetimeParam}&la=te`, { headers });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `పంచాంగం వివరాలు అందలేదు (HTTP ${res.status}).`);
      }

      const result = await res.json();
      setData(result.data || result);
    } catch (err) {
      setData(null);
      setError(err.message || "పంచాంగం పొందడంలో సమస్య వచ్చింది.");
    } finally {
      setLoading(false);
    }
  }, [iso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadPng = async () => {
    if (!posterRef.current) return;
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `hyderabad-panchangam-${iso}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError("PNG తయారు చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.");
    }
  };

  const isWednesday = date.getDay() === 3;
  const auspiciousList = data?.auspicious_period || [];
  const inauspiciousList = data?.inauspicious_period || [];

  const tithiArr = data?.tithi || [];
  const pakshaText = tithiArr.length > 0 && tithiArr[0]?.paksha ? translate(tithiArr[0].paksha) : "వివరాలు అందుబాటులో లేవు";
  const vaaraText = data?.vaara ? translate(data.vaara) : "";

  return (
    <main className="panchangam-page">
      <div className="panchangam-toolbar">
        <div className="toolbar-date">
          <label htmlFor="panchang-date">పంచాంగం తేదీ</label>
          <Calendar
            inputId="panchang-date"
            value={date}
            onChange={(e) => e.value && setDate(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            maxDate={MAX_DATE}
          />
        </div>
        <div className="toolbar-actions">
          <Button label="పంచాంగం రూపొందించు" icon="pi pi-refresh" onClick={fetchData} loading={loading} />
          <Button label="PNG డౌన్‌లోడ్" icon="pi pi-download" severity="secondary" outlined onClick={downloadPng} disabled={!data || loading} />
        </div>
      </div>

      {loading && (
        <div className="panchangam-state">
          <ProgressSpinner style={{ width: 42, height: 42 }} />
          <span>పంచాంగం వివరాలు పొందుతున్నాం...</span>
        </div>
      )}
      {error && !loading && <Message severity="error" text={error} className="panchangam-message" />}

      {data && !loading && (
        <section className="poster-wrap">
          <div className="panchangam-poster" ref={posterRef}>
            <div className="poster-border">
              <header className="poster-header">
                <div className="ornament-row" aria-hidden="true">✧ 🪔 ✧ 🪔 ✧ 🪔 ✧ 🪔 ✧</div>
                <div className="header-symbol">ॐ</div>
                <div className="poster-kicker">శుభమస్తు · శుభదినం</div>
                <h1>తెలంగాణ పంచాంగం</h1>
                <h2>హైదరాబాద్</h2>
                <div className="header-meta">
                  <span><i className="pi pi-map-marker" /> నగరం: హైదరాబాద్</span>
                  <span><i className="pi pi-calendar" /> తేదీ: {iso}</span>
                </div>
              </header>

              <div className="location-strip">
                <span><i className="pi pi-map-marker" /> స్థలం: హైదరాబాద్</span>
                <span>అక్షాంశం: 17.385</span>
                <span>రేఖాంశం: 78.487</span>
              </div>

              <div className="poster-date">
                <i className="pi pi-calendar" />
                <span>{formatDate(date)}{vaaraText ? ` (${vaaraText})` : ""}</span>
              </div>

              <div className="sun-moon-grid">
                <Detail label="సూర్యోదయం" value={formatIsoTime(data?.sunrise)} icon="pi-sun" />
                <Detail label="సూర్యాస్తమయం" value={formatIsoTime(data?.sunset)} icon="pi-sun" />
                <Detail label="చంద్రోదయం" value={formatIsoTime(data?.moonrise)} icon="pi-moon" />
                <Detail label="చంద్రాస్తమయం" value={formatIsoTime(data?.moonset)} icon="pi-moon" />
              </div>

              <div className="main-grid">
                <Detail label="తిథి" value={formatAngaList(data?.tithi)} icon="pi-calendar" accent="tint-sage" />
                <Detail label="నక్షత్రం" value={formatAngaList(data?.nakshatra)} icon="pi-star" accent="tint-sage" />
                <Detail label="యోగం" value={formatAngaList(data?.yoga)} icon="pi-sparkles" accent="tint-cream" />
                <Detail label="కరణం" value={formatAngaList(data?.karana)} icon="pi-sun" accent="tint-cream" />
              </div>

              <div className="sub-grid">
                <Detail label="పక్షం" value={pakshaText} icon="pi-moon" />
                <Detail label="వారం" value={vaaraText || "వివరాలు అందుబాటులో లేవు"} icon="pi-calendar" />
              </div>

              <div className="period-heading"><span>✦</span> శుభ సమయాలు <span>🪷</span></div>
              <div className="period-grid">
                <div className="period-row">
                  <span>అభిజిత్ ముహూర్తం</span>
                  <b>{isWednesday ? "బుధవారం నాడు వర్జ్యం" : getPeriodByName(auspiciousList, ["Abhijit Muhurat", "Abhijit"])}</b>
                </div>
                <div className="period-row">
                  <span>బ్రహ్మ ముహూర్తం</span>
                  <b>{getPeriodByName(auspiciousList, ["Brahma Muhurat", "Brahma"])}</b>
                </div>
                <div className="period-row">
                  <span>అమృత ఘడియలు</span>
                  <b>{getPeriodByName(auspiciousList, ["Amrit Kaal", "Amrita"])}</b>
                </div>
              </div>

              <div className="period-heading"><span>☾</span> అశుభ సమయాలు <span>⚠</span></div>
              <div className="period-grid">
                <div className="period-row">
                  <span>రాహుకాలం</span>
                  <b>{getPeriodByName(inauspiciousList, ["Rahu", "Rahu Kalam"])}</b>
                </div>
                <div className="period-row">
                  <span>యమగండం</span>
                  <b>{getPeriodByName(inauspiciousList, ["Yamaganda"])}</b>
                </div>
                <div className="period-row">
                  <span>గుళిక కాలం</span>
                  <b>{getPeriodByName(inauspiciousList, ["Gulika", "Gulika Kalam"])}</b>
                </div>
                <div className="period-row">
                  <span>దుర్ముహూర్తం</span>
                  <b>{getPeriodByName(inauspiciousList, ["Dur Muhurat"])}</b>
                </div>
                <div className="period-row">
                  <span>వర్జ్యం</span>
                  <b>{getPeriodByName(inauspiciousList, ["Varjyam"])}</b>
                </div>
              </div>

              <footer className="poster-footer">
                <span>ॐ శాంతిః శాంతిః శాంతిః ॐ</span>
                <small>మూలం: Prokerala Astrology API · Hyderabad · IST</small>
              </footer>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}