document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("expense-management-container");
  if (!container) return;

  const groupID = container.dataset.groupId;

  const expenseFormModal = document.getElementById("expense-form-modal");
  const contributionModal = document.getElementById("contribution-modal");

  const expenseForm = document.getElementById("expense-form");
  const contributionForm = document.getElementById("contribution-form");

  const addNewExpenseBtn = document.getElementById("add-new-expense-btn");
  const cancelExpenseBtn = document.getElementById("cancel-expense-btn");
  const cancelContributionBtn = document.getElementById(
    "cancel-contribution-btn"
  );

  const apiCall = async (url, method, payload) => {
    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData.message);
        throw new Error(errorData.message || "An API error occurred.");
      }

      return await response.json();
    } catch (error) {
      console.error("Network or Server Error:", error.message);
      throw error;
    }
  };

  const showModal = (modalElement) => {
    if (modalElement) {
      modalElement.classList.remove("hidden");
    }
  };

  const hideModal = (modalElement) => {
    if (modalElement) {
      modalElement.classList.add("hidden");
    }
  };

  const resetExpenseForm = () => {
    if (expenseForm) {
      expenseForm.reset();
    }

    const modalTitle = document.getElementById("expense-modal-title");
    const expenseId = document.getElementById("expense-id");
    const submitBtn = document.getElementById("submit-expense-btn");

    if (modalTitle) modalTitle.textContent = "Add New Expense";
    if (expenseId) expenseId.value = "";
    if (submitBtn) submitBtn.textContent = "Save Expense";
  };

  if (addNewExpenseBtn) {
    addNewExpenseBtn.addEventListener("click", () => {
      resetExpenseForm();
      showModal(expenseFormModal);
    });
  }

  if (cancelExpenseBtn) {
    cancelExpenseBtn.addEventListener("click", () => {
      hideModal(expenseFormModal);
      resetExpenseForm();
    });
  }

  if (cancelContributionBtn) {
    cancelContributionBtn.addEventListener("click", () => {
      hideModal(contributionModal);
      if (contributionForm) {
        contributionForm.reset();
      }
    });
  }

  if (expenseFormModal) {
    expenseFormModal.addEventListener("click", (e) => {
      if (e.target === expenseFormModal) {
        hideModal(expenseFormModal);
        resetExpenseForm();
      }
    });
  }

  if (contributionModal) {
    contributionModal.addEventListener("click", (e) => {
      if (e.target === contributionModal) {
        hideModal(contributionModal);
        if (contributionForm) {
          contributionForm.reset();
        }
      }
    });
  }

  container.addEventListener("click", async (e) => {
    const targetCard = e.target.closest(".expense-card");
    const expenseId = targetCard ? targetCard.dataset.expenseId : null;

    if (e.target.closest(".expense-summary")) {
      const summary = e.target.closest(".expense-summary");
      const detailsId = summary.dataset.toggleId;
      const detailsElement = document.getElementById(detailsId);

      if (detailsElement) {
        detailsElement.classList.toggle("hidden");

        const expandIcon = summary.querySelector(".expand-icon");
        if (expandIcon) {
          expandIcon.style.transform = detailsElement.classList.contains(
            "hidden"
          )
            ? "rotate(0deg)"
            : "rotate(180deg)";
        }
      }
      return;
    }

    if (e.target.closest(".edit-expense-btn") && expenseId) {
      try {
        const response = await fetch(`/api/expense/${expenseId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch expense data");
        }

        const { expense } = await response.json();

        document.getElementById("expense-modal-title").textContent =
          "Edit Expense";
        document.getElementById("expense-id").value = expense.id;
        document.getElementById("expense-title").value = expense.title;
        document.getElementById("expense-description").value =
          expense.description || "";
        document.getElementById("expense-value").value = expense.value;
        document.getElementById("expense-currency").value = expense.currency;

        if (expense.due) {
          const dueDate = new Date(expense.due);
          document.getElementById("expense-due").value = dueDate
            .toISOString()
            .split("T")[0];
        }

        document.getElementById("expense-recurring").checked =
          expense.isRecurring;
        document.getElementById("expense-recurrence").value =
          expense.recurrenceInterval || "";
        document.getElementById("submit-expense-btn").textContent =
          "Update Expense";

        showModal(expenseFormModal);
      } catch (error) {
        console.error("Error fetching expense:", error);
        alert("Failed to load expense data. Please try again.");
      }
      return;
    }

    if (e.target.closest(".contribute-btn") && expenseId) {
      try {
        const response = await fetch(`/api/expense/${expenseId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch expense data");
        }

        const { expense } = await response.json();

        const totalContributed = expense.Contributions
          ? expense.Contributions.reduce((sum, c) => sum + c.value, 0)
          : 0;
        const balance = expense.value - totalContributed;

        if (balance <= 0) {
          alert("This expense is already fully paid!");
          return;
        }

        document.getElementById("contribution-expense-id").value = expense.id;
        document.getElementById("contribution-group-id").value = groupID;
        document.getElementById("contribution-expense-title").textContent =
          expense.title;
        document.getElementById(
          "contribution-expense-total"
        ).textContent = `${expense.value.toFixed(2)} ${expense.currency}`;
        document.getElementById(
          "contribution-expense-contributed"
        ).textContent = `${totalContributed.toFixed(2)} ${expense.currency}`;
        document.getElementById(
          "contribution-expense-balance"
        ).textContent = `${balance.toFixed(2)} ${expense.currency}`;
        document.getElementById(
          "max-contribution-hint"
        ).textContent = `${balance.toFixed(2)} ${expense.currency}`;

        const contributionInput = document.getElementById("contribution-value");
        contributionInput.max = balance.toFixed(2);
        contributionInput.value = "";

        if (contributionForm) {
          contributionForm.reset();

          document.getElementById("contribution-expense-id").value = expense.id;
          document.getElementById("contribution-group-id").value = groupID;
        }

        showModal(contributionModal);
      } catch (error) {
        console.error("Error fetching expense:", error);
        alert("Failed to load expense data. Please try again.");
      }
      return;
    }

    if (e.target.closest(".delete-expense-btn") && expenseId) {
      const confirmed = confirm(
        "Are you sure you want to delete this expense? This action cannot be undone."
      );

      if (confirmed) {
        try {
          await apiCall(`/api/expense/${expenseId}`, "DELETE", {});

          targetCard.remove();

          console.log("Expense deleted successfully");

          const remainingExpenses = container.querySelectorAll(".expense-card");
          if (remainingExpenses.length === 0) {
            window.location.reload();
          }
        } catch (error) {
          console.error("Delete failed:", error.message);
          alert("Failed to delete expense. Please try again.");
        }
      }
      return;
    }
  });

  if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(expenseForm);
      const expenseData = Object.fromEntries(formData.entries());

      expenseData.groupId = parseInt(groupID);

      expenseData.isRecurring = expenseData.isRecurring === "on";

      expenseData.value = parseFloat(expenseData.value);

      if (!expenseData.recurrenceInterval) {
        delete expenseData.recurrenceInterval;
      }

      if (!expenseData.due) {
        delete expenseData.due;
      }

      const isEdit = !!expenseData.id;
      const url = isEdit ? `/api/expense/${expenseData.id}` : `/api/expense`;
      const method = isEdit ? "PUT" : "POST";

      if (!isEdit) {
        delete expenseData.id;
      }

      try {
        const result = await apiCall(url, method, expenseData);

        console.log(`Expense ${isEdit ? "updated" : "created"} successfully`);

        hideModal(expenseFormModal);
        resetExpenseForm();

        window.location.reload();
      } catch (error) {
        console.error("Expense Save Failed:", error.message);
        alert(
          `Failed to ${isEdit ? "update" : "create"} expense. Please try again.`
        );
      }
    });
  }

  if (contributionForm) {
    contributionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(contributionForm);
      const contributionData = Object.fromEntries(formData.entries());

      const contributionValue = parseFloat(contributionData.value);
      contributionData.value = contributionValue;

      contributionData.expenseId = parseInt(contributionData.expenseId);

      contributionData.groupId = parseInt(contributionData.groupId);

      const maxContribution = parseFloat(
        document.getElementById("contribution-value").max
      );

      if (isNaN(contributionValue) || contributionValue <= 0) {
        alert("Please enter a valid contribution amount greater than 0.");
        return;
      }

      if (contributionValue > maxContribution) {
        alert(
          `Your contribution cannot exceed the remaining balance of ${maxContribution.toFixed(
            2
          )}.`
        );
        return;
      }

      try {
        const response = await apiCall(
          "/api/contribution",
          "POST",
          contributionData
        );

        const action = response.isUpdate ? "updated" : "created";
        const message = response.isUpdate
          ? "Your contribution has been updated successfully!"
          : "Contribution submitted successfully!";

        console.log(`Contribution ${action}:`, response.contribution);
        alert(message);

        hideModal(contributionModal);

        window.location.reload();
      } catch (error) {
        console.error("Contribution Save Failed:", error.message);
        alert("Failed to submit contribution. Please try again.");
      }
    });
  }
});

const recurringCheckbox = document.getElementById("expense-recurring");
const recurrenceGroup = document.getElementById("recurrence-group");

if (recurringCheckbox && recurrenceGroup) {
  recurringCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      recurrenceGroup.style.display = "block";
      document.getElementById("expense-recurrence").required = true;
    } else {
      recurrenceGroup.style.display = "none";
      document.getElementById("expense-recurrence").required = false;
      document.getElementById("expense-recurrence").value = "NONE";
    }
  });
}
