package service

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type UploadService interface {
	UploadImage(file multipart.File, header *multipart.FileHeader) (string, error)
	DeleteObject(url string) error
}

type uploadService struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

func NewUploadService() UploadService {
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	bucket := os.Getenv("S3_BUCKET")
	publicURL := os.Getenv("S3_PUBLIC_URL")

	client := s3.New(s3.Options{
		BaseEndpoint: aws.String(endpoint),
		Region:       "us-east-1",
		Credentials:  aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		UsePathStyle: true,
	})

	return &uploadService{client: client, bucket: bucket, publicURL: publicURL}
}

func (s *uploadService) UploadImage(file multipart.File, header *multipart.FileHeader) (string, error) {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".webp": "image/webp",
		".gif":  "image/gif",
	}
	contentType, ok := allowed[ext]
	if !ok {
		return "", fmt.Errorf("unsupported file type: %s", ext)
	}

	key := fmt.Sprintf("images/%d-%s%s", time.Now().UnixMilli(), uuid.New().String(), ext)

	_, err := s.client.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("upload failed: %w", err)
	}
	return fmt.Sprintf("%s/%s", s.publicURL, key), nil
}

// DeleteObject removes the stored object backing a public media URL. The URL
// must live under S3_PUBLIC_URL; the key is everything after that prefix.
func (s *uploadService) DeleteObject(url string) error {
	prefix := s.publicURL + "/"
	if s.publicURL == "" || !strings.HasPrefix(url, prefix) {
		return fmt.Errorf("url is not under the configured public base")
	}
	key := strings.TrimPrefix(url, prefix)
	if key == "" || strings.Contains(key, "..") {
		return fmt.Errorf("invalid object key")
	}
	_, err := s.client.DeleteObject(context.Background(), &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("delete failed: %w", err)
	}
	return nil
}
