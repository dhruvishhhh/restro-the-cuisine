import { useState, useEffect } from "react";
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
    Settings,
    Bell,
    Search,
    Loader2,
    Map as MapIcon,
    QrCode,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Power,
    ShieldOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, onSnapshot, query, orderBy, limit, setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component
import { Badge } from "@/components/ui/badge";
import AdminDataCenter from "@/components/AdminDataCenter";

const Dashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentReservations, setRecentReservations] = useState<any[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isUpdatingPause, setIsUpdatingPause] = useState(false);
    const [dailyRequirement, setDailyRequirement] = useState("");
    const [isUpdatingReq, setIsUpdatingReq] = useState(false);
    const [stats, setStats] = useState([
        { name: "Reservations", value: "0", icon: Calendar, color: "text-accent", bg: "bg-accent/10" },
        { name: "Locations", value: "1", icon: MapPin, color: "text-terracotta", bg: "bg-terracotta/10" },
        { name: "Active Tables", value: "0", icon: Users, color: "text-gold", bg: "bg-gold/10" },
        { name: "Time Slots", value: "12", icon: Clock, color: "text-sage", bg: "bg-sage/10" },
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
        const unsubscribePauseStatus = onSnapshot(doc(db, "settings", "reservations"), (docSnap) => {
            if (docSnap.exists()) {
                setIsPaused(docSnap.data().isPaused || false);
            }
        });

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
            const settingsRef = doc(db, "settings", "reservations");
            await setDoc(settingsRef, { isPaused: !isPaused }, { merge: true });
            toast({
                title: !isPaused ? "Reservations Paused" : "Reservations Active",
                description: !isPaused ? "Public booking form is now disabled." : "Public booking form is now enabled."
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not sync reservation status." });
        } finally {
            setIsUpdatingPause(false);
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
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar remains same... */}
            <aside className="w-64 border-r border-border bg-card flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6" /> Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <a href="/admin" className="flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg transition-colors">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </a>
                    <a href="/admin/reservations" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <Calendar className="w-5 h-5" /> Reservations
                    </a>
                    <a href="/admin/tables" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <Users className="w-5 h-5" /> Table Management
                    </a>
                    <a href="/admin/locations" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <MapIcon className="w-5 h-5" /> Locations
                    </a>
                    <a href="/admin/scan" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <QrCode className="w-5 h-5" /> QR Scanner
                    </a>
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                            {user?.email?.[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">Administrator</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-8">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search reservations, users..."
                            className="w-full bg-background border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Bell className="w-5 h-5" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
                    </div>
                </header>

                <div className="p-8 space-y-8">
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
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <span className="text-accent font-medium">+100%</span> since launch
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                        <div className="space-y-8">
                            <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden relative group">
                                <div className={`absolute inset-0 opacity-5 transition-colors duration-500 ${isPaused ? 'bg-destructive' : 'bg-accent'}`} />
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
                                <CardContent>
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                        {isPaused ? 'Public is currently unable to book tables.' : 'Accepting new booking requests from visitors.'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <a href="/admin/reservations" className="block">
                                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start gap-3">
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

                            <AdminDataCenter />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
