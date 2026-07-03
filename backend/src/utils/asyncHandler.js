export function asyncHandler(handler) {
  return function handledAsyncRoute(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
