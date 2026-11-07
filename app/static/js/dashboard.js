import { NOTIFICATION_TEMPLATES, SEVERITY_STYLES } from './notificationsConfig.js';

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
    const notificationBtn = document.getElementById("notificationBtn");
    const closeNotificationBtn = document.getElementById("closeNotificationBtn");
    const drawerCount = document.getElementById("notDrawerCount");
    const drawer = document.getElementById("notificationDrawer");

    let reservations = [];
    let targetReservation = null;
    let editingReservationId = null;
    let selectedCheckInDate = null;
    let selectedCheckOutDate = null;
    let currentMonthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    function toggleNotificationDrawer() {
        if (drawer.classList.contains("w-0")) {
            // Abre o painel lateral
            drawer.classList.remove("w-0");
            drawer.classList.add("w-[350px]");
        } else {
            // Fecha o painel lateral
            drawer.classList.remove("w-[350px]");
            drawer.classList.add("w-0");
        }
    }

    function renderNotificationItem(notification) {
        const template = NOTIFICATION_TEMPLATES[notification.code] || NOTIFICATION_TEMPLATES.DEFAULT;
        const styles = SEVERITY_STYLES[template.severity] || SEVERITY_STYLES.info;

        return `
            <div class="p-3.5 border rounded-lg transition-all ${styles.container} shadow-sm">
            <div class="flex items-center justify-between mb-1.5">
                <h4 class="font-bold text-xs">${template.title}</h4>
                <span class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${styles.badge}">
                ${template.severity}
                </span>
            </div>
            <p class="text-xs opacity-90 leading-relaxed mb-3">
                ${template.description}
            </p>
            <div class="text-right">
                <a href="${template.actionUrl}" 
                class="text-xs font-semibold underline underline-offset-2 ${styles.btn} transition-colors">
                ${template.actionText} &rarr;
                </a>
            </div>
            </div>
        `;
    }
    
    function updateNotificationDrawerCount(count) {
        if (!drawerCount) return;
        if (count === 0) {
            drawerCount.textContent = "0 Novas";
            drawerCount.classList.add("hidden");
        } else {
            drawerCount.classList.remove("hidden");
            drawerCount.textContent = `${count} Novas`;
        }
    }

    function renderNotificationList(notifications) {
        const container = document.getElementById("notificationsListContainer");
        if (!container) return;

        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <p class="text-xs">Não tem notificações pendentes.</p>
            </div>
            `;
            return;
        }

        container.innerHTML = notifications
        .map(item => renderNotificationItem(item))
        .join("");
    }
                

    async function loadNotifications() {
        try {
            const response = await fetch("/notifications");
            if (!response.ok) throw new Error("Falha ao obter notificações");

            const responseData = await response.json();
            const notifications = responseData.notifications || [];
            updateNotificationDrawerCount(notifications.length);
            // Atualiza o número no badge do sino
            updateNotificationBadge(notifications.length);

            // Renderiza a lista na gaveta
            renderNotificationList(notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
        }

    if (closeNotificationBtn) {
        closeNotificationBtn.addEventListener("click", () => {
            drawer.classList.remove("w-[350px]");
            drawer.classList.add("w-0");
        });
    }
    
    function updateNotificationBadge(count) {
        const badge = document.querySelector("#notificationBtn span");
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden"); 
        }
    }

    if (notificationBtn) {
        notificationBtn.addEventListener("click", async () => {
            // Abre a gaveta de imediato
            toggleNotificationDrawer();

            // Atualiza os dados
            await loadNotifications();
        });
    }



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

    function openReservationDatePicker(reservation) {
        editingReservationId = reservation.id;
        selectedCheckInDate = reservation.check_in ? String(reservation.check_in).slice(0, 10) : null;
        selectedCheckOutDate = reservation.check_out ? String(reservation.check_out).slice(0, 10) : null;

        const referenceDate = selectedCheckInDate || selectedCheckOutDate;
        if (referenceDate) {
            const [year, month] = referenceDate.split("-").map(Number);
            currentMonthCursor = new Date(year, month - 1, 1);
        }

        renderDatePicker();
        if (dateDialog) {
            dateDialog.showModal();
        }
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

        const pendingCount = reservations.filter(r => r.status === "Pending" || r.status === "Completed").length;
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
            const isCompleted = String(reservation.status || "").trim().toLowerCase() === "completed";
            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 transition-colors cursor-pointer";
            row.dataset.reservationId = reservation.id;
            row.addEventListener("click", (event) => {
                if (event.target.closest("a, button, input, select, textarea")) {
                    return;
                }

                openReservationDatePicker(reservation);
            });
            row.innerHTML = `
                <td class="py-3 px-4 text-center font-mono font-medium text-blue-600">${reservation.id}</td>
                <td class="py-3 px-4 text-center font-medium text-slate-800">${reservation.guest_name}</td>
                <td class="py-3 px-4 text-center">${reservation.guest_count}</td>
                <td class="py-3 px-4 text-center">${reservation.check_in || "-"}
                   <button
                        type="button"
                        data-id="${reservation.id}"
                        class="edit-dates-btn inline-flex items-center justify-center p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar datas da reserva"
                        aria-label="Editar datas da reserva ${reservation.id}"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </td>
                <td class="py-3 px-4 text-center">${reservation.check_out || "-"}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ${reservation.status}
                    </span>
                </td>
                <td class="py-3 px-4 text-center space-x-2">
 
                    <a
                        href="${isCompleted
                            ? `/checkin/edit/${reservation.access_token}`
                            : `/checkin/${reservation.access_token}`}"
                        class="${isCompleted
                            ? "text-emerald-600 hover:text-emerald-800"
                            : "text-slate-600 hover:text-blue-600"} font-medium"
                    >${isCompleted ? "Editar" : "Link Forms"}</a>
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
            editingReservationId = null;
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
                const isEditing = editingReservationId !== null;
                const url = isEditing
                    ? `/api/reservations/${editingReservationId}`
                    : "/api/reservations/";
                const res = await fetch(url, {
                    method: isEditing ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(isEditing ? {
                        check_in: checkInDate || null,
                        check_out: checkOutDate || null
                    } : {
                        guest_name: "Pending " + (reservations.length + 1),
                        guest_count: 1,
                        check_in: checkInDate || null,
                        check_out: checkOutDate || null,
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

                const savedReservation = await res.json();
                if (isEditing) {
                    reservations = reservations.map((reservation) =>
                        String(reservation.id) === String(editingReservationId)
                            ? savedReservation
                            : reservation
                    );
                } else {
                    reservations.push(savedReservation);
                }
                renderReservations();
                resetDateSelection();
                editingReservationId = null;
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
        t.addEventListener("click", (event) => {
            const editDatesBtn = event.target.closest(".edit-dates-btn");
            if (editDatesBtn) {
                const reservation = reservations.find(
                    (item) => String(item.id) === String(editDatesBtn.dataset.id)
                );
                if (reservation) {
                    openReservationDatePicker(reservation);
                }
                return;
            }

            const delBtn = event.target.closest(".delete-btn");
            if (delBtn) {
                openDeleteModal(delBtn.dataset.id);
            }
        });
    }

    fetchReservations();
    loadNotifications();

    renderDatePicker();
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            fetchReservations();
        }
    });
});