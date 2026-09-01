package aliyun

import (
	"context"
	"strings"

	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss"
	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss/credentials"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
)

type Provider struct{}

func New() *Provider {
	return &Provider{}
}

func (p *Provider) ListBuckets(
	ctx context.Context,
	account storage.Credentials,
) ([]storage.Bucket, error) {
	client := newClient(account, account.Region)
	result := make([]storage.Bucket, 0)
	var marker *string

	for {
		page, err := client.ListBuckets(ctx, &oss.ListBucketsRequest{
			Marker:  marker,
			MaxKeys: 1000,
		})
		if err != nil {
			return nil, err
		}
		for _, bucket := range page.Buckets {
			region := value(bucket.Region)
			if region == "" {
				region = strings.TrimPrefix(value(bucket.Location), "oss-")
			}
			result = append(result, storage.Bucket{
				Name:   value(bucket.Name),
				Region: region,
			})
		}
		if !page.IsTruncated || value(page.NextMarker) == "" {
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
	client := newClient(account, region)
	request := &oss.ListObjectsRequest{
		Bucket:    oss.Ptr(input.Bucket),
		Delimiter: oss.Ptr("/"),
		MaxKeys:   int32(input.Limit),
		Prefix:    oss.Ptr(input.Prefix),
	}
	if input.Cursor != "" {
		request.Marker = oss.Ptr(input.Cursor)
	}

	result, err := client.ListObjects(ctx, request)
	if err != nil {
		return storage.ObjectPage{}, err
	}
	items := make([]storage.Object, 0, len(result.CommonPrefixes)+len(result.Contents))
	for _, directory := range result.CommonPrefixes {
		items = append(items, storage.Object{
			Key:         value(directory.Prefix),
			IsDirectory: true,
		})
	}
	for _, object := range result.Contents {
		items = append(items, storage.Object{
			Key:         value(object.Key),
			Size:        object.Size,
			IsDirectory: false,
			Hash:        strings.Trim(value(object.ETag), "\""),
			UpdatedAt:   object.LastModified,
		})
	}
	return storage.ObjectPage{
		Items:   items,
		Cursor:  value(result.NextMarker),
		HasMore: result.IsTruncated,
	}, nil
}

func (p *Provider) UploadFile(
	ctx context.Context,
	account storage.Credentials,
	input storage.FileTransferInput,
) error {
	region := input.Region
	if region == "" {
		region = account.Region
	}
	client := newClient(account, region)
	uploader := client.NewUploader()
	_, err := uploader.UploadFile(ctx, &oss.PutObjectRequest{
		Bucket: oss.Ptr(input.Bucket),
		Key:    oss.Ptr(input.Key),
		ProgressFn: func(_ int64, transferred int64, total int64) {
			reportProgress(input.Progress, transferred, total)
		},
	}, input.LocalPath)
	return err
}

func (p *Provider) DownloadFile(
	ctx context.Context,
	account storage.Credentials,
	input storage.FileTransferInput,
) error {
	region := input.Region
	if region == "" {
		region = account.Region
	}
	client := newClient(account, region)
	_, err := client.GetObjectToFileV2(ctx, &oss.GetObjectRequest{
		Bucket: oss.Ptr(input.Bucket),
		Key:    oss.Ptr(input.Key),
		ProgressFn: func(_ int64, transferred int64, total int64) {
			reportProgress(input.Progress, transferred, total)
		},
	}, input.LocalPath, nil)
	return err
}

func newClient(account storage.Credentials, region string) *oss.Client {
	provider := credentials.NewStaticCredentialsProvider(
		account.AccessKeyID,
		account.AccessKeySecret,
	)
	config := oss.LoadDefaultConfig().
		WithCredentialsProvider(provider).
		WithRegion(region)
	return oss.NewClient(config)
}

func value(pointer *string) string {
	if pointer == nil {
		return ""
	}
	return *pointer
}

func reportProgress(progress storage.ProgressFunc, transferred int64, total int64) {
	if progress != nil {
		progress(transferred, total)
	}
}
