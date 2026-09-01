package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/profiles"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/transfers"
)

const maxJSONBody = 64 << 10

type Server struct {
	profiles  profiles.Store
	providers *storage.Registry
	transfers *transfers.Manager
	version   string
	handler   http.Handler
}

type profileResponse struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Provider      string `json:"provider"`
	Region        string `json:"region,omitempty"`
	Endpoint      string `json:"endpoint,omitempty"`
	UploadBucket  string `json:"uploadBucket"`
	UploadPrefix  string `json:"uploadPrefix"`
	DefaultDomain string `json:"defaultDomain"`
	AccessKeyHint string `json:"accessKeyHint"`
}

type credentialsRequest struct {
	AccessKeyID     string `json:"accessKeyId"`
	AccessKeySecret string `json:"accessKeySecret"`
}

type createProfileRequest struct {
	Name          string             `json:"name"`
	Provider      string             `json:"provider"`
	Region        string             `json:"region"`
	Endpoint      string             `json:"endpoint"`
	UploadBucket  string             `json:"uploadBucket"`
	UploadPrefix  string             `json:"uploadPrefix"`
	DefaultDomain string             `json:"defaultDomain"`
	Credentials   credentialsRequest `json:"credentials"`
}

type updateProfileRequest struct {
	Name          string              `json:"name"`
	Provider      string              `json:"provider"`
	Region        string              `json:"region"`
	Endpoint      string              `json:"endpoint"`
	UploadBucket  string              `json:"uploadBucket"`
	UploadPrefix  string              `json:"uploadPrefix"`
	DefaultDomain string              `json:"defaultDomain"`
	Credentials   *credentialsRequest `json:"credentials"`
}

type startTransferRequest struct {
	Direction string `json:"direction"`
	ProfileID string `json:"profileId"`
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
	ObjectKey string `json:"objectKey"`
	LocalPath string `json:"localPath"`
	Overwrite bool   `json:"overwrite"`
	UseHTTPS  bool   `json:"useHttps"`
}

func New(
	token string,
	version string,
	profileStore profiles.Store,
	providers *storage.Registry,
	logger *log.Logger,
) *Server {
	return NewWithTransfers(
		token,
		version,
		profileStore,
		providers,
		transfers.NewManager(profileStore, providers),
		logger,
	)
}

func NewWithTransfers(
	token string,
	version string,
	profileStore profiles.Store,
	providers *storage.Registry,
	transferManager *transfers.Manager,
	logger *log.Logger,
) *Server {
	server := &Server{
		profiles:  profileStore,
		providers: providers,
		transfers: transferManager,
		version:   version,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", server.health)
	mux.HandleFunc("GET /api/v1/profiles", server.listProfiles)
	mux.HandleFunc("POST /api/v1/profiles", server.createProfile)
	mux.HandleFunc("PATCH /api/v1/profiles/{profileId}", server.updateProfile)
	mux.HandleFunc("DELETE /api/v1/profiles/{profileId}", server.deleteProfile)
	mux.HandleFunc("GET /api/v1/profiles/{profileId}/buckets", server.listBuckets)
	mux.HandleFunc("GET /api/v1/profiles/{profileId}/buckets/{bucket}/domains", server.listDomains)
	mux.HandleFunc("GET /api/v1/profiles/{profileId}/objects", server.listObjects)
	mux.HandleFunc("GET /api/v1/transfers", server.listTransfers)
	mux.HandleFunc("POST /api/v1/transfers", server.startTransfer)
	mux.HandleFunc("DELETE /api/v1/transfers/completed", server.clearCompletedTransfers)
	mux.HandleFunc("DELETE /api/v1/transfers/{transferId}", server.cancelTransfer)

	server.handler = middleware(token, logger, mux)
	return server
}

func (s *Server) Close() {
	s.transfers.Close()
}

func (s *Server) Handler() http.Handler {
	return s.handler
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeData(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": s.version,
	})
}

func (s *Server) listProfiles(w http.ResponseWriter, r *http.Request) {
	stored, err := s.profiles.List()
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "PROFILE_LIST_FAILED", "读取云账号失败")
		return
	}
	response := make([]profileResponse, 0, len(stored))
	for _, profile := range stored {
		response = append(response, publicProfile(profile))
	}
	writeData(w, http.StatusOK, response)
}

