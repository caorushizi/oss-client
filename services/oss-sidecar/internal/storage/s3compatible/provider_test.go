package s3compatible

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
)

func TestProviderListsBucketsAndObjectsUsingPathStyle(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		switch {
		case r.URL.Path == "/" && r.Method == http.MethodGet:
			_, _ = io.WriteString(w, `<?xml version="1.0" encoding="UTF-8"?>
<ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Buckets><Bucket><Name>demo</Name><CreationDate>2026-01-01T00:00:00Z</CreationDate></Bucket></Buckets>
</ListAllMyBucketsResult>`)
		case r.URL.Path == "/demo" && r.URL.Query().Get("list-type") == "2":
			if r.URL.Query().Get("prefix") != "folder/" || r.URL.Query().Get("continuation-token") != "cursor" {
				t.Errorf("unexpected list query: %s", r.URL.RawQuery)
			}
			_, _ = io.WriteString(w, `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>demo</Name><Prefix>folder/</Prefix><IsTruncated>true</IsTruncated>
  <NextContinuationToken>next</NextContinuationToken>
  <CommonPrefixes><Prefix>folder/nested/</Prefix></CommonPrefixes>
  <Contents><Key>folder/file.txt</Key><LastModified>2026-01-02T03:04:05Z</LastModified><ETag>&quot;etag&quot;</ETag><Size>12</Size></Contents>
</ListBucketResult>`)
		default:
			http.Error(w, "unexpected request", http.StatusNotFound)
		}
	}))
	defer server.Close()

	provider := New()
	account := testCredentials(server.URL)
	buckets, err := provider.ListBuckets(context.Background(), account)
	if err != nil {
		t.Fatal(err)
	}
	if len(buckets) != 1 || buckets[0].Name != "demo" || buckets[0].Region != storage.DefaultS3Region {
		t.Fatalf("unexpected buckets: %#v", buckets)
	}

	page, err := provider.ListObjects(context.Background(), account, storage.ListObjectsInput{
		Bucket: "demo",
		Prefix: "folder/",
		Cursor: "cursor",
		Limit:  200,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !page.HasMore || page.Cursor != "next" || len(page.Items) != 2 {
		t.Fatalf("unexpected object page: %#v", page)
	}
	if !page.Items[0].IsDirectory || page.Items[0].Key != "folder/nested/" {
		t.Fatalf("unexpected directory: %#v", page.Items[0])
	}
	if page.Items[1].Key != "folder/file.txt" || page.Items[1].Size != 12 || page.Items[1].Hash != "etag" {
		t.Fatalf("unexpected object: %#v", page.Items[1])
	}
}

func TestProviderUploadsAndDownloadsWithProgress(t *testing.T) {
	uploadContent := "hello from desktop"
	downloadContent := "hello from rustfs"
	var mu sync.Mutex
	receivedUpload := ""
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/demo/folder/file.txt" {
			http.Error(w, "path style required", http.StatusNotFound)
			return
		}
		switch r.Method {
		case http.MethodPut:
			body, err := io.ReadAll(r.Body)
			if err != nil {
				t.Errorf("read upload: %v", err)
			}
			mu.Lock()
			receivedUpload = string(body)
			mu.Unlock()
			w.Header().Set("ETag", `"uploaded"`)
			w.WriteHeader(http.StatusOK)
		case http.MethodHead:
			w.Header().Set("Content-Length", "17")
			w.Header().Set("ETag", `"download"`)
			w.WriteHeader(http.StatusOK)
		case http.MethodGet:
			w.Header().Set("ETag", `"download"`)
			w.Header().Set("Accept-Ranges", "bytes")
			if r.Header.Get("Range") != "" {
				w.Header().Set("Content-Range", "bytes 0-16/17")
				w.Header().Set("Content-Length", "17")
				w.WriteHeader(http.StatusPartialContent)
			}
			_, _ = io.WriteString(w, downloadContent)
		default:
			http.Error(w, "unexpected method", http.StatusMethodNotAllowed)
		}
	}))
	defer server.Close()

	directory := t.TempDir()
	uploadPath := filepath.Join(directory, "upload.txt")
	if err := os.WriteFile(uploadPath, []byte(uploadContent), 0o600); err != nil {
		t.Fatal(err)
	}
	provider := New()
	account := testCredentials(server.URL)
	var uploaded int64
	if err := provider.UploadFile(context.Background(), account, storage.FileTransferInput{
		Bucket:    "demo",
		Key:       "folder/file.txt",
		LocalPath: uploadPath,
		Progress: func(transferred int64, _ int64) {
			uploaded = transferred
		},
	}); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	gotUpload := receivedUpload
	mu.Unlock()
	if !strings.Contains(gotUpload, uploadContent) || uploaded != int64(len(uploadContent)) {
		t.Fatalf("unexpected upload body/progress: %q, %d", gotUpload, uploaded)
	}

	downloadPath := filepath.Join(directory, "download.txt")
	var downloaded int64
	if err := provider.DownloadFile(context.Background(), account, storage.FileTransferInput{
		Bucket:    "demo",
		Key:       "folder/file.txt",
		LocalPath: downloadPath,
		Progress: func(transferred int64, _ int64) {
			downloaded = transferred
		},
	}); err != nil {
		t.Fatal(err)
	}
	content, err := os.ReadFile(downloadPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != downloadContent || downloaded != int64(len(downloadContent)) {
		t.Fatalf("unexpected download body/progress: %q, %d", content, downloaded)
	}
}

func TestProviderRejectsInvalidEndpoint(t *testing.T) {
	_, err := New().ListBuckets(context.Background(), testCredentials("file:///data"))
	if !errors.Is(err, storage.ErrEndpointInvalid) {
		t.Fatalf("expected ErrEndpointInvalid, got %v", err)
	}
}

func testCredentials(endpoint string) storage.Credentials {
	return storage.Credentials{
		AccessKeyID:     "access-key",
		AccessKeySecret: "secret-key",
		Region:          storage.DefaultS3Region,
		Endpoint:        endpoint,
	}
}
