/**
 * Uniform response envelope.
 * @template T
 */
export class ApiResponse {
  /**
   * @param {import('express').Response} res
   * @param {number} status
   * @param {string} message
   * @param {T} [data]
   */
  static send(res, status, message, data) {
    return res.status(status).json({ success: status < 400, message, data });
  }
  static ok(res, data, message = "OK") {
    return ApiResponse.send(res, 200, message, data);
  }
  static created(res, data, message = "Created") {
    return ApiResponse.send(res, 201, message, data);
  }
  static noContent(res) {
    return res.status(204).end();
  }
}
