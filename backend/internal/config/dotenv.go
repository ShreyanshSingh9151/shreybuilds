package config

import (
	"bufio"
	"log"
	"os"
	"strings"
)

// LoadDotEnv reads a .env file and sets environment variables that are not
// already set. This is a minimal implementation — no dependency needed.
func LoadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		log.Printf("[config] No .env file found at %s — using system env only", path)
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	loaded := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		// Remove surrounding quotes if present
		value = strings.Trim(value, `"'`)

		// Only set if not already in environment (system env takes precedence)
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
			loaded++
		}
	}

	log.Printf("[config] Loaded %d variables from %s", loaded, path)
}
