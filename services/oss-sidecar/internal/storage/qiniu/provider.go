package qiniu

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
	"github.com/qiniu/go-sdk/v7/auth/qbox"
	qiniustorage "github.com/qiniu/go-sdk/v7/storage"
)

type Provider struct{}

func New() *Provider {
	return &Provider{}
}

func (p *Provider) ListBuckets(
	ctx context.Context,
	credentials storage.Credentials,
) ([]storage.Bucket, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	manager := bucketManager(credentials)
	names, err := manager.Buckets(false)
	if err != nil {
		return nil, err
	}

	buckets := make([]storage.Bucket, 0, len(names))
	for _, name := range names {
		buckets = append(buckets, storage.Bucket{Name: name})
	}
	return buckets, nil
}

func (p *Provider) ListDomains(
	ctx context.Context,
	credentials storage.Credentials,
	bucket string,
) ([]string, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	items, err := bucketManager(credentials).ListBucketDomains(bucket)
	if err != nil {
		return nil, err
	}
	domains := make([]string, 0, len(items))
	for _, item := range items {
		if domain := strings.TrimSpace(item.Domain); domain != "" {
			domains = append(domains, domain)
		}
	}
	return domains, nil
}

func (p *Provider) ListObjects(
	ctx context.Context,
	credentials storage.Credentials,
	input storage.ListObjectsInput,
) (storage.ObjectPage, error) {
	if err := ctx.Err(); err != nil {
		return storage.ObjectPage{}, err
	}

	manager := bucketManager(credentials)
	entries, directories, nextMarker, hasNext, err := manager.ListFiles(
		input.Bucket,
		input.Prefix,
		"/",
		input.Cursor,
		input.Limit,
	)
	if err != nil {
		return storage.ObjectPage{}, err
	}

	items := make([]storage.Object, 0, len(directories)+len(entries))
	for _, directory := range directories {
		items = append(items, storage.Object{
			Key:         directory,
			IsDirectory: true,
		})
	}
	for _, entry := range entries {
		updatedAt := time.Unix(0, entry.PutTime*100)
		items = append(items, storage.Object{
			Key:         entry.Key,
			Size:        entry.Fsize,
			IsDirectory: false,
			MimeType:    entry.MimeType,
			Hash:        entry.Hash,
			UpdatedAt:   &updatedAt,
		})
	}

	return storage.ObjectPage{
		Items:   items,
		Cursor:  nextMarker,
		HasMore: hasNext,
	}, nil
}

func bucketManager(credentials storage.Credentials) *qiniustorage.BucketManager {
	mac := qbox.NewMac(credentials.AccessKeyID, credentials.AccessKeySecret)
	config := qiniustorage.Config{UseHTTPS: true}
	return qiniustorage.NewBucketManager(mac, &config)
}

func (p *Provider) UploadFile(
	ctx context.Context,
	credentials storage.Credentials,
	input storage.FileTransferInput,
) error {
	mac := qbox.NewMac(credentials.AccessKeyID, credentials.AccessKeySecret)
	policy := qiniustorage.PutPolicy{Scope: input.Bucket + ":" + input.Key}
	token := policy.UploadToken(mac)
	source, err := qiniustorage.NewUploadSourceFile(input.LocalPath)
	if err != nil {
		return err
	}
	manager := qiniustorage.NewUploadManager(&qiniustorage.UploadConfig{UseHTTPS: input.UseHTTPS})
	var result qiniustorage.UploadRet
	key := input.Key
	return manager.Put(ctx, &result, token, &key, source, &qiniustorage.UploadExtra{
		OnProgress: func(total int64, transferred int64) {
			reportProgress(input.Progress, transferred, total)
		},
	})
}

func (p *Provider) DownloadFile(
	ctx context.Context,
	credentials storage.Credentials,
	input storage.FileTransferInput,
) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	domains, err := bucketManager(credentials).ListBucketDomains(input.Bucket)
	if err != nil {
		return err
	}
	if len(domains) == 0 || strings.TrimSpace(domains[0].Domain) == "" {
		return fmt.Errorf("bucket %s has no download domain", input.Bucket)
	}

	domain := strings.TrimSpace(domains[0].Domain)
	if !strings.HasPrefix(domain, "http://") && !strings.HasPrefix(domain, "https://") {
		if input.UseHTTPS {
			domain = "https://" + domain
		} else {
			domain = "http://" + domain
		}
	} else if input.UseHTTPS {
		domain = "https://" + strings.TrimPrefix(strings.TrimPrefix(domain, "https://"), "http://")
	} else {
		domain = "http://" + strings.TrimPrefix(strings.TrimPrefix(domain, "https://"), "http://")
	}
	mac := qbox.NewMac(credentials.AccessKeyID, credentials.AccessKeySecret)
	downloadURL := qiniustorage.MakePrivateURLv2(
		mac,
		domain,
		input.Key,
		time.Now().Add(time.Hour).Unix(),
	)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadURL, nil)
	if err != nil {
		return err
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("download returned HTTP %d", response.StatusCode)
	}

	file, err := os.OpenFile(input.LocalPath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	defer file.Close()

	reader := &progressReader{
		reader:   response.Body,
		total:    response.ContentLength,
		progress: input.Progress,
	}
	_, err = io.CopyBuffer(file, reader, make([]byte, 256<<10))
	return err
}

type progressReader struct {
	reader      io.Reader
	total       int64
	transferred int64
	progress    storage.ProgressFunc
}

func (r *progressReader) Read(buffer []byte) (int, error) {
	count, err := r.reader.Read(buffer)
	if count > 0 {
		r.transferred += int64(count)
		reportProgress(r.progress, r.transferred, r.total)
	}
	return count, err
}

func reportProgress(progress storage.ProgressFunc, transferred int64, total int64) {
	if progress != nil {
		progress(transferred, total)
	}
}
