document.addEventListener("DOMContentLoaded", () => {
    const updatesBtn = document.getElementById("saveProfileBtn");

    updatesBtn?.addEventListener("click", async (event) => {
        event.preventDefault();
        const name = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;

        try {
            const responde = await fetch("/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ full_name: name, email: email })
            });

            if (!responde.ok) {
                throw new Error("Failed to update profile");
            }

            const updatedProfile = await responde.json();
            console.log("Profile updated:", updatedProfile);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    });
});