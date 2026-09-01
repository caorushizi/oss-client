package tencent

import (
	"context"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
	cos "github.com/tencentyun/cos-go-sdk-v5"
)

type Provider struct{}

func New() *Provider {
	return &Provider{}
}

func (p *Provider) ListBuckets(
	ctx context.Context,
	account storage.Credentials,
) ([]storage.Bucket, error) {
	serviceURL, err := url.Parse("https://service.cos.myqcloud.com")
	if err != nil {
		return nil, err
	}
	client := newClient(&cos.BaseURL{ServiceURL: serviceURL}, account)
	result := make([]storage.Bucket, 0)
	marker := ""

	for {
		page, _, err := client.Service.Get(ctx, &cos.ServiceGetOptions{
			Marker:  marker,
			MaxKeys: 1000,
			Region:  account.Region,
		})
		if err != nil {
			return nil, err
		}
		for _, bucket := range page.Buckets {
			result = append(result, storage.Bucket{
				Name:   bucket.Name,
				Region: bucket.Region,
			})
		}
		if !page.IsTruncated || page.NextMarker == "" {
			break
		}
		marker = page.NextMarker
	}
	return result, nil
}

func (p *Provider) ListDomains(context.Context, storage.Credentials, string) ([]string, error) {
	return []string{}, nil
}

func (p *Provider) ListObjects(
	ctx context.Context,
	account storage.Credentials,
	input storage.ListObjectsInput,
) (storage.ObjectPage, error) {
	region := input.Region
	if region == "" {
		region = account.Region
	}
	bucketURL, err := cos.NewBucketURL(input.Bucket, region, true)
	if err != nil {
		return storage.ObjectPage{}, err
	}
	client := newClient(&cos.BaseURL{BucketURL: bucketURL}, account)
	result, _, err := client.Bucket.Get(ctx, &cos.BucketGetOptions{
		Prefix:    input.Prefix,
		Delimiter: "/",
		Marker:    input.Cursor,
		MaxKeys:   input.Limit,
	})
	if err != nil {
		return storage.ObjectPage{}, err
	}

	items := make([]storage.Object, 0, len(result.CommonPrefixes)+len(result.Contents))
	for _, directory := range result.CommonPrefixes {
		items = append(items, storage.Object{
			Key:         directory,
			IsDirectory: true,
		})
	}
	for _, object := range result.Contents {
		updatedAt, _ := time.Parse(time.RFC3339Nano, object.LastModified)
		items = append(items, storage.Object{
			Key:         object.Key,
			Size:        object.Size,
			IsDirectory: false,
			Hash:        strings.Trim(object.ETag, "\""),
			UpdatedAt:   &updatedAt,
		})
	}
	return storage.ObjectPage{
		Items:   items,
		Cursor:  result.NextMarker,
		HasMore: result.IsTruncated,
	}, nil
}

func (p *Provider) UploadFile(
	ctx context.Context,
	account storage.Credentials,
	input storage.FileTransferInput,
) error {
	client, err := bucketClient(account, input)
	if err != nil {
		return err
	}
	_, err = client.Object.PutFromFile(ctx, input.Key, input.LocalPath, &cos.ObjectPutOptions{
		ObjectPutHeaderOptions: &cos.ObjectPutHeaderOptions{
			Listener: progressListener{progress: input.Progress},
		},
	})
	return err
}

func (p *Provider) DownloadFile(
	ctx context.Context,
	account storage.Credentials,
	input storage.FileTransferInput,
) error {
	client, err := bucketClient(account, input)
	if err != nil {
		return err
	}
	_, err = client.Object.GetToFile(ctx, input.Key, input.LocalPath, &cos.ObjectGetOptions{
		Listener: progressListener{progress: input.Progress},
	})
	return err
}

func bucketClient(
	account storage.Credentials,
	input storage.FileTransferInput,
) (*cos.Client, error) {
	region := input.Region
	if region == "" {
		region = account.Region
	}
	bucketURL, err := cos.NewBucketURL(input.Bucket, region, true)
	if err != nil {
		return nil, err
	}
	return newClient(&cos.BaseURL{BucketURL: bucketURL}, account), nil
}

type progressListener struct {
	progress storage.ProgressFunc
}

func (listener progressListener) ProgressChangedCallback(event *cos.ProgressEvent) {
	if listener.progress != nil && event != nil {
		listener.progress(event.ConsumedBytes, event.TotalBytes)
	}
}

func newClient(baseURL *cos.BaseURL, account storage.Credentials) *cos.Client {
	return cos.NewClient(baseURL, &http.Client{
		Transport: &cos.AuthorizationTransport{
			SecretID:  account.AccessKeyID,
			SecretKey: account.AccessKeySecret,
			Transport: http.DefaultTransport,
		},
	})
}
