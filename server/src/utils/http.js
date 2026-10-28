export const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, data });
export const fail = (res, status, message, details) =>
  res.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } });
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
