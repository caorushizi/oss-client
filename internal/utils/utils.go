package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HandlerFunc func(c *gin.Context) (interface{}, error)

func HandleNotFound(c *gin.Context) {
	handleErr := NotFound()
	c.JSON(http.StatusOK, handleErr)
	return
}

type APIException struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

// 实现接口
func (e *APIException) Error() string {
	return e.Msg
}

func newAPIException(errorCode int, msg string) *APIException {
	return &APIException{
		Code: errorCode,
		Msg:  msg,
	}
}

const (
	SERVER_ERROR    = 1000 // 系统错误
	NOT_FOUND       = 1001 // 401错误
	UNKNOWN_ERROR   = 1002 // 未知错误
	PARAMETER_ERROR = 1003 // 参数错误
	AUTH_ERROR      = 1004 // 错误
	OTHER_ERROR     = 1005 // 其他错误
)

// 500 错误处理
func ServerError() *APIException {
	return newAPIException(SERVER_ERROR, http.StatusText(http.StatusInternalServerError))
}

// 404 错误
func NotFound() *APIException {
	return newAPIException(NOT_FOUND, http.StatusText(http.StatusNotFound))
}

// 业务错误
func BizError(code int, message string) *APIException {
	return newAPIException(code, message)
}

// 未知错误
func UnknownError(message string) *APIException {
	return newAPIException(UNKNOWN_ERROR, message)
}

// 参数错误
func ParameterError(message string) *APIException {
	return newAPIException(PARAMETER_ERROR, message)
}
