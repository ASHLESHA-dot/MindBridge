import { useEffect, useState } from "react";

const RESOURCE_TYPE_OPTIONS = [
  { value: "article", label: "Article / Blog Post", icon: "📄" },
  { value: "video", label: "Video / YouTube", icon: "🎬" },
  { value: "book", label: "Book / eBook", icon: "📚" },
  { value: "podcast", label: "Podcast", icon: "🎧" },
  { value: "therapy-tool", label: "Therapy Tool", icon: "🧰" },
  { value: "app", label: "App / Software", icon: "📱" },
  { value: "support-group", label: "Support Group", icon: "🤝" },
  { value: "professional-resource", label: "Professional Resource", icon: "🧑‍⚕️" },
  { value: "academic-paper", label: "Academic Paper", icon: "📑" },
  { value: "guided-meditation", label: "Guided Meditation", icon: "🧘" },
  { value: "custom", label: "Custom Category", icon: "✨" },
];

const CATEGORY_OPTIONS = [
  "Mental Health",
  "Meditation",
  "Therapy",
  "Self Care",
  "Crisis Support",
  "Productivity",
  "Relationships",
  "Mindfulness",
  "Support Groups",
  "Professional Resources",
  "Academic Papers",
  "Custom Category",
];

const emptyForm = {
  title: "",
  description: "",
  url: "",
  resourceType: "article",
  category: "Mental Health",
  customCategory: "",
  featured: false,
  verified: false,
  thumbnail: "",
};

export default function AddResource({ isOpen, resource, onClose, onSave, saving = false }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setError("");
      return;
    }

    if (resource) {
      const categoryIsSupported = CATEGORY_OPTIONS.includes(resource.category);

      setForm({
        title: resource.title || "",
        description: resource.description || "",
        url: resource.url || "",
        resourceType: resource.resourceType || "article",
        category: categoryIsSupported ? resource.category : "Custom Category",
        customCategory: categoryIsSupported ? "" : (resource.category || ""),
        featured: Boolean(resource.featured),
        verified: Boolean(resource.verified),
        thumbnail: resource.thumbnail || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, resource]);

  if (!isOpen) {
    return null;
  }

  const selectedResourceType = RESOURCE_TYPE_OPTIONS.find((option) => option.value === form.resourceType);
  const isCustomCategory = form.category === "Custom Category";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const resolvedCategory = isCustomCategory ? form.customCategory.trim() : form.category.trim();

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!form.url.trim()) {
      setError("URL is required.");
      return;
    }

    if (form.description.trim().length < 100 || form.description.trim().length > 500) {
      setError("Description must be between 100 and 500 characters.");
      return;
    }

    if (!resolvedCategory) {
      setError("Category is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      resourceType: form.resourceType,
      category: resolvedCategory,
      featured: form.featured,
      verified: form.verified,
      thumbnail: form.thumbnail.trim(),
    };

    await onSave(payload);
  };

  return (
    <div className="wellness-modal-backdrop" role="dialog" aria-modal="true" aria-label={resource ? "Edit resource" : "Add resource"}>
      <div className="wellness-modal wellness-resource-modal">
        <div className="wellness-card-header">
          <div className="wellness-card-title">
            <span className="wellness-label">Circle Resources</span>
            <h3>{resource ? "Edit Resource" : "Add Resource"}</h3>
            <p className="wellness-muted">Curate helpful links for circle members with validation, featured pinning, and analytics.</p>
          </div>
          <button className="wellness-button-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="wellness-form-stack" onSubmit={handleSubmit}>
          <div className="wellness-form-grid">
            <label>
              <div className="wellness-form-label">Title</div>
              <input
                className="wellness-input"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Resource title"
                required
              />
            </label>

            <label>
              <div className="wellness-form-label">URL</div>
              <input
                className="wellness-input"
                type="url"
                value={form.url}
                onChange={(event) => updateField("url", event.target.value)}
                placeholder="https://..."
                required
              />
            </label>

            <label>
              <div className="wellness-form-label">Resource Type</div>
              <select
                className="wellness-select"
                value={form.resourceType}
                onChange={(event) => updateField("resourceType", event.target.value)}
              >
                {RESOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div className="wellness-form-label">Category</div>
              <select
                className="wellness-select"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {isCustomCategory && (
              <label>
                <div className="wellness-form-label">Custom Category Name</div>
                <input
                  className="wellness-input"
                  value={form.customCategory}
                  onChange={(event) => updateField("customCategory", event.target.value)}
                  placeholder="Enter custom category"
                  required
                />
              </label>
            )}

            <label>
              <div className="wellness-form-label">Thumbnail URL</div>
              <input
                className="wellness-input"
                type="url"
                value={form.thumbnail}
                onChange={(event) => updateField("thumbnail", event.target.value)}
                placeholder="Optional thumbnail image URL"
              />
            </label>

            <label>
              <div className="wellness-form-label">Description</div>
              <textarea
                className="wellness-textarea"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Describe what this resource is and why it is helpful. Use 100 to 500 characters."
                minLength={100}
                maxLength={500}
                required
              />
            </label>
          </div>

          <div className="wellness-pill-row">
            <label className="wellness-badge">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => updateField("featured", event.target.checked)}
              />
              Featured / pinned
            </label>
            <label className="wellness-badge">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(event) => updateField("verified", event.target.checked)}
              />
              Verified
            </label>
            {selectedResourceType && <span className="wellness-badge">{selectedResourceType.icon} {selectedResourceType.label}</span>}
          </div>

          {error && <div className="wellness-empty-state" style={{ textAlign: "left" }}>{error}</div>}

          <div className="wellness-actions" style={{ justifyContent: "flex-end" }}>
            <button className="wellness-button-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="wellness-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : resource ? "Update Resource" : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
