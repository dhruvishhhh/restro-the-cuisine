export const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 11; hour <= 23; hour++) {
        const h = hour.toString().padStart(2, "0");

        // :00 slot
        slots.push(`${h}:00`);

        // :30 slot (only up to 22:30 if 23:00 is last)
        if (hour < 23) {
            slots.push(`${h}:30`);
        }
    }
    return slots;
};

export const getPreviousSlot = (slot: string) => {
    if (!slot) return null;
    const [hourStr, minStr] = slot.split(":");
    let hour = parseInt(hourStr);
    let min = parseInt(minStr);

    if (min === 30) {
        min = 0;
    } else {
        min = 30;
        hour = hour - 1;
    }

    if (hour < 11) return null;

    const newHourStr = hour.toString().padStart(2, "0");
    const newMinStr = min === 0 ? "00" : "30";
    return `${newHourStr}:${newMinStr}`;
};

export const getCurrentSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Constrain to business hours
    let h = hour;
    if (h < 11) h = 11;
    if (h > 23) h = 23;

    const minStr = minutes < 30 ? "00" : "30";
    return `${h.toString().padStart(2, "0")}:${minStr}`;
};
