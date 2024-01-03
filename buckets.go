package main

import (
	"fmt"

	"caorushizi.cn/buckets/internal/api/qiniu"
	"github.com/gin-gonic/gin"
)

type PingForm struct {
	ak string `form:"ak" json:"ak" xml:"ak"  binding:"required"`
	sk string `form:"sk" json:"sk" xml:"sk"  binding:"required"`
}

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {

		if err := c.ShouldBind("ak"); err != nil {
			c.JSON(200, gin.H{
				"error": err.Error(),
			})
			return
		}
		if err := c.ShouldBind("sk"); err != nil {
			c.JSON(200, gin.H{
				"error": err.Error(),
			})
			return
		}

		buckets, err := qiniu.GetBuckets("", "")
		fmt.Println(buckets)

		if err != nil {
			fmt.Println(err)
		}

		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run() // 监听并在 0.0.0.0:8080 上启动服务
}
