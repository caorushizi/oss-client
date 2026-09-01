package s3compatible

import (
	"context"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/transfermanager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
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
	client, err := newClient(account)
	if err != nil {
		return nil, err
	}

	result := make([]storage.Bucket, 0)
	var continuationToken *string
	for {
		page, err := client.ListBuckets(ctx, &s3.ListBucketsInput{
			ContinuationToken: continuationToken,
		})
		if err != nil {
			return nil, err
		}
		for _, bucket := range page.Buckets {
			result = append(result, storage.Bucket{
				Name:   aws.ToString(bucket.Name),
				Region: region(account.Region),
			})
		}
		if aws.ToString(page.ContinuationToken) == "" {
			break
		}
		continuationToken = page.ContinuationToken
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
	client, err := newClient(account)
	if err != nil {
		return storage.ObjectPage{}, err
	}
	request := &s3.ListObjectsV2Input{
		Bucket:    aws.String(input.Bucket),
		Delimiter: aws.String("/"),
		MaxKeys:   aws.Int32(int32(input.Limit)),
		Prefix:    aws.String(input.Prefix),
	}
	if input.Cursor != "" {
		request.ContinuationToken = aws.String(input.Cursor)
	}

	page, err := client.ListObjectsV2(ctx, request)
	if err != nil {
		return storage.ObjectPage{}, err
	}
	items := make([]storage.Object, 0, len(page.CommonPrefixes)+len(page.Contents))
	for _, directory := range page.CommonPrefixes {
		items = append(items, storage.Object{
			Key:         aws.ToString(directory.Prefix),
			IsDirectory: true,
		})
	}
	for _, object := range page.Contents {
		items = append(items, storage.Object{
			Key:         aws.ToString(object.Key),
			Size:        aws.ToInt64(object.Size),
			IsDirectory: false,
			Hash:        strings.Trim(aws.ToString(object.ETag), "\""),
			UpdatedAt:   object.LastModified,
		})
	}
	return storage.ObjectPage{
		Items:   items,
		Cursor:  aws.ToString(page.NextContinuationToken),
		HasMore: aws.ToBool(page.IsTruncated),
	}, nil
}

func (p *Provider) UploadFile(
	ctx context.Context,
	account storage.Credentials,
	input storage.FileTransferInput,
) error {
	client, err := newClient(account)
	if err != nil {
		return err
	}
	file, err := os.Open(input.LocalPath)
	if err != nil {
		return err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return err
	}

	manager := transfermanager.New(client)
	_, err = manager.UploadObject(ctx, &transfermanager.UploadObjectInput{
		Bucket:        aws.String(input.Bucket),
		Key:           aws.String(input.Key),
		Body:          file,
		ContentLength: aws.Int64(info.Size()),
	}, withProgress(input.Progress))
	return err
}

func (p *Provider) DownloadFile(
	ctx context.Context,
	account storage.Credentials,
	input storage.FileTransferInput,
) error {
	client, err := newClient(account)
	if err != nil {
		return err
	}
	file, err := os.OpenFile(input.LocalPath, os.O_CREATE|os.O_TRUNC|os.O_RDWR, 0o600)
	if err != nil {
		return err
	}
	defer file.Close()

	manager := transfermanager.New(client)
	_, err = manager.DownloadObject(ctx, &transfermanager.DownloadObjectInput{
		Bucket:   aws.String(input.Bucket),
		Key:      aws.String(input.Key),
		WriterAt: file,
	}, withProgress(input.Progress))
	return err
}

func newClient(account storage.Credentials) (*s3.Client, error) {
	endpoint, err := storage.NormalizeEndpoint(account.Endpoint)
	if err != nil {
		return nil, err
	}
	config := aws.Config{
		Region: region(account.Region),
		Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(
			account.AccessKeyID,
			account.AccessKeySecret,
			"",
		)),
	}
	return s3.NewFromConfig(config, func(options *s3.Options) {
		options.BaseEndpoint = aws.String(endpoint)
		options.UsePathStyle = true
	}), nil
}

func region(value string) string {
	if value = strings.TrimSpace(value); value != "" {
		return value
	}
	return storage.DefaultS3Region
}

func withProgress(progress storage.ProgressFunc) func(*transfermanager.Options) {
	return func(options *transfermanager.Options) {
		if progress != nil {
			options.ObjectProgressListeners.Register(progressListener{progress: progress})
		}
	}
}

type progressListener struct {
	progress storage.ProgressFunc
}

func (listener progressListener) OnObjectBytesTransferred(
	_ context.Context,
	event *transfermanager.ObjectBytesTransferredEvent,
) {
	if event != nil {
		listener.progress(event.BytesTransferred, event.TotalBytes)
	}
}

var _ storage.Provider = (*Provider)(nil)
var _ transfermanager.ObjectBytesTransferredListener = progressListener{}
