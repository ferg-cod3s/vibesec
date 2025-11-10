export var MCPErrorCode;
(function (MCPErrorCode) {
    MCPErrorCode[MCPErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    MCPErrorCode[MCPErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    MCPErrorCode[MCPErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    MCPErrorCode[MCPErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    MCPErrorCode[MCPErrorCode["TOOL_NOT_FOUND"] = -32001] = "TOOL_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["TOOL_EXECUTION_ERROR"] = -32002] = "TOOL_EXECUTION_ERROR";
    MCPErrorCode[MCPErrorCode["INVALID_TOOL_ARGS"] = -32003] = "INVALID_TOOL_ARGS";
})(MCPErrorCode || (MCPErrorCode = {}));
export function isValidMCPRequest(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const req = obj;
    return ((typeof req.id === 'string' || typeof req.id === 'number') &&
        typeof req.method === 'string' &&
        (req.params === undefined || typeof req.params === 'object'));
}
export function isValidToolCallParams(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const params = obj;
    return typeof params.name === 'string';
}
export function createErrorResponse(id, code, message, data) {
    return {
        id,
        jsonrpc: '2.0',
        error: {
            code,
            message,
            data
        }
    };
}
export function createSuccessResponse(id, result) {
    return {
        id,
        jsonrpc: '2.0',
        result
    };
}
export function createNotification(method, params) {
    return {
        jsonrpc: '2.0',
        method,
        params
    };
}
