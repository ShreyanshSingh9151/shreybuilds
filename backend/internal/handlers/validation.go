package handlers

import "fmt"

// errMissing returns a validation error for a missing required field.
func errMissing(field string) error {
	return fmt.Errorf("missing required field: %s", field)
}

// errInvalid returns a validation error for an invalid field value.
func errInvalid(field, reason string) error {
	return fmt.Errorf("invalid field '%s': %s", field, reason)
}
