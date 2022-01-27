var ErrorCode;
(function (ErrorCode) {
    ErrorCode["GENERIC"] = "GENERIC";
    ErrorCode["ALREADY_CONNECTING"] = "ALREADY_CONNECTING";
    ErrorCode["ALREADY_CONNECTED"] = "ALREADY_CONNECTED";
    ErrorCode["NOT_CONNECTED"] = "NOT_CONNECTED";
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FILE_ALREADY_EXISTS"] = "FILE_ALREADY_EXISTS";
    ErrorCode["INVALID_FILENAME"] = "INVALID_FILENAME";
    ErrorCode["INVALID_FILETYPE"] = "INVALID_FILETYPE";
    ErrorCode["REQUEST_PENDING"] = "REQUEST_PENDING";
    ErrorCode["ARGUMENT_INVALID"] = "ARGUMENT_INVALID";
    ErrorCode["BUSY"] = "BUSY";
})(ErrorCode || (ErrorCode = {}));
var SuccessCode;
(function (SuccessCode) {
    SuccessCode["OK"] = "OK";
    SuccessCode["FILE_TRANSFER_OK"] = "FILE_TRANSFER_OK";
})(SuccessCode || (SuccessCode = {}));
export { ErrorCode, SuccessCode };
