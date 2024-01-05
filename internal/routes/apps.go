package routes

import (
	"caorushizi.cn/buckets/internal/api/qiniu"
	"caorushizi.cn/buckets/internal/db"
	"caorushizi.cn/buckets/internal/model"
	"caorushizi.cn/buckets/internal/utils"
	"github.com/gin-gonic/gin"
)

type PingForm struct {
	AK string `json:"ak" binding:"required"`
	SK string `json:"sk" binding:"required"`
}

func GetBuckets(c *gin.Context) (interface{}, error) {
	getBucketsForm := PingForm{}
	if err := c.ShouldBindJSON(&getBucketsForm); err != nil {
		return nil, utils.ParameterError(err.Error())
	}

	buckets, err := qiniu.GetBuckets(getBucketsForm.AK, getBucketsForm.SK)
	if err != nil {
		return nil, utils.UnknownError(err.Error())
	}

	return buckets, nil
}

type AddAppForm struct {
	AK   string `json:"ak" binding:"required"`
	SK   string `json:"sk" binding:"required"`
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required"`
}

func AddApp(c *gin.Context) (interface{}, error) {
	addAppForm := AddAppForm{}
	if err := c.ShouldBindJSON(&addAppForm); err != nil {
		return nil, utils.ParameterError(err.Error())
	}

	// 验证 AK SK 是否正确
	if _, err := qiniu.GetBuckets(addAppForm.AK, addAppForm.SK); err != nil {
		return nil, utils.UnknownError(err.Error())
	}

	app := model.App{
		Name: addAppForm.Name,
		Type: addAppForm.Type,
		AK:   addAppForm.AK,
		SK:   addAppForm.SK,
	}
	result := db.DB.Create(&app) // 通过数据的指针来创建

	return result, nil
}
