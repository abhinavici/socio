export const getErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  return fallbackMessage;
};
