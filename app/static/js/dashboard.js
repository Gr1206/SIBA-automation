document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("newReservation");
    const t = document.getElementById("reservationsTable");
    const totalReserv = document.getElementById("totalReserv");
    const totalPend = document.getElementById("totalPend");
    const totalEnv = document.getElementById("totalEnv");
    const totalErr = document.getElementById("totalErr");
    const modal = document.getElementById("deleteConfirmModal");
    const cancelBtn = document.getElementById("cancelDeleteBtn");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const dateDialog = document.getElementById("datePickerDialog");
    const closeDialogBtn = document.getElementById("closeDatePickerBtn");
    const applyDateBtn = document.getElementById("applyDatesBtn");
    const clearDatesBtn = document.getElementById("clearDatesBtn");
    const prevMonthBtn = document.getElementById("prevMonthBtn");
    const nextMonthBtn = document.getElementById("nextMonthBtn");
    const monthTitleA = document.getElementById("monthTitleA");
    const monthTitleB = document.getElementById("monthTitleB");
    const monthCalendarOne = document.getElementById("monthCalendarOne");
    const monthCalendarTwo = document.getElementById("monthCalendarTwo");

    let reservations = [];
    let targetReservation = null;
    let selectedCheckInDate = null;
    let selectedCheckOutDate = null;
    let currentMonthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    function formatDisplayDate(dateString) {
        if (!dateString) {
            return "-- / -- / ----";
        }

        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function updateDateSummary() {
        const summaryCheckIn = document.getElementById("summaryCheckIn");
        const summaryCheckOut = document.getElementById("summaryCheckOut");

        if (summaryCheckIn) {
            summaryCheckIn.textContent = formatDisplayDate(selectedCheckInDate);
        }
        if (summaryCheckOut) {
            summaryCheckOut.textContent = formatDisplayDate(selectedCheckOutDate);
        }
    }

    function resetDateSelection() {
        selectedCheckInDate = null;
        selectedCheckOutDate = null;
        updateDateSummary();
        renderDatePicker();
    }

    function buildCalendarDays(monthDate) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = firstDayOfMonth.getDay();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const cells = [];

        for (let i = startWeekday - 1; i >= 0; i--) {
            cells.push({
                value: prevMonthDays - i,
                date: null,
                isCurrentMonth: false
            });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            cells.push({
                value: day,
                date: new Date(year, month, day),
                isCurrentMonth: true
            });
        }

        while (cells.length % 7 !== 0) {
            cells.push({
                value: cells.length % 7 + 1,
                date: null,
                isCurrentMonth: false
            });
        }

        return cells;
    }

    function renderDatePicker() {
        if (!monthTitleA || !monthTitleB || !monthCalendarOne || !monthCalendarTwo) {
            return;
        }

        const monthOne = new Date(currentMonthCursor.getFullYear(), currentMonthCursor.getMonth(), 1);
        const monthTwo = new Date(currentMonthCursor.getFullYear(), currentMonthCursor.getMonth() + 1, 1);

        monthTitleA.textContent = monthOne.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
        monthTitleB.textContent = monthTwo.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

        monthCalendarOne.innerHTML = buildCalendarDays(monthOne)
            .map((cell) => {
                if (!cell.date) {
                    return '<span class="day empty"></span>';
                }

                const isoDate = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}`;
                const isSelected = selectedCheckInDate === isoDate || selectedCheckOutDate === isoDate;
                const isInRange = selectedCheckInDate && selectedCheckOutDate &&
                    isoDate > selectedCheckInDate && isoDate < selectedCheckOutDate;
                const isCheckIn = selectedCheckInDate === isoDate;
                const isCheckOut = selectedCheckOutDate === isoDate;

                return `
                    <button
                        type="button"
                        class="day ${cell.isCurrentMonth ? "current" : "muted"} ${isSelected ? "selected" : ""} ${isInRange ? "range" : ""} ${isCheckIn ? "check-in" : ""} ${isCheckOut ? "check-out" : ""}"
                        data-date="${isoDate}"
                        aria-label="Selecionar data ${isoDate}"
                    >
                        ${cell.value}
                    </button>
                `;
            })
            .join("");

        monthCalendarTwo.innerHTML = buildCalendarDays(monthTwo)
            .map((cell) => {
                if (!cell.date) {
                    return '<span class="day empty"></span>';
                }

                const isoDate = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}`;
                const isSelected = selectedCheckInDate === isoDate || selectedCheckOutDate === isoDate;
                const isInRange = selectedCheckInDate && selectedCheckOutDate &&
                    isoDate > selectedCheckInDate && isoDate < selectedCheckOutDate;
                const isCheckIn = selectedCheckInDate === isoDate;
                const isCheckOut = selectedCheckOutDate === isoDate;

                return `
                    <button
                        type="button"
                        class="day ${cell.isCurrentMonth ? "current" : "muted"} ${isSelected ? "selected" : ""} ${isInRange ? "range" : ""} ${isCheckIn ? "check-in" : ""} ${isCheckOut ? "check-out" : ""}"
                        data-date="${isoDate}"
                        aria-label="Selecionar data ${isoDate}"
                    >
                        ${cell.value}
                    </button>
                `;
            })
            .join("");

        updateDateSummary();
    }

    function handleDatesClick(dataString) {
        const clickedDate = new Date(`${dataString}T00:00:00`);

        if (!selectedCheckInDate || (selectedCheckInDate && selectedCheckOutDate)) {
            selectedCheckInDate = dataString;
            selectedCheckOutDate = null;
        } else if (selectedCheckInDate && !selectedCheckOutDate) {
            if (clickedDate > new Date(`${selectedCheckInDate}T00:00:00`)) {
                selectedCheckOutDate = dataString;
            } else {
                selectedCheckInDate = dataString;
                selectedCheckOutDate = null;
            }
        }

        renderDatePicker();
    }

    function renderReservations() {
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

        if (!t) {
            return;
        }

        t.innerHTML = "";
        reservations.forEach((reservation) => {
            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 transition-colors";
            row.innerHTML = `
                <td class="py-3 px-4 text-center font-mono font-medium text-blue-600">${reservation.id}</td>
                <td class="py-3 px-4 text-center font-medium text-slate-800">${reservation.guest_name}</td>
                <td class="py-3 px-4 text-center">${reservation.guest_count}</td>
                <td class="py-3 px-4 text-center">${reservation.check_in || "-"}</td>
                <td class="py-3 px-4 text-center">${reservation.check_out || "-"}</td>
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

    function openDeleteModal(reservationId) {
        targetReservation = reservationId;
        if (modal) {
            modal.showModal();
        }
    }

    async function deleteReservationDB(reservationId) {
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

    if (btn && dateDialog) {
        btn.addEventListener("click", (event) => {
            event.preventDefault();
            resetDateSelection();
            dateDialog.showModal();
        });
    }

    if (closeDialogBtn) {
        closeDialogBtn.addEventListener("click", () => {
            dateDialog.close();
        });
    }

    if (clearDatesBtn) {
        clearDatesBtn.addEventListener("click", () => {
            resetDateSelection();
        });
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener("click", () => {
            currentMonthCursor = new Date(currentMonthCursor.getFullYear(), currentMonthCursor.getMonth() - 1, 1);
            renderDatePicker();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener("click", () => {
            currentMonthCursor = new Date(currentMonthCursor.getFullYear(), currentMonthCursor.getMonth() + 1, 1);
            renderDatePicker();
        });
    }

    if (dateDialog) {
        dateDialog.addEventListener("click", (event) => {
            const rect = dateDialog.getBoundingClientRect();
            const isInDialog = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );

            if (!isInDialog) {
                dateDialog.close();
            }
        });
    }

    if (dateDialog) {
        dateDialog.addEventListener("click", (event) => {
            const dayButton = event.target.closest(".day[data-date]");
            if (dayButton) {
                handleDatesClick(dayButton.dataset.date);
            }
        });
    }

    if (applyDateBtn) {
        applyDateBtn.addEventListener("click", async () => {
            const checkInDate = selectedCheckInDate;
            const checkOutDate = selectedCheckOutDate;

            if (!checkInDate && !checkOutDate) {
                alert("Por favor, selecione pelo menos uma data.");
                return;
            }

            try {
                const res = await fetch("/api/reservations/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        guest_name: "Pending " + (reservations.length + 1),
                        guest_count: 1,
                        check_in: checkInDate || null,
                        check_out: checkOutDate || null,
                        status: "Pending",
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
                reservations.push(novaReserva);
                renderReservations();
                resetDateSelection();
                dateDialog.close();
            } catch (error) {
                console.error("Error adding new reservation:", error);
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            if (modal) {
                modal.close();
            }
            targetReservation = null;
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            if (targetReservation) {
                await deleteReservationDB(targetReservation);
                if (modal) {
                    modal.close();
                }
                targetReservation = null;
            }
        });
    }

    if (t) {
        t.addEventListener("click", async (event) => {
            const delBtn = event.target.closest(".delete-btn");
            if (delBtn) {
                const reservationId = delBtn.dataset.id;
                openDeleteModal(reservationId);
            }
        });
    }

    fetchReservations();
    renderDatePicker();
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            fetchReservations();
        }
    });
});