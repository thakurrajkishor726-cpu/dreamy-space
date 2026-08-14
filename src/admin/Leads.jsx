import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";

/**
 * Enquiries from the public contact form.
 *
 * Read-only apart from marking one handled or deleting it — these rows are
 * other people's contact details, so the fewer things that can touch them the
 * better.
 */
export default function Leads() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    api
      .listLeads()
      .then(setLeads)
      .catch((err) => {
        setError(err.message);
        setLeads([]);
      });
  };

  useEffect(load, []);

  const toggle = async (lead) => {
    setBusyId(lead.id);
    try {
      await api.setLeadHandled(lead.id, !lead.handled);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (lead) => {
    if (!window.confirm(`Delete the enquiry from ${lead.name}? This cannot be undone.`)) return;
    setBusyId(lead.id);
    try {
      await api.deleteLead(lead.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const pending = (leads || []).filter((lead) => !lead.handled).length;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Enquiries</h1>
          <p className="admin-muted small mb-0">
            {leads === null
              ? "Loading…"
              : `${leads.length} total, ${pending} still to answer.`}
          </p>
        </div>
      </header>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {leads !== null && leads.length === 0 && !error && (
        <p className="admin-muted">No enquiries yet.</p>
      )}

      <div className="admin-leads">
        {(leads || []).map((lead) => (
          <article className={`admin-lead ${lead.handled ? "is-handled" : ""}`} key={lead.id}>
            <div className="admin-lead__head">
              <div>
                <h2 className="admin-lead__name">{lead.name}</h2>
                <p className="admin-muted small mb-0">
                  {new Date(lead.created_at).toLocaleString()}
                  {lead.service ? ` · ${lead.service}` : ""}
                </p>
              </div>
              <div className="admin-lead__actions">
                <button
                  className="admin-btn admin-btn--ghost"
                  onClick={() => toggle(lead)}
                  disabled={busyId === lead.id}
                >
                  {lead.handled ? "Reopen" : "Mark handled"}
                </button>
                <button
                  className="admin-btn admin-btn--danger"
                  onClick={() => remove(lead)}
                  disabled={busyId === lead.id}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="admin-lead__contact">
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
              {lead.phone && <a href={`tel:${lead.phone}`}>{lead.phone}</a>}
            </div>

            {lead.message && <p className="admin-lead__message">{lead.message}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
