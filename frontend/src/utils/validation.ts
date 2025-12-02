/**
 * Validation utilities for form inputs
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - removes formatting characters and checks for 10-15 digits
const PHONE_DIGITS_REGEX = /^\d{10,15}$/;

/**
 * Validates an email address
 * @param email - Email string to validate
 * @returns true if email is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validates a phone number (optional but validates if provided)
 * Accepts phone numbers with 10-15 digits, ignoring formatting characters
 * @param phone - Phone number string to validate
 * @returns true if phone is valid or empty, false otherwise
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) {
    return true; // Phone is optional
  }
  const phoneDigits = phone.replace(/[\s\-\(\)\+]/g, "");
  return PHONE_DIGITS_REGEX.test(phoneDigits);
};

/**
 * Validates a password meets minimum length requirement
 * @param password - Password string to validate
 * @param minLength - Minimum length (default 8)
 * @returns true if password meets length requirement
 */
export const validatePassword = (
  password: string,
  minLength: number = 8
): boolean => {
  return password.length >= minLength;
};

/**
 * Validates that two passwords match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns true if passwords match
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

/**
 * Validates a name field
 * @param name - Name string to validate
 * @param minLength - Minimum length (default 2)
 * @returns true if name meets requirements
 */
export const validateName = (name: string, minLength: number = 2): boolean => {
  return name.trim().length >= minLength;
};

/**
 * Validates a required field (non-empty after trimming)
 * @param value - Value to validate
 * @returns true if value is not empty
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates a board name
 * @param name - Board name to validate
 * @param minLength - Minimum length (default 1)
 * @param maxLength - Maximum length (default 100)
 * @returns true if name meets requirements
 */
export const validateBoardName = (
  name: string,
  minLength: number = 1,
  maxLength: number = 100
): boolean => {
  const trimmedName = name.trim();
  return trimmedName.length >= minLength && trimmedName.length <= maxLength;
};

/**
 * Validates a list title
 * @param title - List title to validate
 * @param minLength - Minimum length (default 1)
 * @param maxLength - Maximum length (default 100)
 * @returns true if title meets requirements
 */
export const validateListTitle = (
  title: string,
  minLength: number = 1,
  maxLength: number = 100
): boolean => {
  const trimmedTitle = title.trim();
  return trimmedTitle.length >= minLength && trimmedTitle.length <= maxLength;
};

/**
 * Validation errors interface
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validates login form data
 * @param email - Email address
 * @param password - Password
 * @returns Object with validation errors (empty if valid)
 */
export const validateLoginForm = (
  email: string,
  password: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!validateRequired(email)) {
    errors.email = "Email is required";
  } else if (!validateEmail(email)) {
    errors.email = "Please enter a valid email";
  }

  if (!validateRequired(password)) {
    errors.password = "Password is required";
  }

  return errors;
};

/**
 * Validates signup form data
 * @param data - Signup form data
 * @returns Object with validation errors (empty if valid)
 */
export const validateSignupForm = (data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Name validation
  if (!validateRequired(data.name)) {
    errors.name = "Name is required";
  } else if (!validateName(data.name, 2)) {
    errors.name = "Name must be at least 2 characters";
  }

  // Email validation
  if (!validateRequired(data.email)) {
    errors.email = "Email is required";
  } else if (!validateEmail(data.email)) {
    errors.email = "Please enter a valid email";
  }

  // Phone validation (optional)
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = "Phone number must be 10-15 digits";
  }

  // Password validation
  if (!validateRequired(data.password)) {
    errors.password = "Password is required";
  } else if (!validatePassword(data.password, 8)) {
    errors.password = "Password must be at least 8 characters";
  }

  // Confirm password validation
  if (!validateRequired(data.confirmPassword)) {
    errors.confirmPassword = "Please confirm your password";
  } else if (!validatePasswordMatch(data.password, data.confirmPassword)) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

/**
 * Validates board creation/update form
 * @param name - Board name
 * @returns Object with validation errors (empty if valid)
 */
export const validateBoardForm = (name: string): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!validateRequired(name)) {
    errors.name = "Board name is required";
  } else if (!validateBoardName(name)) {
    errors.name = "Board name must be between 1 and 100 characters";
  }

  return errors;
};

/**
 * Validates member invitation form
 * @param email - Email address
 * @returns Object with validation errors (empty if valid)
 */
export const validateInviteMemberForm = (email: string): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!validateRequired(email)) {
    errors.email = "Email is required";
  } else if (!validateEmail(email)) {
    errors.email = "Please enter a valid email address";
  }

  return errors;
};

/**
 * Validates list creation/update form
 * @param title - List title
 * @returns Object with validation errors (empty if valid)
 */
export const validateListForm = (title: string): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!validateRequired(title)) {
    errors.title = "List title is required";
  } else if (!validateListTitle(title)) {
    errors.title = "List title must be between 1 and 100 characters";
  }

  return errors;
};

/**
 * Checks if validation errors object has any errors
 * @param errors - Validation errors object
 * @returns true if there are no errors, false otherwise
 */
export const isValidForm = (errors: ValidationErrors): boolean => {
  return Object.values(errors).every((error) => error === "");
};
