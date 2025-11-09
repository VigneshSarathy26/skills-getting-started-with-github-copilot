document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participants = details.participants || [];
        let participantsHtml = "";
        if (participants.length === 0) {
          participantsHtml = `<p class="no-participants">No participants yet. Be the first to sign up!</p>`;
        } else {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${participants.map(p => `<li class="participant-item" title="${p}">
                    <span class="participant-email">${p}</span>
                    <button class="remove-participant" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✖</button>
                  </li>`).join("")}
              </ul>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="activity-desc">${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for participants in this activity card
        const removeButtons = activityCard.querySelectorAll('.remove-participant');
        removeButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const activityName = btn.dataset.activity;
            const email = btn.dataset.email;

            if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const body = await res.json();
              if (res.ok) {
                messageDiv.textContent = body.message || 'Participant removed';
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                // Refresh list to reflect removal
                fetchActivities();
              } else {
                messageDiv.textContent = body.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant shows up immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
