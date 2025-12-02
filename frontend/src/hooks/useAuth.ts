import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService";
import type {
  LoginCredentials,
  SignupCredentials,
  AuthError,
} from "../types/auth";

export const useAuth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: () => {
      setError("");
      navigate("/dashboard");
    },
    onError: (err: any) => {
      const errorData = err.response?.data as AuthError;
      setError(errorData?.message || "Login failed. Please try again.");
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (credentials: SignupCredentials) =>
      authService.signup(credentials),
    onSuccess: () => {
      setError("");
      navigate("/dashboard"); // Redirect to dashboard after successful signup
    },
    onError: (err: any) => {
      const errorData = err.response?.data as AuthError;

      // Handle validation errors from backend
      if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        setError(
          Array.isArray(firstError) ? firstError[0] : String(firstError)
        );
      } else {
        setError(errorData?.message || "Signup failed. Please try again.");
      }
    },
  });

  // Logout function
  const logout = () => {
    authService.logout();
    navigate("/login");
  };

  return {
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || signupMutation.isPending,
    error,
    setError,
    isAuthenticated: authService.isAuthenticated,
    currentUser: authService.getCurrentUser(),
  };
};
