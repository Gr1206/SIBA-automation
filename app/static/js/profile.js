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
            document.getElementById("sibaNif").value = profileData.nif || "";
            document.getElementById("propertyName").value = profileData.property_name || "";
            document.getElementById("propertyNumber").value = profileData.property_number || "";
            document.getElementById("abbreviation").value = profileData.abbreviation || "";
            document.getElementById("address").value = profileData.address || "";
            document.getElementById("city").value = profileData.city || "";
            document.getElementById("postalCode").value = profileData.postal_code || "";
            document.getElementById("postalZone").value = profileData.postal_zone || "";
            document.getElementById("telephone").value = profileData.telephone || "";
            document.getElementById("contactName").value = profileData.contact_name || "";
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
            const propertyName = document.getElementById("propertyName").value;
            const propertyNumber = document.getElementById("propertyNumber").value;
            const abbreviation = document.getElementById("abbreviation").value;
            const address = document.getElementById("address").value;
            const city = document.getElementById("city").value;
            const postalCode = document.getElementById("postalCode").value;
            const postalZone = document.getElementById("postalZone").value;
            const telephone = document.getElementById("telephone").value;
            const contactName = document.getElementById("contactName").value;
            const response = await fetch("/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    siba_code: sibaCode,
                    siba_key: sibaKey,
                    nif,
                    property_name: propertyName,
                    property_number: propertyNumber,
                    abbreviation,
                    address,
                    city,
                    postal_code: postalCode,
                    postal_zone: postalZone,
                    telephone,
                    contact_name: contactName
                })
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