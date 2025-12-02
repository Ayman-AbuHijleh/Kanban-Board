import React from "react";
import "./RoleSelector.scss";

interface RoleSelectorProps {
  currentRole: "admin" | "editor" | "viewer";
  onRoleChange: (newRole: "admin" | "editor" | "viewer") => void;
  disabled?: boolean;
}

/**
 * RoleSelector component
 * Dropdown for selecting member roles
 */
const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  onRoleChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as "admin" | "editor" | "viewer";
    onRoleChange(newRole);
  };

  return (
    <select
      className="role-selector"
      value={currentRole}
      onChange={handleChange}
      disabled={disabled}
    >
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>
  );
};

export default RoleSelector;
