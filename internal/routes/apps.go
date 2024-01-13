package routes

import (
	"caorushizi.cn/buckets/internal/api/qiniu"
	"caorushizi.cn/buckets/internal/db"
	"caorushizi.cn/buckets/internal/model"
	"caorushizi.cn/buckets/internal/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GetBucketsForm struct {
	AppName string `json:"appName" binding:"required"`
}

func GetBuckets(c *gin.Context) (interface{}, error) {
	getBucketsForm := GetBucketsForm{}
	if err := c.ShouldBindJSON(&getBucketsForm); err != nil {
		return nil, utils.ParameterError(err.Error())
	}

	var app model.App
	result := db.DB.Take(&app, "name = ?", getBucketsForm.AppName)
	if result.Error != nil {
		return nil, utils.UnknownError(result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return nil, utils.UnknownError("app 不存在")
	}

	buckets, err := qiniu.GetBuckets(app.AK, app.SK)
	if err != nil {
		return nil, utils.UnknownError(err.Error())
	}

	return buckets, nil
}

func AddApp(c *gin.Context) (interface{}, error) {
	addAppForm := model.App{}
	if err := c.ShouldBindJSON(&addAppForm); err != nil {
		return nil, utils.ParameterError(err.Error())
	}

	var result *gorm.DB

	// 查询有没有重复的 app name
	result = db.DB.Take(&model.App{}, "ak = ?", addAppForm.AK)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return nil, utils.UnknownError(result.Error.Error())
	}
	if result.RowsAffected > 0 {
		return nil, utils.UnknownError("已经存在相同的 ak")
	}

	result = db.DB.Take(&model.App{}, "name = ?", addAppForm.Name)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return nil, utils.UnknownError(result.Error.Error())
	}
	if result.RowsAffected > 0 {
		return nil, utils.UnknownError("已经存在相同的 name")
	}

	// 验证 AK SK 是否正确
	if _, err := qiniu.GetBuckets(addAppForm.AK, addAppForm.SK); err != nil {
		return nil, utils.UnknownError("ak sk 验证失败，请检查 ak sk 是否正确")
	}

	app := model.App{
		Name: addAppForm.Name,
		Type: addAppForm.Type,
		AK:   addAppForm.AK,
		SK:   addAppForm.SK,
	}
	result = db.DB.Create(&app)

	if result.Error != nil {
		return nil, utils.UnknownError(result.Error.Error())
	}

	return result.RowsAffected, nil
}

func GetApps(c *gin.Context) (interface{}, error) {
	var apps []model.App
	result := db.DB.Find(&apps)
	if result.Error != nil {
		return nil, utils.BizError(utils.OTHER_ERROR, result.Error.Error())
	}

	return apps, nil
}

type DeleteAppForm struct {
	Name string `json:"name" binding:"required"`
}

func DeleteApp(c *gin.Context) (interface{}, error) {
	deleteAppForm := DeleteAppForm{}
	if err := c.ShouldBindJSON(&deleteAppForm); err != nil {
		return nil, utils.ParameterError(err.Error())
	}

	var result *gorm.DB
	result = db.DB.Delete(&model.App{}, "name = ?", deleteAppForm.Name)
	if result.Error != nil {
		return nil, utils.UnknownError(result.Error.Error())
	}

	return result.RowsAffected, nil
}

type GetFilesForm struct {
	AppName string `json:"appName" binding:"required"`
	Bucket  string `json:"bucket" binding:"required"`
}

func GetFiles(c *gin.Context) (interface{}, error) {
	getFilesForm := GetFilesForm{}
	if err := c.ShouldBindJSON(&getFilesForm); err != nil {
		return nil, utils.ParameterError(err.Error())
	}

	var app model.App
	result := db.DB.Take(&app, "name = ?", getFilesForm.AppName)
	if result.Error != nil {
		return nil, utils.UnknownError(result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return nil, utils.UnknownError("app 不存在")
	}

	files := qiniu.GetFiles(app.AK, app.SK, getFilesForm.Bucket)

	return files, nil
}
