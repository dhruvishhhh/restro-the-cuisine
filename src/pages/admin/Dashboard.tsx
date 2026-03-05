import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
    Users,
    MapPin,
    Clock,
    Calendar,
    LayoutDashboard,
    LogOut,
    Bell,
    Search,
    Loader2,
    Map as MapIcon,
    QrCode,
    Power,
    ShieldOff,
    Settings,
    MapPin as MapPinIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, onSnapshot, query, orderBy, limit, setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const Dashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentReservations, setRecentReservations] = useState<any[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState("default");
    const pauseReasonRef = useRef("default"); // always holds latest value to avoid stale closures
    const [isUpdatingPause, setIsUpdatingPause] = useState(false);
    const [dailyRequirement, setDailyRequirement] = useState("");
    const [isUpdatingReq, setIsUpdatingReq] = useState(false);
    const [locationPassword, setLocationPassword] = useState("");
    const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);
    const [stats, setStats] = useState([
        { name: "Reservations", value: "0", icon: Calendar, color: "text-accent", bg: "bg-accent/10" },
        { name: "Active Tables", value: "0", icon: Users, color: "text-gold", bg: "bg-gold/10" },
        { name: "Time Slots", value: "25", icon: Clock, color: "text-sage", bg: "bg-sage/10" },
        { name: "Locations", value: "1", icon: MapPin, color: "text-terracotta", bg: "bg-terracotta/10" },
    ]);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setLoading(false);
            } else {
                navigate("/admin/login");
            }
        });

        // Real-time listener for reservations
        const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"), limit(5));
        const unsubscribeReservations = onSnapshot(q, (snapshot) => {
            const resData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentReservations(resData);

            setStats(prev => prev.map(s =>
                s.name === "Reservations" ? { ...s, value: snapshot.size.toString() } : s
            ));
        });

        // Real-time listener for tables count
        const unsubscribeTables = onSnapshot(collection(db, "tables"), (snapshot) => {
            setStats(prev => prev.map(s =>
                s.name === "Active Tables" ? { ...s, value: snapshot.size.toString() } : s
            ));
        });

        // Fetch daily requirement
        const fetchRequirement = async () => {
            const docRef = doc(db, "siteConfig", "daily-requirement");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setDailyRequirement(docSnap.data().text);
            }
        };
        fetchRequirement();

        // Real-time listener for reservation pause status
        const unsubscribePauseStatus = onSnapshot(
            doc(db, "settings", "reservations"),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const paused = data.isPaused || false;
                    setIsPaused(paused);
                    // Only sync the stored reason when booking IS paused
                    // (don't override the admin's dropdown selection when active)
                    if (paused) {
                        setPauseReason(data.pauseReason || "default");
                    }
                } else {
                    setIsPaused(false);
                }
            },
            (error) => {
                console.error("Error listening to settings/reservations:", error);
            }
        );

        return () => {
            unsubscribeAuth();
            unsubscribeReservations();
            unsubscribeTables();
            unsubscribePauseStatus();
        };
    }, [navigate]);

    const handleUpdateRequirement = async () => {
        setIsUpdatingReq(true);
        try {
            await setDoc(doc(db, "siteConfig", "daily-requirement"), {
                text: dailyRequirement,
                updatedAt: new Date(),
            });
            toast({ title: "Requirement Updated", description: "The website has been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update requirement." });
        } finally {
            setIsUpdatingReq(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: "Signed out",
                description: "You have been logged out successfully.",
            });
            navigate("/admin/login");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to sign out. Please try again.",
            });
        }
    };

    const getInitials = (name: string) => {
        if (!name) return "A";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const toggleReservationStatus = async () => {
        setIsUpdatingPause(true);
        try {
            const newPausedState = !isPaused;
            // Read from ref to guarantee the latest dropdown selection (avoids stale closure)
            const reasonToSave = pauseReasonRef.current;
            const settingsRef = doc(db, "settings", "reservations");
            await setDoc(settingsRef, {
                isPaused: newPausedState,
                pauseReason: newPausedState ? reasonToSave : "none",
                updatedAt: new Date()
            }, { merge: true });
            toast({
                title: newPausedState ? "Reservations Paused" : "Reservations Active",
                description: newPausedState ? `Booking paused (${reasonToSave === 'out_of_table' ? 'No Tables' : reasonToSave === 'no_booking_today' ? 'No Bookings Today' : 'General'}).` : "Public booking form is now enabled."
            });
        } catch (error: any) {
            console.error("Failed to toggle reservation status:", error);
            toast({ variant: "destructive", title: "Update Failed", description: error?.message || "Could not sync reservation status." });
        } finally {
            setIsUpdatingPause(false);
        }
    };

    const handleVerifyLocationAccess = () => {
        if (locationPassword === "Monk@2026") {
            setIsPassDialogOpen(false);
            setLocationPassword("");
            navigate("/admin/locations");
        } else {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Incorrect sanctuary administrator password."
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <p className="text-muted-foreground">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <AdminSidebar userEmail={user?.email} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <AdminHeader />

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <Card key={stat.name} className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <span className="text-sm font-medium text-muted-foreground">{stat.name}</span>
                                    <div className={`${stat.bg} p-2 rounded-lg`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Reservations</CardTitle>
                                <CardDescription className="text-muted-foreground">Latest bookings from the website</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentReservations.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">No reservations yet.</p>
                                    ) : (
                                        recentReservations.map((res) => (
                                            <div key={res.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                                                        {getInitials(res.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{res.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {res.guests} {parseInt(res.guests) === 1 ? "guest" : "guests"} · {res.time} · {res.location}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 text-xs font-medium rounded-full border ${res.status === "confirmed"
                                                    ? "bg-accent/10 text-accent border-accent/20"
                                                    : "bg-terracotta/10 text-terracotta border-terracotta/20"
                                                    }`}>
                                                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden relative group">
                                <div className={`absolute inset-0 opacity-5 transition-colors duration-500 pointer-events-none ${isPaused ? 'bg-destructive' : 'bg-accent'}`} />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Booking Status</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${isPaused ? 'bg-destructive' : 'bg-emerald-500'}`} />
                                            <span className={`text-2xl font-bold tracking-tighter ${isPaused ? 'text-destructive' : 'text-foreground'}`}>
                                                {isPaused ? 'PAUSED' : 'ACTIVE'}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant={isPaused ? "destructive" : "outline"}
                                        size="sm"
                                        disabled={isUpdatingPause}
                                        onClick={toggleReservationStatus}
                                        className={`rounded-full gap-2 transition-all transform active:scale-95 ${!isPaused ? 'hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20' : 'hover:scale-105 shadow-lg shadow-destructive/20'}`}
                                    >
                                        {isUpdatingPause ? <Loader2 className="w-4 h-4 animate-spin" /> : isPaused ? <Power className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                        {isPaused ? 'Enable' : 'Disable'}
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!isPaused && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Reason if disabling:</Label>
                                            <div className="flex flex-col gap-1.5">
                                                {[
                                                    { value: "default", label: "General Pause" },
                                                    { value: "out_of_table", label: "Out of Table" },
                                                    { value: "no_booking_today", label: "No Booking for Today" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            pauseReasonRef.current = opt.value;
                                                            setPauseReason(opt.value);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${pauseReason === opt.value
                                                            ? "bg-destructive/10 border-destructive/40 text-destructive"
                                                            : "bg-background border-border text-muted-foreground hover:border-destructive/30 hover:text-foreground"
                                                            }`}
                                                    >
                                                        {pauseReason === opt.value && <span className="mr-1.5">✓</span>}
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground italic">
                                        {isPaused
                                            ? `Public is currently seeing: ${pauseReason === 'out_of_table' ? 'Out of tables' :
                                                pauseReason === 'no_booking_today' ? 'No bookings today' :
                                                    'Reservations paused'
                                            }`
                                            : 'Accepting new booking requests from visitors.'}
                                    </p>
                                </CardContent>
                            </Card>




                            <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">The House of Earthmonk Control</CardTitle>
                                    <CardDescription>Advanced location and The House of Earthmonk management.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Dialog open={isPassDialogOpen} onOpenChange={setIsPassDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-terracotta hover:bg-terracotta/90 text-white justify-start gap-3">
                                                <MapPin className="w-4 h-4" /> Manage Locations
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md bg-card border-border">
                                            <DialogHeader>
                                                <DialogTitle>Administrator Verification</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Sanctuary Admin Password</Label>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={locationPassword}
                                                        onChange={(e) => setLocationPassword(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyLocationAccess()}
                                                    />
                                                </div>
                                                <Button className="w-full gap-2" onClick={handleVerifyLocationAccess}>
                                                    Verify & Open Access
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <a href="/admin/reservations" className="block">
                                        <Button variant="outline" className="w-full border-border bg-background hover:bg-muted text-foreground justify-start gap-3">
                                            <Calendar className="w-4 h-4" /> View All Reservations
                                        </Button>
                                    </a>
                                    <a href="/admin/tables" className="block">
                                        <Button variant="outline" className="w-full border-border bg-background hover:bg-muted text-foreground justify-start gap-3">
                                            <Users className="w-4 h-4" /> Manage Tables
                                        </Button>
                                    </a>
                                </CardContent>
                            </Card>


                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle className="text-lg">Daily Requirement</CardTitle>
                                    <CardDescription>Update the daily notice on the home page.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <textarea
                                        className="w-full min-h-[100px] bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent text-foreground resize-none"
                                        placeholder="e.g. Special Menu available today! or We are fully booked for tonight."
                                        value={dailyRequirement}
                                        onChange={(e) => setDailyRequirement(e.target.value)}
                                    />
                                    <Button
                                        onClick={handleUpdateRequirement}
                                        disabled={isUpdatingReq}
                                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 font-bold"
                                    >
                                        {isUpdatingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Website"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
