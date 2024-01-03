package qiniu

import (
	"github.com/qiniu/go-sdk/v7/auth/qbox"
	"github.com/qiniu/go-sdk/v7/storage"
)

func GetBuckets(ak string, sk string) (buckets []string, err error) {
	mac := qbox.NewMac(ak, sk)
	cfg := storage.Config{}
	bucketManager := storage.NewBucketManager(mac, &cfg)
	buckets, err = bucketManager.Buckets(false)
	return
}
