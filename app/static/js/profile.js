document.addEventListener("DOMContentLoaded", () => {
    fetchProfileData();
    const updatesBtn = document.getElementById("saveProfileBtn");

    async function fetchProfileData() {
        try {
            const response = await fetch("/profile/data");
            
            if (response.status === 401) {
                const htmlMidPage = await response.text();
                document.open();
                document.write(htmlMidPage);
                document.close();
                return;
            }
            
            if (!response.ok) {
                throw new Error("Failed to fetch profile data");
            }
            const profileData = await response.json();
            document.getElementById("fullName").value = profileData.full_name || "";
            document.getElementById("email").value = profileData.email || "";
            document.getElementById("sibaCode").value = profileData.siba_code || "";
            //document.getElementById("sibaKey").value = profileData.siba_key || "";
            document.getElementById("sibaNif").value = profileData.nif || "";
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    }

    updatesBtn?.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
            const fullName = document.getElementById("fullName").value;
            const email = document.getElementById("email").value;
            const sibaCode = document.getElementById("sibaCode").value;
            const sibaKey = document.getElementById("sibaKey").value;
            const nif = document.getElementById("sibaNif").value;
            const response = await fetch("/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ full_name: fullName, email: email, siba_code: sibaCode, siba_key: sibaKey, nif: nif })
            });

            if(response.status === 401) {
                const htmlMidPage = await response.text();
                document.open();
                document.write(htmlMidPage);
                document.close();
                return;
            }

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

});