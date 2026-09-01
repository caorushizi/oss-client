package httpapi

import (
	"encoding/json"
	"net/http"
)

type apiError struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"requestId,omitempty"`
}

type envelope struct {
	Data  any       `json:"data"`
	Error *apiError `json:"error,omitempty"`
}

func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, envelope{Data: data})
}

func writeError(
	w http.ResponseWriter,
	r *http.Request,
	status int,
	code string,
	message string,
) {
	writeJSON(w, status, envelope{
		Data: nil,
		Error: &apiError{
			Code:      code,
			Message:   message,
			RequestID: requestIDFromContext(r.Context()),
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
