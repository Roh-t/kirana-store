export class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = {}, meta = {} }) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    });
  }

  static paginated(res, { statusCode = 200, message = 'Success', data = [], pagination = {}, meta = {} }) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      pagination: {
        totalRecords: pagination.totalRecords || 0,
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        pageSize: pagination.pageSize || 10,
        hasNextPage: pagination.hasNextPage || false,
        hasPrevPage: pagination.hasPrevPage || false
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    });
  }
}