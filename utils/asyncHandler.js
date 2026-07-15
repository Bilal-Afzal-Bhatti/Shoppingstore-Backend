// utils/asyncHandler.js
// Wraps async controller functions — eliminates try/catch repetition
// Usage: export const myFn = asyncHandler(async (req, res) => { ... })

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next); // 'next' forwards error to errorHandler
};

export default asyncHandler;