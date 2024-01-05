package model

import (
	"time"

	"gorm.io/gorm"
)

type App struct {
	ID        uint `gorm:"primaryKey"`
	Name      string
	Type      string
	AK        string
	SK        string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
