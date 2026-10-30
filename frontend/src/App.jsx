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

// Build empty values for adding or current values for editing.
function getFormValues(asset) {
  if (!asset) return EMPTY_FORM;

  return {
    name_alias: asset.name_alias,
    category: asset.category,
    brand: asset.brand,
    serial_number: asset.serial_number ?? "",
    status: asset.status,
  };
}

// This component owns the form values and the request to save them.
function AssetForm({ asset, onSaved, onCancel, onSavingChange }) {
  const editing = Boolean(asset);

  // Keep form values and save feedback in state so changes update the screen.
  const [form, setForm] = useState(() => getFormValues(asset));
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

    // Keep Add and Edit buttons disabled until the save finishes.
    onSavingChange(true);

    try {
      // Send the equipment details to the backend as JSON.
      // Use PUT for an existing asset and POST for new equipment.
      const response = await fetch(
        editing ? `/api/assets/${asset.id}` : "/api/assets",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(equipment),
        },
      );

      // Explain why the backend could not accept the equipment.
      if (!response.ok) {
        if (response.status === 409) {
          setError(
            "That serial number is already registered. Check it and try again.",
          );
        } else if (editing && response.status === 404) {
          setError(
            "This equipment no longer exists. Cancel and refresh the list.",
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
      onSavingChange(false);
    }
  }

  return (
    <form
      id="asset-form"
      className="asset-form"
      aria-labelledby="form-title"
      onSubmit={handleSubmit}
    >
      <h3 id="form-title">
        {editing ? "Edit equipment" : "New equipment"}
      </h3>
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
            {saving
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Save equipment"}
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
  // Store the selected asset, or null when adding new equipment.
  const [editingAsset, setEditingAsset] = useState(null);
  // Let the form lock Add and Edit buttons while a save is running.
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  // Track deletion progress and errors without hiding the equipment list.
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Block repeated deletion requests before React updates the buttons.
  const deletingRequest = useRef(false);
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
    setEditingAsset(null);
    addButton.current?.focus();
  }

  // Open the form with the selected asset's current values.
  function openEditForm(asset) {
    setSuccess("");
    setDeleteError("");
    setEditingAsset(asset);
    setShowForm(true);
  }

  // Add the saved asset to the list and show a confirmation message.
  // Replace the matching item instead when an existing asset was edited.
  function handleSaved(asset) {
    if (editingAsset) {
      setAssets((current) =>
        current.map((item) => (item.id === asset.id ? asset : item)),
      );
      setSuccess(`${asset.name_alias} was updated.`);
    } else {
      setAssets((current) => [...current, asset]);
      setSuccess(`${asset.name_alias} was added.`);
    }
    closeForm();
  }

  // Confirm permanent deletion before sending any request to the backend.
  async function handleDelete(asset) {
    if (saving || deletingRequest.current || showForm) return;

    const confirmed = window.confirm(
      `Delete "${asset.name_alias}"? This deletion is permanent.`,
    );
    if (!confirmed) return;

    // Lock all row actions and clear feedback from previous requests.
    deletingRequest.current = true;
    setDeleting(true);
    setDeleteError("");
    setSuccess("");

    try {
      // Ask the backend to delete only the selected asset.
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });

      // Keep the row and explain why the server could not delete it.
      if (!response.ok) {
        if (response.status === 404) {
          setDeleteError(
            "This equipment no longer exists. Refresh the list to update it.",
          );
        } else {
          setDeleteError(
            "The server could not delete the equipment. Please try again later.",
          );
        }
        return;
      }

      // Remove the row after success without reading JSON from the empty response.
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setSuccess(`${asset.name_alias} was deleted.`);
    } catch {
      // Keep the row when a connection problem leaves the result uncertain.
      setDeleteError(
        "Could not confirm the deletion. Refresh the list before trying again.",
      );
    } finally {
      // Unlock the actions after the deletion request finishes.
      deletingRequest.current = false;
      setDeleting(false);
    }
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
            disabled={loading || Boolean(error) || saving || deleting}
            aria-expanded={showForm}
            aria-controls="asset-form"
            onClick={() => {
              setSuccess("");
              setDeleteError("");
              setEditingAsset(null);
              setShowForm(true);
            }}
          >
            + Add equipment
          </button>
        </div>

        {/* Open the form only after the user chooses to add equipment. */}
        {/* Recreate the form when switching between adding and editing assets. */}
        {showForm && (
          <AssetForm
            key={editingAsset ? `edit-${editingAsset.id}` : "add"}
            asset={editingAsset}
            onSaved={handleSaved}
            onCancel={closeForm}
            onSavingChange={setSaving}
          />
        )}

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

        {/* Show deletion errors without removing any rows from the display. */}
        {deleteError && (
          <p className="error-message" role="alert">
            {deleteError}
          </p>
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
                  <th scope="col">Actions</th>
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
                    {/* Open this asset in the shared equipment form. */}
                    <td>
                      <button
                        className="button button-secondary table-action"
                        type="button"
                        disabled={saving || deleting}
                        onClick={() => openEditForm(asset)}
                      >
                        Edit
                      </button>
                      {/* Allow deletion only when no form or request is active. */}
                      <button
                        className="button button-secondary table-action"
                        type="button"
                        disabled={saving || deleting || showForm}
                        onClick={() => handleDelete(asset)}
                      >
                        Delete
                      </button>
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
