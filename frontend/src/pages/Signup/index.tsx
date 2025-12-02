import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  validateSignupForm,
  isValidForm,
  type ValidationErrors,
} from "../../utils/validation";
import "./Signup.scss";

export default function Signup() {
  const { signup, isLoading, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear general error
    if (error) {
      setError("");
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateSignupForm(formData);
    setValidationErrors(errors);

    if (isValidForm(errors)) {
      // Don't send confirmPassword to backend
      const { confirmPassword, ...signupData } = formData;

      // Remove phone if empty
      const finalData = signupData.phone.trim()
        ? signupData
        : {
            name: signupData.name,
            email: signupData.email,
            password: signupData.password,
          };

      signup(finalData);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1>Sign up for your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              className={validationErrors.name ? "error" : ""}
              disabled={isLoading}
              autoComplete="name"
            />
            {validationErrors.name && (
              <span className="field-error">{validationErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className={validationErrors.email ? "error" : ""}
              disabled={isLoading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number (optional)"
              value={formData.phone}
              onChange={handleChange}
              className={validationErrors.phone ? "error" : ""}
              disabled={isLoading}
              autoComplete="tel"
            />
            {validationErrors.phone && (
              <span className="field-error">{validationErrors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              className={validationErrors.password ? "error" : ""}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={validationErrors.confirmPassword ? "error" : ""}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <span className="field-error">
                {validationErrors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="login-link">
          <Link to="/login">Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  );
}
