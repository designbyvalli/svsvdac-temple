import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { api } from "../api";

function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    nav = useNavigate();

  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      nav("/admin");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wrap page section">
      <form className="form-card admin-login" onSubmit={go}>
        <span className="eyebrow">SVSVDAC TEMPLE</span>
        <h1>Admin Login</h1>
        <label>
          Email
          <InputText
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <InputText
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err && <div className="notice error">{err}</div>}
        <Button type="submit" label="Sign in" loading={busy} block />
      </form>
    </section>
  );
}

function Panel() {
  const [bookings, setBookings] = useState([]),
    [poojas, setPoojas] = useState([]),
    [tab, setTab] = useState("bookings"),
    [err, setErr] = useState(""),
    [draft, setDraft] = useState({ name: "", description: "", price: "" }),
    [editing, setEditing] = useState(null),
    nav = useNavigate();

  const load = () =>
    Promise.all([api("/admin/bookings"), api("/admin/poojas")])
      .then(([b, p]) => {
        setBookings(b.bookings || []);
        setPoojas(p.poojas || []);
      })
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  const status = async (id, value) => {
    try {
      await api(`/admin/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api(editing ? `/admin/poojas/${editing}` : "/admin/poojas", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ ...draft, price: Number(draft.price) }),
      });
      setDraft({ name: "", description: "", price: "" });
      setEditing(null);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const edit = (p) => {
    setDraft({ name: p.name, description: p.description, price: p.price });
    setEditing(p.id);
    setTab("poojas");
  };

  const logout = async () => {
    await api("/admin/logout", { method: "POST" });
    nav("/admin/login");
  };

  const getFamilyMembers = (b) => {
    if (Array.isArray(b.members) && b.members.length > 0) {
      return b.members;
    }
    if (Array.isArray(b.familyMembers) && b.familyMembers.length > 0) {
      return b.familyMembers;
    }
    if (Array.isArray(b.names) && b.names.length > 0) {
      return b.names;
    }
    if (typeof b.familyDetails === "string" && b.familyDetails.trim()) {
      return b.familyDetails.split(/[\n,]+/).map((n) => ({ name: n.trim() }));
    }
    return [];
  };

  const printReceipt = (b) => {
    const formattedDate = new Date(b.date).toLocaleDateString("en-IN");
    const membersList = getFamilyMembers(b);

    const membersHtml =
      membersList.length > 0
        ? `
        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 3px;">DEVOTEES / FAMILY NAMES:</div>
        <table class="names-table">
          <thead>
            <tr>
              <th align="left">#</th>
              <th align="left">Name</th>
              <th align="right">Relation/Rasi</th>
            </tr>
          </thead>
          <tbody>
                 <td align="left">1.</td>
                 <td align="left"> ${b.devoteeName}</td>
         
            ${membersList
              .map(
                (m, idx) => `
              <tr>
              
                <td>${idx + 2}.</td>
                <td>${typeof m === "string" ? m : m.name || "-"}</td>
                <td align="right">${typeof m === "object" ? m.relation || m.star || m.rasi || "" : ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
        : "";

    const printWindow = window.open("", "_blank", "width=320,height=600");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${b.bookingNo}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              width: 48mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              font-family: monospace;
              font-size: 11px;
              line-height: 1.35;
              color: #000;
            }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .bold { font-weight: bold; }
            .title { font-size: 13px; font-weight: bold; }
            .names-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 2px; }
            .names-table th, .names-table td { padding: 1px 0; }
          </style>
        </head>
        <body>
          <div class="center title">SVSVDAC TEMPLE</div>
          <div class="center">POOJA SANKALPAM SLIP</div>
          <div class="divider"></div>
          <div><b>Receipt No:</b> ${b.bookingNo}</div>
          <div><b>Date:</b> ${formattedDate}</div>
          <div><b>Slot:</b> ${b.timeSlot || "N/A"}</div>
          <div class="divider"></div>
          <div><b>Pooja:</b> ${b.poojaName}</div>
          <div><b>Main Devotee:</b> ${b.devoteeName}</div>
          <div><b>Gotram:</b> ${b.gotram || "N/A"}</div>
          <div><b>Phone:</b> ${b.phone || "N/A"}</div>
          <div><b>City:</b> ${b.city || "N/A"}</div>
          ${membersHtml}
          <div class="divider"></div>
          <div class="row bold">
            <span>Amount Paid:</span>
            <span>₹${b.amount}</span>
          </div>
          <div class="divider"></div>
          
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
{/* <div class="center">Status: CONFIRMED</div>
          <div class="center" style="margin-top: 6px;">*** SARVE JANA SUKHINO BHAVANTU ***</div> */}
  const confirmedBookings = bookings.filter((b) => b.status === "Confirmed");

  return (
    <section className="wrap page section">
      <div className="admin-head">
        <div>
          <span className="eyebrow">MANAGEMENT CONSOLE</span>
          <h1>Admin Dashboard</h1>
          <p className="lead">Manage temple poojas and devotee bookings.</p>
        </div>
        <Button
          label="Logout"
          icon="pi pi-sign-out"
          severity="secondary"
          outlined
          onClick={logout}
        />
      </div>
      {err && <div className="notice error">{err}</div>}
      <div className="stats">
        <div>
          <small>Total Bookings</small>
          <b>{bookings.length}</b>
        </div>
        <div>
          <small>Pending</small>
          <b>{bookings.filter((b) => b.status === "Pending").length}</b>
        </div>
        <div>
          <small>Confirmed</small>
          <b>{confirmedBookings.length}</b>
        </div>
        <div>
          <small>Active Poojas</small>
          <b>{poojas.length}</b>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === "bookings" ? "active" : ""}
          onClick={() => setTab("bookings")}
        >
          All Bookings
        </button>
        <button
          className={tab === "confirmed" ? "active" : ""}
          onClick={() => setTab("confirmed")}
        >
          Confirmed Poojas
        </button>
        <button
          className={tab === "poojas" ? "active" : ""}
          onClick={() => setTab("poojas")}
        >
          Manage Poojas
        </button>
      </div>

      {tab === "bookings" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Devotee / Names</th>
                <th>Pooja / Date</th>
                <th>Gotram</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const members = getFamilyMembers(b);
                return (
                  <tr key={b.id}>
                    <td>
                      <b>{b.bookingNo}</b>
                      <small>{b.phone}</small>
                    </td>
                    <td>
                      <b>{b.devoteeName}</b>
                      <small>{b.city}</small>
                      {members.length > 0 && (
                        <small style={{ color: "#555" }}>
                          + {members.map((m) => (typeof m === "string" ? m : m.name)).join(", ")}
                        </small>
                      )}
                    </td>
                    <td>
                      {b.poojaName}
                      <small>
                        {new Date(b.date).toLocaleDateString("en-IN")} ·{" "}
                        {b.timeSlot}
                      </small>
                    </td>
                    <td>{b.gotram}</td>
                    <td>₹{b.amount}</td>
                    <td>
                      <span className={`status ${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={b.status}
                        onChange={(e) => status(b.id, e.target.value)}
                      >
                        {["Pending", "Confirmed", "Completed", "Cancelled"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          )
                        )}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!bookings.length && <div className="empty">No bookings yet.</div>}
        </div>
      )}

      {tab === "confirmed" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking No</th>
                <th>Primary Devotee</th>
                <th>Family / Extra Names</th>
                <th>Gotram</th>
                <th>Pooja</th>
                <th>Date & Slot</th>
                <th>Amount</th>
                <th>Print Slip</th>
              </tr>
            </thead>
            <tbody>
              {confirmedBookings.map((b) => {
                const members = getFamilyMembers(b);
                return (
                  <tr key={b.id}>
                    <td>
                      <b>{b.bookingNo}</b>
                      <small>{b.phone}</small>
                    </td>
                    <td>
                      <b>{b.devoteeName}</b>
                      <small>{b.city}</small>
                    </td>
                    <td>
                      {members.length > 0 ? (
                        <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
                          {members.map((m, idx) => (
                            <div key={idx}>
                              • {typeof m === "string" ? m : `${m.name}${m.relation ? ` (${m.relation})` : ""}`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <small style={{ color: "#888" }}>None</small>
                      )}
                    </td>
                    <td>{b.gotram}</td>
                    <td>{b.poojaName}</td>
                    <td>
                      {new Date(b.date).toLocaleDateString("en-IN")}
                      <small>{b.timeSlot}</small>
                    </td>
                    <td>₹{b.amount}</td>
                    <td>
                      <Button
                        icon="pi pi-print"
                        label="Print Slip"
                        size="small"
                        severity="success"
                        onClick={() => printReceipt(b)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!confirmedBookings.length && (
            <div className="empty">No confirmed bookings found.</div>
          )}
        </div>
      )}

      {tab === "poojas" && (
        <div className="manage-grid">
          <form className="form-card" onSubmit={save}>
            <h3>{editing ? "Edit Pooja" : "Add Pooja"}</h3>
            <label>
              Pooja Name
              <InputText
                required
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
            </label>
            <label>
              Description
              <InputTextarea
                rows={3}
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
              />
            </label>
            <label>
              Price (INR)
              <InputText
                required
                keyfilter="num"
                value={draft.price}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: e.target.value }))
                }
              />
            </label>
            <Button
              type="submit"
              label={editing ? "Save Changes" : "Add Pooja"}
            />
            {editing && (
              <Button
                type="button"
                label="Cancel"
                text
                onClick={() => {
                  setEditing(null);
                  setDraft({ name: "", description: "", price: "" });
                }}
              />
            )}
          </form>
          <div className="pooja-admin-list">
            {poojas.map((p) => (
              <div className="result-card" key={p.id}>
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <b>₹{p.price}</b>
                </div>
                <Button icon="pi pi-pencil" text onClick={() => edit(p)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Admin() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="*" element={<Panel />} />
    </Routes>
  );
}