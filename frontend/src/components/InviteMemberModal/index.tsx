import { useState, useEffect } from "react";
import { validateInviteMemberForm, isValidForm } from "../../utils/validation";
import "./InviteMemberModal.scss";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isLoading?: boolean;
  error?: string;
}

/**
 * InviteMemberModal component
 * Modal for inviting members to a board by email
 */
const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setLocalError("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const errors = validateInviteMemberForm(email);

    if (!isValidForm(errors)) {
      setLocalError(errors.email || "");
      return;
    }

    onSubmit(email.trim());
  };

  const handleClose = () => {
    setEmail("");
    setLocalError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Member</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="memberEmail" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="memberEmail"
                className="form-input"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <p className="form-help">
                Enter the email address of the person you want to invite. They
                must already have an account.
              </p>
            </div>

            {(error || localError) && (
              <div className="error-message">{error || localError}</div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? "Inviting..." : "Invite Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
