function TaskCard({
  task,
  isEditing,
  isBusy,
  isMenuOpen,
  editTitle,
  editDescription,
  onToggleStatus,
  onToggleMenu,
  onStartEdit,
  onDelete,
  onEditTitleChange,
  onEditDescriptionChange,
  onSaveEdit,
  onCancelEdit,
  getTaskCategoryName,
  formatDate,
}) {
  return (
    <article className={`task-card ${task.status === "completed" ? "is-completed" : ""}`}>
      <div className="task-card-top">
        <label className="task-check">
          <input
            type="checkbox"
            checked={task.status === "completed"}
            onChange={() => onToggleStatus(task)}
            disabled={isBusy}
          />
          <span>{task.status === "completed" ? "Completed" : "Mark complete"}</span>
        </label>

        <div className="task-top-right">
          <span className="task-time">Updated {formatDate(task.updatedAt)}</span>
          {!isEditing ? (
            <div className="task-menu-container">
              <button
                className="menu-trigger"
                type="button"
                aria-label="Task options"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-controls={`task-menu-${task._id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMenu(task._id);
                }}
              >
                <span className="menu-trigger-glyph" aria-hidden="true">
                  ⋮
                </span>
              </button>
              {isMenuOpen ? (
                <div className="task-menu" role="menu" id={`task-menu-${task._id}`}>
                  <button type="button" role="menuitem" onClick={() => onStartEdit(task)} disabled={isBusy}>
                    Edit
                  </button>
                  <button
                    className="danger-item"
                    type="button"
                    role="menuitem"
                    onClick={() => onDelete(task._id)}
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="task-edit-mode">
          <input
            className="input-field"
            value={editTitle}
            onChange={(event) => onEditTitleChange(event.target.value)}
            placeholder="Task title"
          />
          <textarea
            className="input-field text-area"
            value={editDescription}
            onChange={(event) => onEditDescriptionChange(event.target.value)}
            placeholder="Task description"
          />
          <div className="task-actions">
            <button className="btn btn-primary" onClick={() => onSaveEdit(task._id)} type="button" disabled={isBusy}>
              {isBusy ? "Saving..." : "Save"}
            </button>
            <button className="btn btn-ghost" onClick={onCancelEdit} type="button" disabled={isBusy}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3>{task.title}</h3>
          <p className="task-category-tag">{getTaskCategoryName(task)}</p>
          {task.description ? (
            <p className="task-description">{task.description}</p>
          ) : (
            <p className="task-description empty">No description</p>
          )}
        </>
      )}
    </article>
  );
}

export default TaskCard;