func (s *Server) createProfile(w http.ResponseWriter, r *http.Request) {
	var request createProfileRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	profile := profiles.Profile{
		Name:          request.Name,
		Provider:      request.Provider,
		Region:        request.Region,
		Endpoint:      request.Endpoint,
		UploadBucket:  request.UploadBucket,
		UploadPrefix:  request.UploadPrefix,
		DefaultDomain: request.DefaultDomain,
		Credentials: profiles.Credentials{
			AccessKeyID:     request.Credentials.AccessKeyID,
			AccessKeySecret: request.Credentials.AccessKeySecret,
		},
	}
	if !s.normalizeAndValidateProfile(w, r, &profile) {
		return
	}

	id, err := profiles.NewID()
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "ID_GENERATION_FAILED", "无法生成账号 ID")
		return
	}

	profile.ID = id
	profile, err = s.profiles.Create(profile)
	if err != nil {
		switch {
		case errors.Is(err, profiles.ErrNameExists):
			writeError(w, r, http.StatusConflict, "PROFILE_NAME_EXISTS", "已经存在同名账号")
		case errors.Is(err, profiles.ErrAccessKeyUsed):
			writeError(w, r, http.StatusConflict, "ACCESS_KEY_EXISTS", "该 Access Key 已经存在")
		default:
			writeError(w, r, http.StatusInternalServerError, "PROFILE_CREATE_FAILED", "账号保存失败")
		}
		return
	}

	writeData(w, http.StatusCreated, publicProfile(profile))
}

func (s *Server) updateProfile(w http.ResponseWriter, r *http.Request) {
	current, err := s.profiles.Get(r.PathValue("profileId"))
	if err != nil {
		writeError(w, r, http.StatusNotFound, "PROFILE_NOT_FOUND", "云账号不存在")
		return
	}
	var request updateProfileRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}
	current.Name = request.Name
	current.Provider = request.Provider
	current.Region = request.Region
	current.Endpoint = request.Endpoint
	current.UploadBucket = request.UploadBucket
	current.UploadPrefix = request.UploadPrefix
	current.DefaultDomain = request.DefaultDomain
	if request.Credentials != nil {
		current.Credentials = profiles.Credentials{
			AccessKeyID:     request.Credentials.AccessKeyID,
			AccessKeySecret: request.Credentials.AccessKeySecret,
		}
	}
	if !s.normalizeAndValidateProfile(w, r, &current) {
		return
	}
	updated, err := s.profiles.Update(current)
	if err != nil {
		s.writeProfileMutationError(w, r, err, "PROFILE_UPDATE_FAILED", "账号更新失败")
		return
	}
	writeData(w, http.StatusOK, publicProfile(updated))
}

func (s *Server) deleteProfile(w http.ResponseWriter, r *http.Request) {
	if err := s.profiles.Delete(r.PathValue("profileId")); err != nil {
		if errors.Is(err, profiles.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "PROFILE_NOT_FOUND", "云账号不存在")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "PROFILE_DELETE_FAILED", "删除失败")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) listBuckets(w http.ResponseWriter, r *http.Request) {
	profile, provider, ok := s.resolveProvider(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	buckets, err := provider.ListBuckets(ctx, providerCredentials(profile))
	if err != nil {
		writeError(w, r, http.StatusBadGateway, "PROVIDER_ERROR", "读取 Bucket 失败："+err.Error())
		return
	}
	writeData(w, http.StatusOK, buckets)
}

func (s *Server) listDomains(w http.ResponseWriter, r *http.Request) {
	profile, provider, ok := s.resolveProvider(w, r)
	if !ok {
		return
	}
	bucket := strings.TrimSpace(r.PathValue("bucket"))
	if bucket == "" {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "缺少 bucket 参数")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	domains, err := provider.ListDomains(ctx, providerCredentials(profile), bucket)
	if err != nil {
		writeError(w, r, http.StatusBadGateway, "PROVIDER_ERROR", "读取绑定域名失败："+err.Error())
		return
	}
	writeData(w, http.StatusOK, domains)
}

func (s *Server) listObjects(w http.ResponseWriter, r *http.Request) {
	profile, provider, ok := s.resolveProvider(w, r)
	if !ok {
		return
	}

	bucket := strings.TrimSpace(r.URL.Query().Get("bucket"))
	if bucket == "" {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "缺少 bucket 参数")
		return
	}

	limit := 200
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 1000 {
			writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "limit 必须在 1 到 1000 之间")
			return
		}
		limit = parsed
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	page, err := provider.ListObjects(ctx, providerCredentials(profile), storage.ListObjectsInput{
		Bucket: bucket,
		Region: strings.TrimSpace(strings.ToLower(r.URL.Query().Get("region"))),
		Prefix: r.URL.Query().Get("prefix"),
		Cursor: r.URL.Query().Get("cursor"),
		Limit:  limit,
	})
	if err != nil {
		writeError(w, r, http.StatusBadGateway, "PROVIDER_ERROR", "读取文件失败："+err.Error())
		return
	}
	writeData(w, http.StatusOK, page)
}

