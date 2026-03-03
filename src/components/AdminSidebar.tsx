import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AdminPresence from "./AdminPresence";
import {
    LayoutDashboard,
    Calendar,
    Users,
    QrCode,
    MapPin,
    LogOut,
    Search,
    Bell,
    ShieldCheck,
    Map as MapIcon
} from "lucide-react";

interface AdminSidebarProps {
    userEmail?: string;
}

const AdminSidebar = ({ userEmail }: AdminSidebarProps) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { toast } = useToast();

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
                description: "Failed to sign out.",
            });
        }
    };

    const navItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { name: "Reservations", icon: Calendar, path: "/admin/reservations" },
        { name: "Cafe Layout", icon: Users, path: "/admin/tables" },
        { name: "Scan Check-in", icon: QrCode, path: "/admin/scan" },
    ];

    return (
        <aside className="w-full lg:w-64 border-b lg:border-r border-border bg-card flex flex-col shrink-0">
            <div className="p-6">
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6" /> Admin Panel
                </h1>
                <AdminPresence />
            </div>

            <nav className="flex-1 px-4 space-y-2 pb-4 lg:pb-0">
                {navItems.map((item) => (
                    <a
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${pathname === item.path
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <item.icon className="w-5 h-5" /> {item.name}
                    </a>
                ))}
            </nav>

            <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                        {userEmail?.[0] || 'A'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">{userEmail || 'Admin'}</p>
                        <p className="text-xs text-muted-foreground">Administrator</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
