class ErrorHandler extends Error {
  statusCode: Number;
  message!: string;
  constructor(statusCode: Number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
export default ErrorHandler;
