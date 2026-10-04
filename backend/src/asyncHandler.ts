import { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 doesn't forward rejected promises from async handlers to error
// middleware on its own; wrapping routes with this ensures thrown/rejected
// errors reach the global error handler instead of hanging the request.
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
