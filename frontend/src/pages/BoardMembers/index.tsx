import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBoardMembers } from "../../hooks/useBoardMembers";
import { useBoardPermissions } from "../../hooks/useBoardPermissions";
import { getCurrentUser } from "../../services/authService";
import InviteMemberModal from "../../components/InviteMemberModal";
import MembersTable from "../../components/MembersTable";
import "./BoardMembers.scss";

const BoardMembers: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const {
    owner,
    members,
    isLoading,
    isError,
    inviteMember,
    isInviting,
    updateRole,
    isUpdatingRole,
    removeMember,
    isRemovingMember,
    error,
    setError,
  } = useBoardMembers(boardId || "");

  const { canManageMembers, isOwner } = useBoardPermissions(boardId);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  if (!boardId) {
    navigate("/dashboard");
    return null;
  }

  const handleInviteMember = (email: string) => {
    inviteMember(
      { email },
      {
        onSuccess: () => {
          setIsInviteModalOpen(false);
        },
      }
    );
  };

  const handleRoleChange = (
    userId: string,
    newRole: "admin" | "editor" | "viewer"
  ) => {
    updateRole({ userId, payload: { role: newRole } });
  };

  const handleRemoveMember = (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to remove this member from the board?"
      )
    ) {
      removeMember(userId);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleCloseModal = () => {
    setIsInviteModalOpen(false);
    setError("");
  };

  return (
    <div className="board-members">
      <header className="board-members__header">
        <div className="board-members__header-content">
          <button
            className="board-members__back-btn"
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <h1 className="board-members__title">Manage Board Members</h1>
        </div>
      </header>

      <main className="board-members__main">
        {isLoading && (
          <div className="board-members__loading">Loading members...</div>
        )}

        {isError && (
          <div className="board-members__error">
            Failed to load board members. Please try again.
          </div>
        )}

        {!isLoading && !isError && owner && (
          <>
            <div className="board-members__actions">
              {canManageMembers && (
                <button
                  className="board-members__invite-btn"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  + Invite Member
                </button>
              )}
            </div>

            <MembersTable
              owner={owner}
              members={members}
              isOwner={isOwner}
              isAdmin={canManageMembers}
              onRoleChange={handleRoleChange}
              onRemoveMember={handleRemoveMember}
              isUpdating={isUpdatingRole || isRemovingMember}
            />

            {!canManageMembers && (
              <div className="board-members__info">
                <p>
                  Only board admins and the owner can invite members or change
                  roles.
                </p>
              </div>
            )}
          </>
        )}

        {isUpdatingRole && (
          <div className="board-members__overlay">
            <div className="board-members__spinner">Updating role...</div>
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      {canManageMembers && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleInviteMember}
          isLoading={isInviting}
          error={error}
        />
      )}
    </div>
  );
};

export default BoardMembers;
