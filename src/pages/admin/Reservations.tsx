import { useState, useEffect } from "react";
import { getPreviousSlot, formatToAmPm, normalizeTimeTo24h } from "@/lib/timeSlots";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, updateDoc, doc, query, orderBy, getDocs, where, deleteDoc, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    LayoutDashboard,
    Calendar,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    ChevronRight,
    ChevronLeft,
    Filter,
    Map as MapIcon,
    Mail,
    QrCode,
    Copy,
    ExternalLink,
    MapPin,
    ArrowRight,
    Download,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { sendApprovalEmail, generateApprovalEmailHTML } from "@/lib/emailService";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Reservations = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedResForEmail, setSelectedResForEmail] = useState<any>(null);
    const [selectedResForApproval, setSelectedResForApproval] = useState<any>(null);
    const [availableTables, setAvailableTables] = useState<any[]>([]);
    const [selectedTableId, setSelectedTableId] = useState("");
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [showAllDates, setShowAllDates] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock - updates every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setLoading(false);
            } else {
                navigate("/admin/login");
            }
        });

        const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
        const unsubscribeReservations = onSnapshot(q, (snapshot) => {
            setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubscribeLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
            setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeReservations();
            unsubscribeLocations();
        };
    }, [navigate]);

    // Auto-cancel expired reservations (past date+time with no action taken)
    useEffect(() => {
        if (reservations.length === 0) return;

        const now = new Date();
        const todayStr = format(now, "yyyy-MM-dd");
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTotalMin = currentHour * 60 + currentMin;

        const expiredReservations = reservations.filter(res => {
            // Only auto-cancel pending or approved reservations
            if (res.status !== "pending" && res.status !== "approved") return false;

            // If the reservation date is before today → expired
            if (res.date < todayStr) return true;

            // If the reservation date is today, check if the time slot has passed
            if (res.date === todayStr) {
                const normalizedTime = normalizeTimeTo24h(res.time);
                const [h, m] = normalizedTime.split(":").map(Number);
                const slotTotalMin = h * 60 + m;
                // Consider expired if we're more than 30 min past the slot
                return currentTotalMin > (slotTotalMin + 30);
            }

            return false;
        });

        // Batch auto-cancel
        expiredReservations.forEach(async (res) => {
            try {
                await updateDoc(doc(db, "reservations", res.id), {
                    status: "cancelled",
                    cancelReason: "auto_expired",
                    updatedAt: new Date()
                });
                console.log(`[Auto-Cancel] Expired: ${res.name} (${res.date} ${res.time})`);
            } catch (err) {
                console.error("[Auto-Cancel] Failed for", res.id, err);
            }
        });

        if (expiredReservations.length > 0) {
            toast({
                title: "Auto-Cleanup",
                description: `${expiredReservations.length} expired reservation(s) marked as cancelled.`,
            });
        }
    }, [reservations]);

    const openApprovalModal = async (reservation: any) => {
        try {
            const tablesSnap = await getDocs(collection(db, "tables"));
            const allTables = tablesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            // Filter by location
            const locationTables = allTables.filter(t => t.location === reservation.location);

            // Filter out tables that have overlapping approved reservations
            const nextSlot = (time: string) => {
                const [hourStr, minStr] = time.split(':');
                let h = parseInt(hourStr);
                let m = parseInt(minStr);
                if (m === 0) m = 30;
                else {
                    m = 0;
                    h = h + 1;
                }
                if (h > 23) return null;
                return `${h.toString().padStart(2, "0")}:${m === 0 ? '00' : '30'}`;
            };

            const prevSlot = getPreviousSlot(reservation.time);
            const nextT = nextSlot(reservation.time);

            const finalAvailable = locationTables.filter(table => {
                // 1. Check capacity — table must fit the guest count
                const guestCount = parseInt(reservation.guests) || 1;
                if ((table.capacity || 0) < guestCount) return false;

                // 2. Check time overlap — no double-booking
                const isOverlapping = reservations.some(res =>
                    res.tableId === table.id &&
                    res.status === 'approved' &&
                    res.date === reservation.date &&
                    (res.time === reservation.time || res.time === prevSlot || res.time === nextT)
                );
                return !isOverlapping;
            });

            setAvailableTables(finalAvailable);
            setSelectedResForApproval(reservation);
            setSelectedTableId(""); // Reset
        } catch (error) {
            console.error("Fetch tables error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch tables." });
        }
    };

    const handleApprove = async () => {
        if (!selectedTableId || !selectedResForApproval || isApproving) return;
        setIsApproving(true);

        try {
            const selectedTable = availableTables.find(t => t.id === selectedTableId);
            // 8-character uppercase alphanumeric is easier for QR scanners to focus on
            const checkInToken = Math.random().toString(36).substring(2, 6).toUpperCase() +
                Math.random().toString(36).substring(2, 6).toUpperCase();

            const now = new Date();
            await updateDoc(doc(db, "reservations", selectedResForApproval.id), {
                status: "approved",
                tableId: selectedTable.id,
                tableMarking: selectedTable.marking,
                checkInToken: checkInToken,
                approvedAt: now,
                updatedAt: now,
            });

            const updatedRes = { ...selectedResForApproval, status: 'approved', tableMarking: selectedTable.marking, checkInToken };

            // Generate rich HTML content for the email
            const emailHtml = generateApprovalEmailHTML({
                to_email: updatedRes.email,
                to_name: updatedRes.name,
                date: updatedRes.date,
                time: updatedRes.time,
                guests: updatedRes.guests,
                location: updatedRes.location,
                table_marking: selectedTable.marking,
                check_in_token: checkInToken,
            });

            // Send ONE automated email via EmailJS (double-click guard prevents duplicates)
            const emailSent = await sendApprovalEmail({
                to_email: updatedRes.email,
                to_name: updatedRes.name,
                date: updatedRes.date,
                time: updatedRes.time,
                guests: updatedRes.guests,
                location: updatedRes.location,
                table_marking: selectedTable.marking,
                check_in_token: checkInToken,
                html_content: emailHtml,
            });

            setSelectedResForApproval(null);
            setSelectedResForEmail(updatedRes);

            toast({
                title: "Reservation Approved",
                description: emailSent
                    ? `Assigned to ${selectedTable.marking}. Confirmation email sent to ${updatedRes.email}.`
                    : `Assigned to ${selectedTable.marking}. Email service not responding — use the preview to send manually.`
            });
        } catch (error) {
            console.error("Approval error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to approve reservation." });
        } finally {
            setIsApproving(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const resRef = doc(db, "reservations", id);
            await updateDoc(resRef, { status: newStatus });

            const res = reservations.find(r => r.id === id);
            if (res && res.tableId) {
                // Update slot-specific status
                const slotKey = `${res.tableId}_${res.date}_${res.time}`;
                let tableStatus = "available";
                if (newStatus === "active" || newStatus === "arrived") {
                    tableStatus = "occupied";
                } else if (newStatus === "completed") {
                    tableStatus = "cleaning";
                }

                if (tableStatus !== "available") {
                    await updateDoc(doc(db, "table_slots", slotKey), {
                        status: tableStatus,
                        updatedAt: new Date()
                    }).catch(async (error) => {
                        if (error.code === 'not-found') {
                            await addDoc(collection(db, "table_slots"), {
                                status: tableStatus,
                                tableId: res.tableId,
                                date: res.date,
                                slot: res.time,
                                updatedAt: new Date()
                            });
                        }
                    });
                }
            }

            toast({ title: "Status Updated", description: `Reservation marked as ${newStatus}.` });
        } catch (error) {
            console.error("Update status error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this reservation?")) return;
        try {
            await deleteDoc(doc(db, "reservations", id));
            toast({ title: "Reservation Deleted", description: "The record has been permanently removed." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete reservation." });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Email content copied to clipboard." });
    };

    const filteredReservations = reservations.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || res.status === statusFilter;
        const matchesLocation = selectedLocation === "all" || res.location === selectedLocation;
        const matchesDate = showAllDates || res.date === selectedDate;
        return matchesSearch && matchesStatus && matchesLocation && matchesDate;
    });

    // Group by Time Slot
    const timeSlots = Array.from(new Set(filteredReservations.map(r => r.time))).sort((a, b) => {
        const nA = normalizeTimeTo24h(a);
        const nB = normalizeTimeTo24h(b);
        const [hA, mA] = nA.split(':').map(Number);
        const [hB, mB] = nB.split(':').map(Number);
        return (hA * 60 + mA) - (hB * 60 + mB);
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved": return "bg-accent/10 text-accent border-accent/20";
            case "pending": return "bg-terracotta/10 text-terracotta border-terracotta/20";
            case "arrived": return "bg-sage text-white border-sage";
            case "completed": return "bg-sage/10 text-sage border-sage/20";
            case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <AdminSidebar userEmail={user?.email} />

            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Reservations</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-muted-foreground">Detailed categorized bookings tracking.</p>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sage/10 border border-sage/20 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-sage uppercase tracking-wider">
                                        {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Date Navigation */}
                            <div className="flex items-center gap-1 bg-muted/30 rounded-lg border border-border p-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={showAllDates}
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() - 1);
                                        setSelectedDate(format(d, "yyyy-MM-dd"));
                                    }}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <button
                                    onClick={() => setShowAllDates(false)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!showAllDates
                                        ? "bg-accent text-accent-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setShowAllDates(false);
                                        }}
                                        className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer w-[110px]"
                                    />
                                </button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={showAllDates}
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() + 1);
                                        setSelectedDate(format(d, "yyyy-MM-dd"));
                                    }}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <div className="w-px h-6 bg-border" />
                                <button
                                    onClick={() => setShowAllDates(true)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${showAllDates
                                        ? "bg-accent text-accent-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    All
                                </button>
                            </div>
                            {/* CSV Download */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 gap-2 text-xs font-bold"
                                onClick={() => {
                                    if (filteredReservations.length === 0) {
                                        toast({ variant: "destructive", title: "No Data", description: "No reservations to export for this date." });
                                        return;
                                    }
                                    const columns = [
                                        { key: "name", label: "Name" },
                                        { key: "email", label: "Email" },
                                        { key: "date", label: "Date" },
                                        { key: "time", label: "Time" },
                                        { key: "guests", label: "Guests" },
                                        { key: "location", label: "Location" },
                                        { key: "status", label: "Status" },
                                        { key: "tableMarking", label: "Table" },
                                        { key: "createdAt", label: "Requested At" },
                                        { key: "approvedAt", label: "Approved At" },
                                        { key: "arrivedAt", label: "Arrived At" },
                                        { key: "completedAt", label: "Completed At" },
                                        { key: "freedAt", label: "Freed At" },
                                        { key: "arrivalNote", label: "Arrival Note" },
                                    ];
                                    const headers = columns.map(c => c.label).join(",");
                                    const rows = filteredReservations.map(item =>
                                        columns.map(col => {
                                            let val = item[col.key] ?? "";
                                            if (val?.toDate) val = val.toDate().toLocaleString();
                                            return `"${String(val).replace(/"/g, '""')}"`;
                                        }).join(",")
                                    );
                                    const csv = [headers, ...rows].join("\n");
                                    const bom = "\uFEFF";
                                    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    const fileName = showAllDates ? `AllDates_R.csv` : `${selectedDate}_R.csv`;
                                    link.href = url;
                                    link.download = fileName;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    toast({ title: "Export Complete", description: `Downloaded as ${fileName}` });
                                }}
                            >
                                <Download className="w-4 h-4" /> CSV
                            </Button>
                        </div>
                    </div>

                    <Card className="border-border bg-card">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-4">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex flex-wrap gap-2 flex-1">
                                        {["all", "pending", "approved", "arrived", "completed", "cancelled"].map((filter) => (
                                            <Button
                                                key={filter}
                                                variant={statusFilter === filter ? "default" : "outline"}
                                                onClick={() => setStatusFilter(filter)}
                                                size="sm"
                                                className="capitalize text-[10px] h-8"
                                            >
                                                {filter}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="h-8 w-px bg-border hidden sm:block" />
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                            <SelectTrigger className="w-[160px] h-8 bg-background border-border text-[10px] uppercase font-bold tracking-widest">
                                                <SelectValue placeholder="Area Filter" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border text-foreground">
                                                <SelectItem value="all">All Areas</SelectItem>
                                                {locations.map(loc => (
                                                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 md:px-6">
                            <div className="space-y-12">
                                {timeSlots.length === 0 ? (
                                    <p className="text-center py-12 text-muted-foreground italic">No reservations found.</p>
                                ) : (
                                    timeSlots.map(slot => (
                                        <div key={slot} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-border/50" />
                                                <div className="flex items-center gap-2 px-6 py-2 bg-muted/30 rounded-full border border-border shadow-sm">
                                                    <Clock className="w-4 h-4 text-accent" />
                                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{formatToAmPm(slot)}</span>
                                                    <span className="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-bold">
                                                        {filteredReservations.filter(r => r.time === slot).length}
                                                    </span>
                                                </div>
                                                <div className="h-px flex-1 bg-border/50" />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {filteredReservations.filter(r => r.time === slot).map((res) => (
                                                    <div key={res.id} className="group p-4 bg-background rounded-xl border border-border hover:border-primary/20 transition-all duration-300">
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-lg border border-primary/10 flex-shrink-0">
                                                                        {res.name[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <h3 className="font-bold text-foreground leading-tight">{res.name}</h3>
                                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(res.status)}`}>
                                                                                {res.status}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{res.email}</p>
                                                                    </div>
                                                                </div>
                                                                {res.status === "approved" && (
                                                                    <Button variant="ghost" size="icon" onClick={() => setSelectedResForEmail(res)}>
                                                                        <Mail className="w-4 h-4 text-accent" />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                                    <Calendar className="w-3 h-3 text-accent" /> {res.date}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                                    <Users className="w-3 h-3 text-sage" /> {res.guests} Guests
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                                    <MapPin className="w-3 h-3 text-terracotta" /> {res.location.split(',')[0]}
                                                                </div>
                                                                {res.createdAt && (
                                                                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 italic font-medium col-span-2 sm:col-span-3 border-t border-border/30 pt-1 mt-1">
                                                                        Requested at: {res.createdAt.toDate ? res.createdAt.toDate().toLocaleString() : new Date(res.createdAt).toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {res.tableMarking && (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-md ring-1 ring-primary/5">
                                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Marked Table: {res.tableMarking}</span>
                                                                    </div>
                                                                    {res.arrivalNote && (
                                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${res.arrivalNote.includes("Too") ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"}`}>
                                                                            <Clock className="w-3 h-3" />
                                                                            {res.arrivalNote}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 mt-1">
                                                                {res.status === "pending" && (
                                                                    <Button
                                                                        onClick={() => openApprovalModal(res)}
                                                                        className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground gap-2 flex-1 sm:flex-none text-[10px] px-3 transition-all transform hover:scale-105 font-bold"
                                                                        size="sm"
                                                                    >
                                                                        <CheckCircle className="w-3 h-3" /> Approve & Assign
                                                                    </Button>
                                                                )}
                                                                {res.status === "approved" && (
                                                                    <Button
                                                                        onClick={() => handleUpdateStatus(res.id, "arrived")}
                                                                        className="h-8 bg-sage hover:bg-sage/90 text-white gap-2 flex-1 sm:flex-none text-[10px] px-3 font-bold"
                                                                        size="sm"
                                                                    >
                                                                        <ArrowRight className="w-3 h-3" /> Manual Check-in
                                                                    </Button>
                                                                )}
                                                                {["approved", "arrived", "active"].includes(res.status) && (
                                                                    <select
                                                                        className="h-8 bg-background border border-border rounded-md px-2 text-[10px] focus:ring-1 focus:ring-accent outline-none font-bold text-foreground"
                                                                        value={res.status}
                                                                        onChange={(e) => handleUpdateStatus(res.id, e.target.value)}
                                                                    >
                                                                        <option value="approved">Status: Approved</option>
                                                                        <option value="arrived">Status: Arrived</option>
                                                                        <option value="active">Status: Seated/Active</option>
                                                                        <option value="completed">Status: Completed</option>
                                                                    </select>
                                                                )}
                                                                {res.status !== "cancelled" && res.status !== "completed" && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => handleRemove(res.id)}
                                                                        className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2 text-[10px] px-2 font-medium"
                                                                        size="sm"
                                                                    >
                                                                        <XCircle className="w-3 h-3" /> Cancel
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table Assignment Modal */}
                    <Dialog open={!!selectedResForApproval} onOpenChange={() => setSelectedResForApproval(null)}>
                        <DialogContent className="max-w-md bg-card border-border">
                            <DialogHeader>
                                <DialogTitle>Assign Table</DialogTitle>
                                <DialogDescription>
                                    Select a table for {selectedResForApproval?.name} ({selectedResForApproval?.guests} guests).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Table for {selectedResForApproval?.location}</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto">
                                        {availableTables.map(table => {
                                            const guestCount = parseInt(selectedResForApproval?.guests) || 1;
                                            const isTight = table.capacity === guestCount;
                                            return (
                                                <button
                                                    key={table.id}
                                                    onClick={() => setSelectedTableId(table.id)}
                                                    className={`p-3 rounded-lg border-2 text-left transition-all ${selectedTableId === table.id
                                                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                                                        : 'border-border bg-background hover:border-accent/40'
                                                        }`}
                                                >
                                                    <p className="font-bold text-sm">{table.marking}</p>
                                                    <p className={`text-[10px] font-bold ${isTight ? 'text-sage' : 'text-amber-500'}`}>
                                                        {table.capacity} seats {isTight ? '(perfect fit)' : `(+${table.capacity - guestCount} extra)`}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                        {availableTables.length === 0 && (
                                            <div className="col-span-2 py-8 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-xs italic">
                                                No tables with {selectedResForApproval?.guests}+ capacity available at this location and time.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    className="w-full gap-2 bg-accent hover:bg-accent/90"
                                    disabled={!selectedTableId || isApproving}
                                    onClick={handleApprove}
                                >
                                    {isApproving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                                    ) : (
                                        <><CheckCircle className="w-4 h-4" /> Confirm Approval</>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Email Preview Dialog */}
                    <Dialog open={!!selectedResForEmail} onOpenChange={() => setSelectedResForEmail(null)}>
                        <DialogContent className="max-w-md bg-card border-border">
                            <DialogHeader>
                                <DialogTitle>Email Notification Preview</DialogTitle>
                                <DialogDescription>
                                    Copy this content to send the confirmation email to {selectedResForEmail?.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="p-4 bg-background border border-border rounded-lg space-y-4 text-sm font-serif">
                                    <div className="space-y-2">
                                        <p className="font-bold">Subject: Your Reservation at Earth Monk Sanctuary is Approved!</p>
                                        <p>Dear {selectedResForEmail?.name},</p>
                                        <p>We are delighted to confirm your reservation at our <strong>{selectedResForEmail?.location}</strong> sanctuary.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-3 rounded border border-border">
                                        <p><strong>Date:</strong> {selectedResForEmail?.date}</p>
                                        <p><strong>Time:</strong> {formatToAmPm(selectedResForEmail?.time)}</p>
                                        <p><strong>Guests:</strong> {selectedResForEmail?.guests}</p>
                                        <p><strong>Table:</strong> {selectedResForEmail?.tableMarking}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-4 py-4 bg-white rounded-lg border border-border">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-sans font-bold">Your Entry Pass</p>
                                        <QRCodeSVG
                                            value={selectedResForEmail?.checkInToken || "invalid"}
                                            size={256}
                                            level="Q"
                                            includeMargin={true}
                                        />
                                        <p className="text-[10px] text-muted-foreground italic px-6 text-center font-sans">Present this QR code at the entrance for seamless check-in.</p>
                                    </div>
                                    <p>We look forward to hosting you soon!</p>
                                    <p className="text-xs text-muted-foreground">Warmly,<br />The House of Earth Monk</p>
                                </div>
                                <Button className="w-full gap-2" onClick={() => copyToClipboard(`Earth Monk Sanctuary Confirmation\n\nDear ${selectedResForEmail.name},\nYour reservation is approved for ${selectedResForEmail.date} at ${formatToAmPm(selectedResForEmail.time)}.\nPlease use the provided QR pass for entry.`)}>
                                    <Copy className="w-4 h-4" /> Copy Email Text
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
};

export default Reservations;
