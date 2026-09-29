import React from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
export default function PoojaCard({ pooja, lang = "en" }) {
  return (
    <article className="pooja-card">
      <div className="pooja-symbol">
        <i className="pi pi-sun" />
      </div>
      <div className="pooja-body">
        <span className="eyebrow">
          {lang === "te" ? "దైవ సేవ" : "TEMPLE SEVA"}
        </span>
        <h3>{pooja.name}</h3>
        <p>{pooja.description}</p>
        <div className="card-bottom">
          <strong>₹{Number(pooja.price).toLocaleString("en-IN")}</strong>
          <Link to={`/book/${pooja.id}`}>
            <Button
              label={lang === "te" ? "బుక్ చేయండి" : "Book Pooja"}
              icon="pi pi-arrow-up-right"
              size="small"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
