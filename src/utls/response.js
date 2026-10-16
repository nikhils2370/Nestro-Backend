const sendCreated = (res, message = "Created Successfully", data = null) => {
  return res.status(201).json({
    message,
    success: true,
    data,
  });
};

const sendSuccess = (res, message = "Success", data = null) => {
  return res.status(200).json({
    message,
    success: true,
    data,
  });
};

const sendBadRequest = (res, message = "Bad Request") => {
  return res.status(400).json({
    message,
    success: false,
  });
};

const sendUnauthorized = (res, message = "Unauthorized") => {
  return res.status(401).json({
    message,
    success: false,
  });
};

const sendForbidden = (res, message = "Forbidden") => {
  return res.status(403).json({
    message,
    success: false,
  });
};

const sendNotFound = (res, message = "Resource Not Found") => {
  return res.status(404).json({
    message,
    success: false,
  });
};

const sendConflict = (res, message = "Resource Already Exists") => {
  return res.status(409).json({
    message,
    success: false,
  });
};

const sendServerError = (res, message = "Internal Server Error") => {
  return res.status(500).json({
    message,
    success: false,
  });
};

export {
  sendCreated,
  sendSuccess,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendServerError,
};
