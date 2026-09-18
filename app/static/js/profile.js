document.addEventListener("DOMContentLoaded", () => {
    const updatesBtn = document.getElementById("saveProfileBtn");

    async function fetchProfileData() {
        try {
            const response = await fetch("/profile");
            if (!response.ok) {
                throw new Error("Failed to fetch profile data");
            }
            const profileData = await response.json();
            document.getElementById("fullName").value = profileData.full_name || "";
            document.getElementById("email").value = profileData.email || "";
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    }

    updatesBtn?.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
            const fullName = document.getElementById("fullName").value;
            const email = document.getElementById("email").value;

            const response = await fetch("/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ full_name: fullName, email: email })
            });

            if (!response.ok) {
                throw new Error("Failed to update profile data");
            }

            alert("Profile updated successfully!");
        }
        catch (error) {
            console.error("Error updating profile data:", error);
            alert("Failed to update profile. Please try again.");
        }
    });

    fetchProfileData();
});