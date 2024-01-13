package qiniu

import (
	"fmt"

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

func GetFiles(ak string, sk string, bucket string) []storage.ListItem {
	limit := 1000
	prefix := ""
	delimiter := ""
	// 初始列举marker为空
	marker := ""
	mac := qbox.NewMac(ak, sk)
	cfg := storage.Config{}
	bucketManager := storage.NewBucketManager(mac, &cfg)

	list := []storage.ListItem{}
	for {
		entries, _, nextMarker, hasNext, err := bucketManager.ListFiles(bucket, prefix, delimiter, marker, limit)
		if err != nil {
			fmt.Println("list error,", err)
			break
		}
		//print entries
		list = append(list, entries...)

		if hasNext {
			marker = nextMarker
		} else {
			//list end
			break
		}
	}

	return list
}
