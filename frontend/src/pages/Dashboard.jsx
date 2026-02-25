import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { clearToken } from "../utils/auth";
import { getErrorMessage } from "../utils/http";
import CreateTaskModal from "../features/dashboard/CreateTaskModal";
import TaskCard from "../features/dashboard/TaskCard";
import Navbar from "../components/Navbar";
import {
  ALL_CATEGORY_ID,
  CATEGORY_NAME_LIMIT,
  COMPLETION_TOAST_DURATION_MS,
  CREATE_NEW_CATEGORY_ID,
} from "../features/dashboard/constants";
import {
  formatDate,
  getTaskCategoryId,
  getTaskCategoryName,
  sortCategoriesByName,
  toTimestamp,
} from "../features/dashboard/utils";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORY_ID);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [menuTaskId, setMenuTaskId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [completionToast, setCompletionToast] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTaskSubmitting, setIsCreateTaskSubmitting] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategorySelection, setCreateCategorySelection] = useState(ALL_CATEGORY_ID);
  const [createCategoryName, setCreateCategoryName] = useState("");

  const navigate = useNavigate();

  const closeMenu = () => setMenuTaskId("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([API.get("/tasks"), API.get("/categories")])
      .then(([tasksResponse, categoriesResponse]) => {
        if (!isMounted) {
          return;
        }

        setTasks(tasksResponse.data);
        setCategories(sortCategoriesByName(categoriesResponse.data));
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error, "Could not load dashboard data right now."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryFilters = useMemo(
    () => [{ _id: ALL_CATEGORY_ID, name: "All Tasks" }, ...categories],
    [categories]
  );

  const filteredTasks = useMemo(() => {
    if (activeCategoryId === ALL_CATEGORY_ID) {
      return tasks;
    }

    return tasks.filter((task) => getTaskCategoryId(task) === activeCategoryId);
  }, [activeCategoryId, tasks]);

  const orderedTasks = useMemo(() => {
    return [...filteredTasks].sort((firstTask, secondTask) => {
      if (firstTask.status !== secondTask.status) {
        return firstTask.status === "completed" ? 1 : -1;
      }

      return toTimestamp(secondTask.updatedAt) - toTimestamp(firstTask.updatedAt);
    });
  }, [filteredTasks]);

  const activeCategoryName = useMemo(() => {
    const activeCategory = categoryFilters.find((category) => category._id === activeCategoryId);
    return activeCategory ? activeCategory.name : "All Tasks";
  }, [activeCategoryId, categoryFilters]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks]
  );

  const pendingCount = tasks.length - completedCount;

  useEffect(() => {
    if (!completionToast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setCompletionToast("");
    }, COMPLETION_TOAST_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [completionToast]);

  useEffect(() => {
    if (!menuTaskId) {
      return undefined;
    }

    const handleDocumentPointerDown = (event) => {
      const target = event.target;

      if (!(target instanceof Element) || !target.closest(".task-menu-container")) {
        setMenuTaskId("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuTaskId("");
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuTaskId]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCreateModalOpen]);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const openCreateModal = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateCategorySelection(ALL_CATEGORY_ID);
    setCreateCategoryName("");
    closeMenu();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!isCreateTaskSubmitting) {
      setIsCreateModalOpen(false);
    }
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    closeMenu();
    setErrorMessage("");
    setInfoMessage("");
  };

  const cancelEditing = () => {
    setEditingTaskId("");
    setEditTitle("");
    setEditDescription("");
  };

  const resolveCategoryForTaskCreation = async () => {
    if (createCategorySelection === ALL_CATEGORY_ID) {
      return null;
    }

    if (createCategorySelection === CREATE_NEW_CATEGORY_ID) {
      const trimmedCategoryName = createCategoryName.trim();

      if (!trimmedCategoryName) {
        throw new Error("New category name is required.");
      }

      if (trimmedCategoryName.length > CATEGORY_NAME_LIMIT) {
        throw new Error(`Category name must be ${CATEGORY_NAME_LIMIT} characters or less.`);
      }

      const { data: createdCategory } = await API.post("/categories", {
        name: trimmedCategoryName,
      });

      setCategories((currentCategories) =>
        sortCategoriesByName([...currentCategories, createdCategory])
      );

      return createdCategory._id;
    }

    return createCategorySelection;
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const trimmedTitle = createTitle.trim();
    const trimmedDescription = createDescription.trim();

    if (!trimmedTitle) {
      setErrorMessage("Task title is required.");
      return;
    }

    try {
      setIsCreateTaskSubmitting(true);

      const categoryId = await resolveCategoryForTaskCreation();

      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
      };

      if (categoryId) {
        payload.category = categoryId;
      }

      const { data: createdTask } = await API.post("/tasks", payload);

      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setCompletionToast("Task created");
      setInfoMessage("Task created.");
      setIsCreateModalOpen(false);
    } catch (error) {
      if (error instanceof Error && !error.response) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(getErrorMessage(error, "Unable to create task."));
      }
    } finally {
      setIsCreateTaskSubmitting(false);
    }
  };

  const handleSaveEdit = async (taskId) => {
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      setErrorMessage("Title cannot be empty.");
      return;
    }

    try {
      setBusyTaskId(taskId);

      const { data } = await API.put(`/tasks/${taskId}`, {
        title: trimmedTitle,
        description: editDescription.trim(),
      });

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task._id === taskId ? data : task))
      );

      cancelEditing();
      setInfoMessage("Task updated.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to update task."));
    } finally {
      setBusyTaskId("");
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === "pending" ? "completed" : "pending";

    try {
      setBusyTaskId(task._id);

      const { data } = await API.put(`/tasks/${task._id}`, {
        status: nextStatus,
      });

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) => (currentTask._id === task._id ? data : currentTask))
      );

      const nextMessage =
        nextStatus === "completed" ? "Task marked complete" : "Task moved to pending";

      setInfoMessage(`${nextMessage}.`);
      setCompletionToast(nextMessage);
      closeMenu();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to update task status."));
    } finally {
      setBusyTaskId("");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      setBusyTaskId(taskId);

      await API.delete(`/tasks/${taskId}`);
      setTasks((currentTasks) => currentTasks.filter((task) => task._id !== taskId));

      if (editingTaskId === taskId) {
        cancelEditing();
      }

      setInfoMessage("Task deleted.");
      closeMenu();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to delete task."));
    } finally {
      setBusyTaskId("");
    }
  };

  return (
    <>
      <Navbar />{
      <div className="dashboard-page">
      <div className="ambient ambient-three" />

      <div className={`dashboard-shell ${isCreateModalOpen ? "is-blurred" : ""}`}>
        <header className="panel dashboard-header">
          <div>
            <p className="dashboard-eyebrow">SocioSpace</p>
            <h1 className="dashboard-title">Your Drafts</h1>
          </div>

          <div className="dashboard-stats">
            <div>
              <span className="stat-label">Total</span>
              <strong>{tasks.length}</strong>
            </div>
            <div>
              <span className="stat-label">Pending</span>
              <strong>{pendingCount}</strong>
            </div>
            <div>
              <span className="stat-label">Done</span>
              <strong>{completedCount}</strong>
            </div>
            <button className="btn btn-create" onClick={openCreateModal} type="button">
              <span className="plus-glyph" aria-hidden="true">
                +
              </span>
              Create
            </button>
          </div>
        </header>

        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}
        {infoMessage ? <p className="notice info">{infoMessage}</p> : null}

        <div className="dashboard-grid dashboard-grid-single">
          <section className="panel board-panel board-panel-full">
            <div className="board-header board-header-column">
              <h2>{activeCategoryName}</h2>
              <p className="board-subtitle">Showing {orderedTasks.length} tasks</p>
            </div>

            <div className="category-strip" role="tablist" aria-label="Task categories">
              {categoryFilters.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryId === category._id}
                  className={`category-chip ${activeCategoryId === category._id ? "active" : ""}`}
                  onClick={() => setActiveCategoryId(category._id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {isLoading ? <p className="empty-state">Loading tasks...</p> : null}

            {!isLoading && orderedTasks.length === 0 ? (
              <p className="empty-state">No tasks for this category yet.</p>
            ) : null}

            <div className="task-list">
              {orderedTasks.map((task) => {
                const isEditing = editingTaskId === task._id;
                const isBusy = busyTaskId === task._id;

                return (
                  <TaskCard
                    key={task._id}
                    task={task}
                    isEditing={isEditing}
                    isBusy={isBusy}
                    isMenuOpen={menuTaskId === task._id}
                    editTitle={editTitle}
                    editDescription={editDescription}
                    onToggleStatus={handleToggleStatus}
                    onToggleMenu={(taskId) =>
                      setMenuTaskId((currentMenuTaskId) =>
                        currentMenuTaskId === taskId ? "" : taskId
                      )
                    }
                    onStartEdit={startEditingTask}
                    onDelete={handleDelete}
                    onEditTitleChange={setEditTitle}
                    onEditDescriptionChange={setEditDescription}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={cancelEditing}
                    getTaskCategoryName={getTaskCategoryName}
                    formatDate={formatDate}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        isSubmitting={isCreateTaskSubmitting}
        onClose={closeCreateModal}
        onSubmit={handleCreateTask}
        createTitle={createTitle}
        onCreateTitleChange={setCreateTitle}
        createDescription={createDescription}
        onCreateDescriptionChange={setCreateDescription}
        createCategorySelection={createCategorySelection}
        onCreateCategorySelectionChange={setCreateCategorySelection}
        createCategoryName={createCategoryName}
        onCreateCategoryNameChange={setCreateCategoryName}
        categories={categories}
      />

      {completionToast ? <div className="status-toast">{completionToast}</div> : null}
    </div>
    }
  </>
  );
}

export default Dashboard;
