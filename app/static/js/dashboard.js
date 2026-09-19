document.addEventListener("DOMContentLoaded", () => {
    fetchReservations();
    const btn = document.getElementById("newReservation");
    const t = document.getElementById("reservationsTable");
    const totalReserv = document.getElementById("totalReserv");
    const totalPend = document.getElementById("totalPend");
    const totalEnv = document.getElementById("totalEnv");
    const totalErr = document.getElementById("totalErr");
    const modal = document.getElementById("deleteConfirmModal");
    const cancelBtn = document.getElementById("cancelDeleteBtn");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    let reservations = []; //Array of reservations
    let targetReservation = null;
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
            console.log("DADOS QUE CHEGARAM:", reservations);
            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 transition-colors";
            row.innerHTML = `
                <td class="py-3 px-4 text-center font-mono font-medium text-blue-600">${reservation.id}</td>
                <td class="py-3 px-4 text-center font-medium text-slate-800">${reservation.guest_name}</td>
                <td class="py-3 px-4 text-center">${reservation.guest_count}</td>
                <td class="py-3 px-4 text-center">${reservation.check_in}</td>
                <td class="py-3 px-4 text-center">${reservation.check_out}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ${reservation.status}
                    </span>
                </td>
                <td class="py-3 px-4 text-center space-x-2">
                    <a href="/checkin/${reservation.id}" class="text-slate-600 hover:text-blue-600 font-medium">Link Forms</a>
                    <button 
                        type="button"
                        data-id="${reservation.id}"
                        class="delete-btn text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Eliminar reserva"
                    >
                        X
                    </button>
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

            if (response.status === 401) {
                const htmlMidPage = await response.text();
                document.open();
                document.write(htmlMidPage);
                document.close();
                return;
            }

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

    function openDeleteModal(reservationId) {
        targetReservation = reservationId;
        modal.showModal();
    }
    
    cancelBtn.addEventListener("click", () => {
        modal.close();
        targetReservation = null;
    });

    confirmBtn.addEventListener("click", async () => {
        if (targetReservation) {
            await deleteReservationDB(targetReservation);
            modal.close();
            targetReservation = null;
        }
    });

    async function deleteReservationDB(reservationId) {
        //handle db delete for reservation

        try {
            const res = await fetch(`/api/reservations/${reservationId}`, {
                method: "DELETE"
            });
            if (res.status === 401) {
                const htmlMidPage = await res.text();

                document.open();
                document.write(htmlMidPage);
                document.close();
                
                return;
            }
            if (!res.ok) {
                throw new Error("Error deleting reservation");
            }
            reservations = reservations.filter(r => String(r.id) !== String(reservationId));
            renderReservations();
        } catch (error) {
            console.error("Error deleting reservation:", error);
        }
    }

    t?.addEventListener("click", async (event) => {
        const delBtn = event.target.closest(".delete-btn");
        if (delBtn) {
            const reservationId = delBtn.dataset.id;
            openDeleteModal(reservationId); //opens warning before
        }
    });
        
    btn.addEventListener("click", async () => {
        //add new table row with pending state
        try {
            const res = await fetch("/api/reservations/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    //code: reservations.length + 1,
                    guest_name: "Pending " + (reservations.length + 1),
                    guest_count: 1,
                    check_in: null,
                    check_out: null,
                    status: "Pending"
                })
            });

            if (res.status === 401) {
                const htmlMidPage = await res.text();
                document.open();
                document.write(htmlMidPage);
                document.close();
                return;
            }
            
            const novaReserva = await res.json();
            console.log("RESPOSTA DO POST:", novaReserva);
            console.log("ID DA RESERVA:", novaReserva.id);
            reservations.push(novaReserva);
            renderReservations();
        } catch (error) {
            console.error("Error adding new reservation:", error);
        }

    });    
  
    
});