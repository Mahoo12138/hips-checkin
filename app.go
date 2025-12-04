package main

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// --- Secure Storage Implementation ---

const (
	appName       = "hips-checkin"
	tokenFileName = "token.enc"
	// In a real production app, this key should be derived from user input or system keychain.
	// For this exercise, we use a fixed salt mixed with system info if possible, or just a fixed key.
	staticKey = "hips-checkin-secret-key-2025"
)

func (a *App) getStoragePath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(configDir, appName)
	if err := os.MkdirAll(appDir, 0700); err != nil {
		return "", err
	}
	return filepath.Join(appDir, tokenFileName), nil
}

func getEncryptionKey() []byte {
	hasher := md5.New()
	hasher.Write([]byte(staticKey))
	return hasher.Sum(nil)
}

func encrypt(data []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, data, nil), nil
}

func decrypt(data []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

// SaveToken securely saves the access token
func (a *App) SaveToken(token string) error {
	path, err := a.getStoragePath()
	if err != nil {
		return err
	}
	encrypted, err := encrypt([]byte(token), getEncryptionKey())
	if err != nil {
		return err
	}
	return os.WriteFile(path, encrypted, 0600)
}

// GetToken retrieves the access token
func (a *App) GetToken() (string, error) {
	path, err := a.getStoragePath()
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	decrypted, err := decrypt(data, getEncryptionKey())
	if err != nil {
		return "", err
	}
	return string(decrypted), nil
}

// DeleteToken removes the access token
func (a *App) DeleteToken() error {
	path, err := a.getStoragePath()
	if err != nil {
		return err
	}
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil
	}
	return os.Remove(path)
}
