import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Bell, User, Users, LogOut, CheckCircle2, Clock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminPresence from "./AdminPresence";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const AdminHeader = () => {
    const [user, setUser] = useState<any>(null);
    const [onlineAdmins, setOnlineAdmins] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const { toast } = useToast();

    // Live clock - updates every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            }
        });

        // Listen for online admins in real-time
        const q = query(collection(db, "admin_presence"));
        const unsubscribePresence = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const ONE_MINUTE = 60 * 1000;

            let admins = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(admin => {
                    if (!admin.lastSeen) return false;
                    const lastSeenTime = admin.lastSeen instanceof Timestamp
                        ? admin.lastSeen.toMillis()
                        : (typeof admin.lastSeen === 'number' ? admin.lastSeen : Date.now());

                    return Math.abs(now - lastSeenTime) < ONE_MINUTE;
                });

            // Ensure current user is in the list even if server hasn't reflected heartbeat yet
            if (auth.currentUser?.email) {
                const currentUserEmail = auth.currentUser.email.toLowerCase();
                if (!admins.find(a => a.email?.toLowerCase() === currentUserEmail)) {
                    admins.push({
                        id: 'current-user',
                        email: auth.currentUser.email,
                        status: 'online',
                        lastSeen: now
                    });
                }
            }

            setOnlineAdmins(admins);
        });

        return () => {
            unsubscribeAuth();
            unsubscribePresence();
        };
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: "Signed out",
                description: "You have been logged out successfully.",
            });
            navigate("/admin/login");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to sign out.",
            });
        }
    };

    const getInitials = (email: string) => {
        if (!email) return "A";
        return email[0].toUpperCase();
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
            <AdminPresence />

            <div className="flex flex-col">
                <h1 className="text-xl font-bold font-serif text-foreground">
                    Restaurant <span className="text-accent underline decoration-accent/30 underline-offset-4">Control Panel</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                    Central Management System • Anand
                </p>
            </div>

            {/* Live IST Clock */}
            <div className="hidden sm:flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-4 py-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">IST Live</span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex flex-col items-end -space-y-0.5">
                    <span className="text-sm font-black text-foreground tabular-nums">
                        {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-bold">
                        {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Presence Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 rounded-full gap-2 border-border/50 bg-background/50 hover:bg-accent/5 transition-all">
                            <div className="relative">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                {onlineAdmins.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse border border-background" />
                                )}
                            </div>
                            <span className="text-xs font-bold font-sans">
                                {onlineAdmins.length} {onlineAdmins.length === 1 ? 'Admin' : 'Admins'} active
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 bg-card border-border shadow-2xl p-0 overflow-hidden" align="end">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Live Sessions</h3>
                            <p className="text-[10px] text-muted-foreground mt-1">Real-time administrator activity across the system.</p>
                        </div>
                        <div className="max-h-64 overflow-auto p-2">
                            {onlineAdmins.length === 0 ? (
                                <p className="text-center py-8 text-xs text-muted-foreground italic">No active admins tracked.</p>
                            ) : (
                                onlineAdmins.map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-border group">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-border group-hover:border-accent/30 transition-colors">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                    {getInitials(admin.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{admin.email}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Administrator</span>
                                            </div>
                                        </div>
                                        {admin.email?.toLowerCase() === user?.email?.toLowerCase() ? (
                                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[9px] font-bold px-2 py-0 h-5">
                                                YOU
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Active</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-8 bg-border/50" />

                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative group">
                                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-background" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-card border-border shadow-2xl p-0 overflow-hidden" align="end">
                            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Notifications</h3>
                                <Badge variant="outline" className="text-[10px] font-bold">2 New</Badge>
                            </div>
                            <div className="max-h-80 overflow-auto">
                                <div className="p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">System Optimized</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Real-time presence tracking is now active for all administrators.</p>
                                            <p className="text-[10px] text-accent font-bold mt-2 uppercase tracking-wide">Just Now</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">Welcome to Admin</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">The new control panel is ready for use.</p>
                                            <p className="text-[10px] text-accent font-bold mt-2 uppercase tracking-wide">5 Minutes Ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 text-center bg-muted/20">
                                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Mark all as read</button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="p-0 h-10 w-10 rounded-full hover:bg-muted/50 transition-all border border-transparent hover:border-border">
                                <Avatar className="h-9 w-9 border border-border">
                                    <AvatarFallback className="bg-accent/10 text-accent font-black text-sm">
                                        {getInitials(user?.email || "A")}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-card border-border shadow-2xl p-2" align="end">
                            <div className="p-3 mb-2 border-b border-border/50">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Session Identity</p>
                                <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-bold transition-all"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </Button>
                        </PopoverContent>
                    </Popover>

                    <div className="hidden md:flex flex-col items-start -space-y-1">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Signed in as</p>
                        <p className="text-sm font-bold text-primary truncate max-w-[120px] capitalize">
                            {user?.email?.split('@')[0].replace(/[._-]/g, ' ') || "Admin"}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
