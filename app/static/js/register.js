document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    registerForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch("/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ full_name: name, email, password })
            });
            
  
            const data = await response.json();
            if(!response.ok) {
                alert(data.detail || data.message || "Registration failed");
                return;
            }
            console.log("Registration successful:", data);
            window.location.replace("/dashboard");
        
        } catch (error) {
            console.error("Error during registration:", error);
            alert("Registration failed. Please try again.");
        }
    });
});