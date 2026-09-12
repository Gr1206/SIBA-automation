document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("newReservation");
    const t = document.getElementById("reservationsTable");
    const totalReserv = document.getElementById("totalReserv");
    const totalPend = document.getElementById("totalPend");
    const totalEnv = document.getElementById("totalEnv");
    const totalErr = document.getElementById("totalErr");
    let reservations = []; //Array of reservations
    //podia ter um struct com o status da reservation    

    function renderReservations() {
        //refactor : colocar noutro file talvez
        if (totalReserv) {
            totalReserv.textContent = reservations.length;
        }
        const pendingCount = reservations.filter(r => r.status === "Pending").length;
        if (totalPend) {
            totalPend.textContent = pendingCount;
        }
        const sentCount = reservations.filter(r => r.status === "Sent").length;
        if (totalEnv) {
            totalEnv.textContent = sentCount;
        }
        const errorCount = reservations.filter(r => r.status === "Error").length;
        if (totalErr) {
            totalErr.textContent = errorCount;
        }
        t.innerHTML = "";
        reservations.forEach((reservation, index) => {
            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 transition-colors";
            row.innerHTML = `
                <td class="py-3 px-4 font-mono font-medium text-blue-600">${reservation.code}</td>
                <td class="py-3 px-4 font-medium text-slate-800">${reservation.guest_name}</td>
                <td class="py-3 px-4">${reservation.guest_count}</td>
                <td class="py-3 px-4">${reservation.check_in}</td>
                <td class="py-3 px-4">${reservation.check_out}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ${reservation.status}
                    </span>
                </td>
                <td class="py-3 px-4 text-right space-x-2">
                    <a href="/checkin/${reservation.id}" class="text-slate-600 hover:text-blue-600 font-medium">Link Forms</a>
                </td>
            `;
           
            t.appendChild(row);
        });
        //I need to render the status based on length of reservations array
    } 

    async function fetchReservations() {
        try {
            const response = await fetch("/api/reservations/");
            reservations = await response.json();
            renderReservations();
        } catch (error) {
            console.error("Error fetching reservations:", error);
        }
    }
    document.addEventListener("DOMContentLoaded", fetchReservations);

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            fetchReservations();
        }
    });


    function updateReservationDB(reservation) {
        //handle db update for reservation
    }

    function deleteReservationDB(reservationId) {
        //handle db delete for reservation
    }
            
    btn.addEventListener("click", async () => {
        //add new table row with pending state
        try {
            const res = await fetch("/api/reservations/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code: reservations.length + 1,
                    guest_name: "Pending " + (reservations.length + 1),
                    guest_count: 1,
                    check_in: null,
                    check_out: null,
                    status: "Pending"
                })
            });
            
            const novaReserva = await res.json();
            reservations.push(novaReserva);
            renderReservations();
        } catch (error) {
            console.error("Error adding new reservation:", error);
        }

    });
    fetchReservations();
});