package main

import (
	"fmt"

	"caorushizi.cn/buckets/internal/api/qiniu"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type PingForm struct {
	AK string `json:"ak" binding:"required"`
	SK string `json:"sk" binding:"required"`
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

	r.POST("/api/buckets", func(c *gin.Context) {

		getBucketsForm := PingForm{}
		if err := c.ShouldBindJSON(&getBucketsForm); err != nil {
			c.JSON(200, gin.H{
				"error": err.Error(),
			})
			return
		}

		buckets, err := qiniu.GetBuckets(getBucketsForm.AK, getBucketsForm.SK)
		if err != nil {
			fmt.Println(err)
		}

		c.JSON(200, buckets)
	})

	r.Run() // 监听并在 0.0.0.0:8080 上启动服务
}