func (s *Server) listTransfers(w http.ResponseWriter, _ *http.Request) {
	writeData(w, http.StatusOK, s.transfers.List())
}

func (s *Server) startTransfer(w http.ResponseWriter, r *http.Request) {
	var request startTransferRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	task, err := s.transfers.Start(transfers.StartInput{
		Direction: request.Direction,
		ProfileID: request.ProfileID,
		Bucket:    request.Bucket,
		Region:    request.Region,
		ObjectKey: request.ObjectKey,
		LocalPath: request.LocalPath,
		Overwrite: request.Overwrite,
		UseHTTPS:  request.UseHTTPS,
	})
	if err != nil {
		switch {
		case errors.Is(err, profiles.ErrNotFound):
			writeError(w, r, http.StatusNotFound, "PROFILE_NOT_FOUND", "云账号不存在")
		case errors.Is(err, transfers.ErrInvalidInput):
			writeError(w, r, http.StatusBadRequest, "INVALID_TRANSFER", "传输参数无效")
		case errors.Is(err, transfers.ErrObjectExists):
			writeError(w, r, http.StatusConflict, "OBJECT_EXISTS", "同名文件已经存在")
		default:
			writeError(w, r, http.StatusInternalServerError, "TRANSFER_START_FAILED", "无法启动传输任务")
		}
		return
	}
	writeData(w, http.StatusAccepted, task)
}

func (s *Server) cancelTransfer(w http.ResponseWriter, r *http.Request) {
	if err := s.transfers.Cancel(r.PathValue("transferId")); err != nil {
		if errors.Is(err, transfers.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "TRANSFER_NOT_FOUND", "传输任务不存在")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "TRANSFER_CANCEL_FAILED", "无法取消传输任务")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) clearCompletedTransfers(w http.ResponseWriter, r *http.Request) {
	if err := s.transfers.ClearCompleted(); err != nil {
		writeError(w, r, http.StatusInternalServerError, "TRANSFER_CLEAR_FAILED", "无法清除传输记录")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) resolveProvider(
	w http.ResponseWriter,
	r *http.Request,
) (profiles.Profile, storage.Provider, bool) {
	profile, err := s.profiles.Get(r.PathValue("profileId"))
	if err != nil {
		writeError(w, r, http.StatusNotFound, "PROFILE_NOT_FOUND", "云账号不存在")
		return profiles.Profile{}, nil, false
	}
	provider, err := s.providers.Get(profile.Provider)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "PROVIDER_NOT_SUPPORTED", "暂不支持该云服务商")
		return profiles.Profile{}, nil, false
	}
	return profile, provider, true
}

func providerCredentials(profile profiles.Profile) storage.Credentials {
	return storage.Credentials{
		AccessKeyID:     profile.Credentials.AccessKeyID,
		AccessKeySecret: profile.Credentials.AccessKeySecret,
		Region:          profile.Region,
		Endpoint:        profile.Endpoint,
	}
}

