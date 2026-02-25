export const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export const toTimestamp = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const getTaskCategoryId = (task) => {
  if (!task || !task.category) {
    return "";
  }

  if (typeof task.category === "string") {
    return task.category;
  }

  if (typeof task.category === "object" && task.category._id) {
    return String(task.category._id);
  }

  return "";
};

export const getTaskCategoryName = (task) => {
  if (!task || !task.category) {
    return "Uncategorized";
  }

  if (typeof task.category === "object" && task.category.name) {
    return task.category.name;
  }

  return "Category";
};

export const sortCategoriesByName = (categories) => {
  return [...categories].sort((firstCategory, secondCategory) =>
    firstCategory.name.localeCompare(secondCategory.name)
  );
};
