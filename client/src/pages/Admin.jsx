import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
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
          <b>{bookings.filter((b) => b.status === "Confirmed").length}</b>
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
          Bookings
        </button>
        <button
          className={tab === "poojas" ? "active" : ""}
          onClick={() => setTab("poojas")}
        >
          Manage Poojas
        </button>
      </div>
      {tab === "bookings" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Devotee</th>
                <th>Pooja / Date</th>
                <th>Gotram</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <b>{b.bookingNo}</b>
                    <small>{b.phone}</small>
                  </td>
                  <td>
                    {b.devoteeName}
                    <small>{b.city}</small>
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
                        ),
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!bookings.length && <div className="empty">No bookings yet.</div>}
        </div>
      ) : (
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