func (s *Server) normalizeAndValidateProfile(
	w http.ResponseWriter,
	r *http.Request,
	profile *profiles.Profile,
) bool {
	profile.Name = strings.TrimSpace(profile.Name)
	profile.Provider = strings.TrimSpace(strings.ToLower(profile.Provider))
	profile.Region = strings.TrimSpace(strings.ToLower(profile.Region))
	profile.Endpoint = strings.TrimSpace(profile.Endpoint)
	profile.UploadBucket = strings.TrimSpace(profile.UploadBucket)
	profile.UploadPrefix = strings.Trim(strings.ReplaceAll(strings.TrimSpace(profile.UploadPrefix), "\\", "/"), "/")
	if profile.UploadPrefix != "" {
		profile.UploadPrefix += "/"
	}
	profile.DefaultDomain = strings.TrimRight(strings.TrimSpace(profile.DefaultDomain), "/")
	profile.Credentials.AccessKeyID = strings.TrimSpace(profile.Credentials.AccessKeyID)

	if profile.Name == "" || profile.Provider == "" ||
		profile.Credentials.AccessKeyID == "" || profile.Credentials.AccessKeySecret == "" {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "账号信息不完整")
		return false
	}
	if len(profile.Name) > 80 {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "账号名称不能超过 80 个字符")
		return false
	}
	if (profile.Provider == "aliyun" || profile.Provider == "tencent") && profile.Region == "" {
		writeError(w, r, http.StatusBadRequest, "REGION_REQUIRED", "阿里云和腾讯云账号必须填写 Region")
		return false
	}
	if isS3CompatibleProvider(profile.Provider) {
		endpoint, err := storage.NormalizeEndpoint(profile.Endpoint)
		if err != nil {
			writeError(w, r, http.StatusBadRequest, "ENDPOINT_INVALID", "RustFS/S3 Endpoint 必须是有效的 HTTP 或 HTTPS 地址")
			return false
		}
		profile.Endpoint = endpoint
		if profile.Region == "" {
			profile.Region = storage.DefaultS3Region
		}
	} else {
		profile.Endpoint = ""
	}
	provider, err := s.providers.Get(profile.Provider)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "PROVIDER_NOT_SUPPORTED", "暂不支持该云服务商")
		return false
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	if _, err := provider.ListBuckets(ctx, providerCredentials(*profile)); err != nil {
		writeError(w, r, http.StatusBadGateway, "PROFILE_VALIDATION_FAILED", "账号验证失败："+err.Error())
		return false
	}
	return true
}

func (s *Server) writeProfileMutationError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
	code string,
	message string,
) {
	switch {
	case errors.Is(err, profiles.ErrNotFound):
		writeError(w, r, http.StatusNotFound, "PROFILE_NOT_FOUND", "云账号不存在")
	case errors.Is(err, profiles.ErrNameExists):
		writeError(w, r, http.StatusConflict, "PROFILE_NAME_EXISTS", "已经存在同名账号")
	case errors.Is(err, profiles.ErrAccessKeyUsed):
		writeError(w, r, http.StatusConflict, "ACCESS_KEY_EXISTS", "该 Access Key 已经存在")
	default:
		writeError(w, r, http.StatusInternalServerError, code, message)
	}
}

func publicProfile(profile profiles.Profile) profileResponse {
	return profileResponse{
		ID:            profile.ID,
		Name:          profile.Name,
		Provider:      profile.Provider,
		Region:        profile.Region,
		Endpoint:      profile.Endpoint,
		UploadBucket:  profile.UploadBucket,
		UploadPrefix:  profile.UploadPrefix,
		DefaultDomain: profile.DefaultDomain,
		AccessKeyHint: accessKeyHint(profile.Credentials.AccessKeyID),
	}
}

func isS3CompatibleProvider(provider string) bool {
	return provider == "rustfs" || provider == "s3"
}

func accessKeyHint(accessKey string) string {
	const visible = 4
	if len(accessKey) <= visible {
		return "••••"
	}
	return "••••" + accessKey[len(accessKey)-visible:]
}

func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxJSONBody)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return errors.New("请求内容不是有效 JSON")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("请求只能包含一个 JSON 对象")
	}
	return nil
}
