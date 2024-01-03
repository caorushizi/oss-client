package qiniu

import (
	"github.com/qiniu/go-sdk/v7/auth/qbox"
	"github.com/qiniu/go-sdk/v7/storage"
)

func GetBuckets(ak string, sk string) (buckets []string, err error) {
	// Create a Resty Client

	mac := qbox.NewMac(ak, sk)
	// upToken := putPolicy.UploadToken(mac)
	cfg := storage.Config{}
	bucketManager := storage.NewBucketManager(mac, &cfg)

	buckets, err = bucketManager.Buckets(false)
	if err != nil {
		return
	}

	return
}
