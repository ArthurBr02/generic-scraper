export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        details?: any;
        stack?: string;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
