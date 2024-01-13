package model

type App struct {
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required"`
	AK   string `json:"ak" binding:"required"`
	SK   string `json:"sk" binding:"required"`
}
