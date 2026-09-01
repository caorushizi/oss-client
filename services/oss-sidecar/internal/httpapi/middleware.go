package httpapi

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"log"
	"net/http"
	"strings"
)

type requestIDKey struct{}

func middleware(token string, logger *log.Logger, next http.Handler) http.Handler {
	return securityHeaders(
		requestID(
			recoverPanic(
				logger,
				authenticate(token, next),
			),
		),
	)
}

func authenticate(token string, next http.Handler) http.Handler {
	expected := []byte(token)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scheme, supplied, found := strings.Cut(r.Header.Get("Authorization"), " ")
		if !found ||
			!strings.EqualFold(scheme, "Bearer") ||
			subtle.ConstantTimeCompare([]byte(supplied), expected) != 1 {
			writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "无效的本地会话")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func requestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		value := make([]byte, 8)
		if _, err := rand.Read(value); err != nil {
			value = []byte("fallback")
		}
		id := hex.EncodeToString(value)
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey{}, id)))
	})
}

func requestIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey{}).(string)
	return id
}

func recoverPanic(logger *log.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				logger.Printf(
					"request panic: method=%s path=%s request_id=%s",
					r.Method,
					r.URL.Path,
					requestIDFromContext(r.Context()),
				)
				writeError(
					w,
					r,
					http.StatusInternalServerError,
					"INTERNAL_ERROR",
					"本地服务发生错误",
				)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		next.ServeHTTP(w, r)
	})
}
