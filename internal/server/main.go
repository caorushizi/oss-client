package main

import (
	"net/http"

	"caorushizi.cn/buckets/internal/routes"
	"caorushizi.cn/buckets/internal/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func wrapper(handler utils.HandlerFunc) func(c *gin.Context) {
	return func(c *gin.Context) {
		var (
			err  error
			data interface{}
		)

		if data, err = handler(c); err != nil {
			var apiException *utils.APIException
			if h, ok := err.(*utils.APIException); ok {
				apiException = h
			} else if e, ok := err.(error); ok {
				if gin.Mode() == "debug" {
					// 错误
					apiException = utils.UnknownError(e.Error())
				} else {
					// 未知错误
					apiException = utils.UnknownError(e.Error())
				}
			} else {
				apiException = utils.ServerError()
			}
			c.JSON(http.StatusOK, apiException)
		} else {
			c.JSON(http.StatusOK, gin.H{
				"code": 0,
				"msg":  "success",
				"data": data,
			})
		}
	}
}

func main() {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"*"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"*"},
		AllowCredentials: true,
	}))

	r.NoMethod(utils.HandleNotFound)
	r.NoRoute(utils.HandleNotFound)

	r.POST("/api/buckets", wrapper(routes.GetBuckets))
	r.POST("/api/apps", wrapper(routes.AddApp))
	r.GET("/api/apps", wrapper(routes.GetApps))

	r.Run("127.0.0.1:7790")
}
