import {
  ALL_CATEGORY_ID,
  CATEGORY_NAME_LIMIT,
  CREATE_NEW_CATEGORY_ID,
} from "./constants";

function CreateTaskModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  createTitle,
  onCreateTitleChange,
  createDescription,
  onCreateDescriptionChange,
  createCategorySelection,
  onCreateCategorySelectionChange,
  createCategoryName,
  onCreateCategoryNameChange,
  categories,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="create-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="create-modal-header">
          <div>
            <p className="auth-eyebrow">Create +</p>
            <h2 id="create-task-title">Create Task</h2>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="task-form" onSubmit={onSubmit}>
          <label className="input-label" htmlFor="create-task-title-input">
            Title
          </label>
          <input
            id="create-task-title-input"
            className="input-field"
            type="text"
            value={createTitle}
            onChange={(event) => onCreateTitleChange(event.target.value)}
            placeholder="Plan release notes"
            autoFocus
          />

          <label className="input-label" htmlFor="create-task-description-input">
            Description
          </label>
          <textarea
            id="create-task-description-input"
            className="input-field text-area"
            value={createDescription}
            onChange={(event) => onCreateDescriptionChange(event.target.value)}
            placeholder="Add context, blockers, and checklist"
          />

          <label className="input-label" htmlFor="create-task-category-select">
            Category
          </label>
          <select
            id="create-task-category-select"
            className="input-field"
            value={createCategorySelection}
            onChange={(event) => onCreateCategorySelectionChange(event.target.value)}
          >
            <option value={ALL_CATEGORY_ID}>All Tasks</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
            <option value={CREATE_NEW_CATEGORY_ID}>Create category...</option>
          </select>

          {createCategorySelection === CREATE_NEW_CATEGORY_ID ? (
            <>
              <label className="input-label" htmlFor="create-new-category-input">
                New Category Name
              </label>
              <input
                id="create-new-category-input"
                className="input-field"
                type="text"
                maxLength={CATEGORY_NAME_LIMIT}
                value={createCategoryName}
                onChange={(event) => onCreateCategoryNameChange(event.target.value)}
                placeholder="Work, Personal, Deep Focus"
              />
              <p className="modal-hint">New categories are created while creating the task.</p>
            </>
          ) : null}

          <div className="create-modal-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create +"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CreateTaskModal;
