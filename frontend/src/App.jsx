import { useEffect, useRef, useState } from "react";
import "./App.css";

// Provide the starting values for a new equipment form.
const EMPTY_FORM = {
  name_alias: "",
  category: "",
  brand: "",
  serial_number: "",
  status: "available",
};

// This component owns the form values and the request to save them.
function AssetForm({ onSaved, onCancel }) {
  // Keep form values and save feedback in state so changes update the screen.
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Keep references to the first input and the current submission flag.
  const firstInput = useRef(null);
  const submitting = useRef(false);

  // Move keyboard focus to the first field when the form appears.
  useEffect(() => {
    firstInput.current?.focus();
  }, []);

  // Update the form value whose name matches the changed input.
  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Save the form without reloading the page or sending duplicate requests.
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    // Empty optional serial numbers are sent as null, not blank text.
    const equipment = {
      name_alias: form.name_alias.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      serial_number: form.serial_number.trim() || null,
      status: form.status,
    };

    // Stop before saving if a required field contains only spaces.
    if (!equipment.name_alias || !equipment.category || !equipment.brand) {
      setError("Alias, category and brand cannot contain only spaces.");
      return;
    }

    // Mark the save as running and clear any previous error.
    submitting.current = true;
    setSaving(true);
    setError("");

    try {
      // Send the equipment details to the backend as JSON.
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipment),
      });

      // Explain why the backend could not accept the equipment.
      if (!response.ok) {
        if (response.status === 409) {
          setError(
            "That serial number is already registered. Check it and try again.",
          );
        } else if (response.status === 422) {
          setError(
            "The server rejected these details. Check the fields and try again.",
          );
        } else {
          setError(
            "The server could not save the equipment. Please try again later.",
          );
        }
        return;
      }

      // Use the saved record returned by the backend, including its ID.
      const savedAsset = await response.json();
      onSaved(savedAsset);
    } catch {
      // Warn that a connection problem left the save result uncertain.
      setError(
        "Could not confirm the save. Check the backend, then cancel and refresh the list before trying again.",
      );
    } finally {
      // Allow another submission after the request finishes.
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <form
      id="asset-form"
      className="asset-form"
      aria-labelledby="form-title"
      onSubmit={handleSubmit}
    >
      <h3 id="form-title">New equipment</h3>
      <p className="form-hint">Alias, category and brand are required.</p>

      {/* Group the equipment fields and disable them while saving. */}
      <fieldset disabled={saving}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="name_alias">Alias</label>
            <input
              ref={firstInput}
              id="name_alias"
              name="name_alias"
              required
              value={form.name_alias}
              onChange={updateField}
              placeholder="Reception laptop"
            />
          </div>
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              name="category"
              required
              value={form.category}
              onChange={updateField}
              placeholder="Laptop"
            />
          </div>
          <div className="form-field">
            <label htmlFor="brand">Brand</label>
            <input
              id="brand"
              name="brand"
              required
              value={form.brand}
              onChange={updateField}
              placeholder="Lenovo"
            />
          </div>
          <div className="form-field">
            <label htmlFor="serial_number">
              Serial number <span>(optional)</span>
            </label>
            <input
              id="serial_number"
              name="serial_number"
              value={form.serial_number}
              onChange={updateField}
              placeholder="DEMO-SN-001"
            />
          </div>
          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={updateField}
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>
        </div>

        {/* Show a form error only when there is a message to display. */}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {/* Let the user save the equipment or close the form. */}
        <div className="form-actions">
          <button className="button button-primary" type="submit">
            {saving ? "Saving…" : "Save equipment"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}

// Display the equipment register and coordinate the list and new-item form.
function App() {
  // Keep loaded equipment and page feedback in state to update the display.
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  // Remember the Add equipment button so focus can return to it.
  const addButton = useRef(null);

  // Load saved equipment when the page opens; cancel if it is removed.
  useEffect(() => {
    const controller = new AbortController();

    // Request the saved equipment and show an error if loading fails.
    async function loadAssets() {
      try {
        const response = await fetch("/api/assets", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Equipment request failed.");
        const data = await response.json();
        if (!Array.isArray(data))
          throw new Error("Expected a list of equipment.");
        if (!controller.signal.aborted) setAssets(data);
      } catch (requestError) {
        if (!controller.signal.aborted && requestError.name !== "AbortError") {
          setError(
            "Could not load equipment. Check that the backend is running, then try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAssets();
    return () => controller.abort();
  }, []);

  // Derive counts from the same equipment list used by the table.
  const availableCount = assets.filter(
    (asset) => asset.status === "available",
  ).length;
  const assignedCount = assets.filter(
    (asset) => asset.status === "assigned",
  ).length;

  // Hide the form and return keyboard focus to the Add equipment button.
  function closeForm() {
    setShowForm(false);
    addButton.current?.focus();
  }

  // Add the saved asset to the list and show a confirmation message.
  function handleSaved(asset) {
    setAssets((current) => [...current, asset]);
    setSuccess(`${asset.name_alias} was added.`);
    closeForm();
  }

  return (
    <main className="app">
      {/* Show the application name and a short description. */}
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">
          AD
        </div>
        <div>
          <p className="eyebrow">EQUIPMENT REGISTER</p>
          <h1>AssetDesk</h1>
          <p className="subtitle">
            A clear view of your equipment and its availability.
          </p>
        </div>
      </header>

      {/* Show equipment totals after the list loads successfully. */}
      {!loading && !error && (
        <section className="summary" aria-label="Equipment summary">
          <div className="summary-card">
            <span>Total equipment</span>
            <strong>{assets.length}</strong>
          </div>
          <div className="summary-card">
            <span>Available</span>
            <strong>{availableCount}</strong>
          </div>
          <div className="summary-card">
            <span>Assigned</span>
            <strong>{assignedCount}</strong>
          </div>
        </section>
      )}

      {/* Confirm a successful save when a confirmation message exists. */}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}

      {/* Group the equipment actions, form and saved records. */}
      <section className="equipment-panel" aria-labelledby="equipment-title">
        <div className="panel-heading">
          <div>
            <h2 id="equipment-title">Equipment</h2>
            <p>Your registered devices, all in one place.</p>
          </div>
          <button
            ref={addButton}
            className="button button-primary"
            type="button"
            disabled={loading || Boolean(error)}
            aria-expanded={showForm}
            aria-controls="asset-form"
            onClick={() => {
              setSuccess("");
              setShowForm(true);
            }}
          >
            + Add equipment
          </button>
        </div>

        {/* Open the form only after the user chooses to add equipment. */}
        {showForm && <AssetForm onSaved={handleSaved} onCancel={closeForm} />}

        {/* Tell the user when the equipment request is still running. */}
        {loading && (
          <p className="message" role="status">
            Loading equipment…
          </p>
        )}

        {/* Offer a page reload when loading the equipment fails. */}
        {error && (
          <div className="error-message">
            <p role="alert">{error}</p>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {/* Explain how to get started when no equipment has been saved. */}
        {!loading && !error && assets.length === 0 && (
          <div className="message empty-state">
            <h3>No equipment yet</h3>
            <p>Use Add equipment to register your first device.</p>
          </div>
        )}

        {/* Show the equipment table after records load successfully. */}
        {!loading && !error && assets.length > 0 && (
          <div
            className="table-container"
            role="region"
            aria-label="Equipment records"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Equipment</th>
                  <th scope="col">Category</th>
                  <th scope="col">Brand</th>
                  <th scope="col">Serial number</th>
                  <th scope="col">Status</th>
                  <th scope="col">Added</th>
                </tr>
              </thead>
              <tbody>
                {/* Create one table row for each saved asset. */}
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <span className="asset-name">{asset.name_alias}</span>
                      <span className="asset-id">ID {asset.id}</span>
                    </td>
                    <td>{asset.category}</td>
                    <td>{asset.brand}</td>
                    <td className="serial-number">
                      {asset.serial_number ?? "Not provided"}
                    </td>
                    <td>
                      <span className={`status-badge ${asset.status}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="date">
                      <time dateTime={asset.created_at}>
                        {new Date(asset.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            timeZone: "Europe/Athens",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer className="page-footer">AssetDesk · IT equipment register</footer>
    </main>
  );
}

export default App;
