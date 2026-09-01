package storage

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"time"
)

var (
	ErrProviderNotSupported = errors.New("storage provider is not supported")
	ErrEndpointInvalid      = errors.New("storage endpoint is invalid")
)

const DefaultS3Region = "us-east-1"

type Credentials struct {
	AccessKeyID     string
	AccessKeySecret string
	Region          string
	Endpoint        string
}

type Bucket struct {
	Name   string `json:"name"`
	Region string `json:"region,omitempty"`
}

type Object struct {
	Key         string     `json:"key"`
	Size        int64      `json:"size"`
	IsDirectory bool       `json:"isDirectory"`
	MimeType    string     `json:"mimeType,omitempty"`
	Hash        string     `json:"hash,omitempty"`
	UpdatedAt   *time.Time `json:"updatedAt,omitempty"`
}

type ListObjectsInput struct {
	Bucket string
	Region string
	Prefix string
	Cursor string
	Limit  int
}

type ObjectPage struct {
	Items   []Object `json:"items"`
	Cursor  string   `json:"cursor,omitempty"`
	HasMore bool     `json:"hasMore"`
}

type ProgressFunc func(transferred int64, total int64)

type FileTransferInput struct {
	Bucket    string
	Region    string
	Key       string
	LocalPath string
	UseHTTPS  bool
	Progress  ProgressFunc
}

type Provider interface {
	ListBuckets(ctx context.Context, credentials Credentials) ([]Bucket, error)
	ListDomains(ctx context.Context, credentials Credentials, bucket string) ([]string, error)
	ListObjects(
		ctx context.Context,
		credentials Credentials,
		input ListObjectsInput,
	) (ObjectPage, error)
	UploadFile(ctx context.Context, credentials Credentials, input FileTransferInput) error
	DownloadFile(ctx context.Context, credentials Credentials, input FileTransferInput) error
}

type Registry struct {
	providers map[string]Provider
}

func NormalizeEndpoint(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" || len(value) > 2048 {
		return "", ErrEndpointInvalid
	}
	parsed, err := url.Parse(value)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") ||
		parsed.Host == "" || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", ErrEndpointInvalid
	}
	parsed.Path = strings.TrimRight(parsed.Path, "/")
	parsed.RawPath = strings.TrimRight(parsed.RawPath, "/")
	return strings.TrimRight(parsed.String(), "/"), nil
}

func NewRegistry(providers map[string]Provider) *Registry {
	return &Registry{providers: providers}
}

func (r *Registry) Get(name string) (Provider, error) {
	provider, ok := r.providers[name]
	if !ok {
		return nil, ErrProviderNotSupported
	}
	return provider, nil
}
