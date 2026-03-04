export const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 11; hour <= 22; hour++) {
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour;
        slots.push(`${displayHour}:00 ${period}`);
        slots.push(`${displayHour}:30 ${period}`);
    }
    return slots;
};

/**
 * Normalizes various time formats to HH:mm (24h)
 * Handles "H:mm AM/PM", "HH:mm", "h:mm am", etc.
 */
export const normalizeTimeTo24h = (timeStr: string): string => {
    if (!timeStr) return "";

    // Check if already HH:mm
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;

    // Parse 12h format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr;

    let [_, hours, minutes, period] = match;
    let h = parseInt(hours);
    const m = minutes.padStart(2, "0");

    if (period) {
        const p = period.toUpperCase();
        if (p === "PM" && h < 12) h += 12;
        if (p === "AM" && h === 12) h = 0;
    }

    return `${h.toString().padStart(2, "0")}:${m}`;
};

/**
 * Converts any time string to AM/PM display format
 * Handles both "HH:mm" (24h) and "H:mm AM/PM" inputs
 */
export const formatToAmPm = (timeStr: string): string => {
    if (!timeStr) return "";

    // If already in AM/PM format, return as-is
    if (/AM|PM/i.test(timeStr)) return timeStr;

    // Convert from 24h to AM/PM
    const normalized = normalizeTimeTo24h(timeStr);
    const [hourStr, minStr] = normalized.split(":");
    const h = parseInt(hourStr);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minStr} ${period}`;
};

export const getPreviousSlot = (slot: string) => {
    if (!slot) return null;
    const normalized = normalizeTimeTo24h(slot);
    const [hourStr, minStr] = normalized.split(":");
    let hour = parseInt(hourStr);
    let min = parseInt(minStr);

    if (min === 30) {
        min = 0;
    } else {
        min = 30;
        hour = hour - 1;
    }

    if (hour < 11) return null;

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    const newMinStr = min === 0 ? "00" : "30";
    return `${displayHour}:${newMinStr} ${period}`;
};

/**
 * Checks if a current viewing slot is within the range of a reservation
 * Based on user request, a reservation blocks 3 slots (1.5 hours)
 */
export const isSlotInRange = (viewSlot: string, reserveTime: string, durationMinutes: number = 90): boolean => {
    const v = normalizeTimeTo24h(viewSlot);
    const r = normalizeTimeTo24h(reserveTime);
    if (!v || !r) return false;

    const [vH, vM] = v.split(":").map(Number);
    const [rH, rM] = r.split(":").map(Number);

    const vTotal = vH * 60 + vM;
    const rTotal = rH * 60 + rM;

    // Returns true if view slot is >= reserve time AND < reserve time + duration
    return vTotal >= rTotal && vTotal < (rTotal + durationMinutes);
};

export const getCurrentSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Constrain to business hours
    let h = hour;
    if (h < 11) h = 11;
    if (h > 22) h = 22;

    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h;
    const minStr = minutes < 30 ? "00" : "30";
    return `${displayHour}:${minStr} ${period}`;
};
