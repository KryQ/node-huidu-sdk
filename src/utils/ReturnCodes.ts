enum ErrorCode {
	GENERIC = "GENERIC",
	ALREADY_CONNECTING = "ALREADY_CONNECTING",
	ALREADY_CONNECTED = "ALREADY_CONNECTED",
	NOT_CONNECTED = "NOT_CONNECTED",
	FILE_NOT_FOUND = "FILE_NOT_FOUND",
	FILE_ALREADY_EXISTS = "FILE_ALREADY_EXISTS",
	INVALID_FILENAME = "INVALID_FILENAME",
	INVALID_FILETYPE = "INVALID_FILETYPE",
	REQUEST_PENDING = "REQUEST_PENDING",
	ARGUMENT_INVALID = "ARGUMENT_INVALID",
	BUSY = "BUSY",
	COMPONENT_KEY_EXISTS = "COMPONENT_KEY_EXISTS",
	INVALID_COMPONENT_KEY = "INVALID_COMPONENT_KEY",
	RESPONSE_TIMEOUT = "RESPONSE_TIMEOUT",
	ALREADY_DISCONNECTED = "ALREADY_DISCONNECTED"
}

enum SuccessCode {
	OK = "OK",
	FILE_TRANSFER_OK = "FILE_TRANSFER_OK",
}

export {ErrorCode, SuccessCode};