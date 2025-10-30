document.addEventListener("DOMContentLoaded", () => {
  const membersList = document.getElementById("members-list");
  const memberModal = document.getElementById("member-detail-modal");
  const memberDetails = document.getElementById("member-details");
  const memberModalActions = document.getElementById("member-modal-actions");
  const groupCard = document.getElementById("group-card");
  const groupId = groupCard?.dataset.groupId;

  const currentMemberId = groupCard?.dataset.currentMemberId;
  const isCurrentUserAdmin = groupCard?.dataset.isAdmin === "true";

  if (membersList) {
    membersList.addEventListener("click", (e) => {
      const memberItem = e.target.closest(".member-item");
      if (!memberItem) return;

      const memberData = {
        id: memberItem.dataset.memberId,
        userId: memberItem.dataset.userId,
        username: memberItem.dataset.username,
        isAdmin: memberItem.dataset.isAdmin === "true",
        firstName: memberItem.dataset.firstName,
        lastName: memberItem.dataset.lastName,
        email: memberItem.dataset.email,
      };

      showMemberDetails(memberData);
    });
  }

  function showMemberDetails(member) {
    document.getElementById(
      "member-modal-title"
    ).textContent = `${member.username}'s Details`;

    memberDetails.innerHTML = `
            <div class="member-detail-row">
                <span class="member-detail-label">Username</span>
                <span class="member-detail-value">${member.username}</span>
            </div>
            ${
              member.firstName || member.lastName
                ? `
            <div class="member-detail-row">
                <span class="member-detail-label">Name</span>
                <span class="member-detail-value">${member.firstName} ${member.lastName}</span>
            </div>
            `
                : ""
            }
            <div class="member-detail-row">
                <span class="member-detail-label">Email</span>
                <span class="member-detail-value">${member.email}</span>
            </div>
            <div class="member-detail-row">
                <span class="member-detail-label">Role</span>
                <span class="member-detail-value">${
                  member.isAdmin ? "Admin" : "Member"
                }</span>
            </div>
        `;

    if (isCurrentUserAdmin && member.id !== currentMemberId) {
      memberModalActions.innerHTML = `
                <button class="btn btn-secondary close-member-modal-btn" type="button">Close</button>
                ${
                  !member.isAdmin
                    ? `
                    <button class="btn btn-primary" onclick="promoteMember('${member.id}')" type="button">Promote to Admin</button>
                `
                    : `
                    <button class="btn btn-warning" onclick="demoteMember('${member.id}')" type="button">Demote to Member</button>
                `
                }
                <button class="btn btn-danger" onclick="removeMember('${
                  member.id
                }')" type="button">Remove from Group</button>
            `;
    } else {
      memberModalActions.innerHTML = `
                <button class="btn btn-secondary close-member-modal-btn" type="button">Close</button>
            `;
    }

    const closeBtn = memberModalActions.querySelector(
      ".close-member-modal-btn"
    );
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal("member-detail-modal");
      });
    }

    openModal("member-detail-modal");
  }

  window.promoteMember = async (memberId) => {
    try {
      const response = await fetch(
        `/api/group-member/promote-admin/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to promote member");

      closeModal("member-detail-modal");
      window.dashboardUtils?.showSuccess("Member promoted to admin!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      window.dashboardUtils?.showError(error.message);
    }
  };

  window.demoteMember = async (memberId) => {
    try {
      const response = await fetch(
        `/api/group-member/demote-admin/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to demote member");

      closeModal("member-detail-modal");
      window.dashboardUtils?.showSuccess("Member demoted!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      window.dashboardUtils?.showError(error.message);
    }
  };

  window.removeMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(
        `/api/group-member/remove-member/${memberId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to remove member");

      closeModal("member-detail-modal");
      window.dashboardUtils?.showSuccess("Member removed!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      window.dashboardUtils?.showError(error.message);
    }
  };
});
