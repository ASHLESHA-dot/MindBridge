const RESOURCE_TYPE_LABELS = {
  article: { label: "Article", icon: "📄" },
  video: { label: "Video", icon: "🎬" },
  book: { label: "Book", icon: "📚" },
  podcast: { label: "Podcast", icon: "🎧" },
  "therapy-tool": { label: "Therapy Tool", icon: "🧰" },
  app: { label: "App", icon: "📱" },
  "support-group": { label: "Support Group", icon: "🤝" },
  "professional-resource": { label: "Professional Resource", icon: "🧑‍⚕️" },
  "academic-paper": { label: "Academic Paper", icon: "📑" },
  "guided-meditation": { label: "Guided Meditation", icon: "🧘" },
  custom: { label: "Custom", icon: "✨" },
};

export default function ResourceCard({ resource, isAdmin = false, hasViewed = false, onOpen, onEdit, onDelete }) {
  const typeMeta = RESOURCE_TYPE_LABELS[resource.resourceType] || RESOURCE_TYPE_LABELS.custom;
  const addedByName = resource.addedByName || resource.addedBy?.displayName || resource.addedBy?.username || "Admin";
  const createdAt = resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : "Recently";

  return (
    <article
      className={`wellness-resource-card ${resource.featured ? "featured" : ""} ${hasViewed ? "visited" : ""}`}
      onClick={() => onOpen(resource)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(resource);
        }
      }}
    >
      <div className="wellness-resource-card-top">
        <div className="wellness-resource-media">
          {resource.thumbnail ? (
            <img src={resource.thumbnail} alt={resource.title} className="wellness-resource-thumbnail" loading="lazy" />
          ) : (
            <div className="wellness-resource-icon">{resource.icon || typeMeta.icon}</div>
          )}
        </div>

        <div className="wellness-resource-badges">
          {resource.featured && <span className="wellness-badge">📌 Featured</span>}
          {resource.verified && <span className="wellness-badge">✓ Verified</span>}
          {hasViewed && <span className="wellness-badge">👀 Viewed</span>}
        </div>
      </div>

      <div className="wellness-resource-body">
        <div className="wellness-resource-heading">
          <h4>{resource.title}</h4>
          <span className="wellness-badge">{typeMeta.icon} {typeMeta.label}</span>
        </div>

        <p className="wellness-resource-description">{resource.description}</p>

        <div className="wellness-resource-meta">
          <span>By {addedByName}</span>
          <span>{createdAt}</span>
        </div>

        <div className="wellness-resource-footer">
          <div className="wellness-resource-stats">
            <span className="wellness-badge">👁 {resource.viewCount || 0} views</span>
            <span className="wellness-badge">🏷 {resource.category}</span>
          </div>

          <button
            className="wellness-button-secondary wellness-resource-open"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(resource);
            }}
          >
            Open Resource
          </button>
        </div>

        {isAdmin && (
          <div className="wellness-resource-admin-actions">
            <button
              className="wellness-button-secondary"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(resource);
              }}
            >
              Edit
            </button>
            <button
              className="wellness-button-ghost"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(resource);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
