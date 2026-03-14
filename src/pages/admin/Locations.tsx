import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, Plus, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const AdminLocations = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<any[]>([]);
    const [newLocation, setNewLocation] = useState({ name: "", address: "", city: "Anand", province: "Gujarat" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");

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

        const unsubscribeLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
            setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeLocations();
        };
    }, [navigate]);

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "locations"), {
                ...newLocation,
                createdAt: new Date(),
            });
            setNewLocation({ name: "", address: "", city: "Anand", province: "Gujarat" });
            toast({ title: "Location Added", description: "New location successfully created." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to add location." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyPassword = () => {
        if (passwordInput === "Monk@2026") {
            setIsVerified(true);
            toast({ title: "Access Granted", description: "You now have administrative control over locations." });
        } else {
            toast({ variant: "destructive", title: "Access Denied", description: "Incorrect admin password." });
        }
    };

    const handleDeleteLocation = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location?")) return;
        try {
            await deleteDoc(doc(db, "locations", id));
            toast({ title: "Location Deleted", description: "Location removed successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete location." });
        }
    };

    if (loading) return null;

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
                <AdminSidebar userEmail={user?.email} />
                <main className="flex-1 overflow-auto">
                    <AdminHeader />
                    <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
                        <Card className="w-full max-w-md border-border bg-card shadow-2xl">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <MapPin className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-serif">Location Control</CardTitle>
                                <CardDescription>Enter the administrator password to manage locations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Administrator Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                                        className="bg-background border-border"
                                    />
                                </div>
                                <Button className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={handleVerifyPassword}>
                                    Verify & Access
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <AdminSidebar userEmail={user?.email} />

            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-6 space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Location Management</h2>
                        <p className="text-muted-foreground">Add and manage restaurant and cafe locations.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Add Location Form */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Add New Location</CardTitle>
                                <CardDescription>Enter details for a new location.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={handleAddLocation} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Location Name</Label>
                                        <Input
                                            id="name"
                                            value={newLocation.name || ''}
                                            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                                            placeholder="Restro - Anand"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            placeholder="123 Serenity Road"
                                            value={newLocation.address}
                                            onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={newLocation.city}
                                                onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="province">Province/State</Label>
                                            <Input
                                                id="province"
                                                value={newLocation.province}
                                                onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Add Location
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Location List */}
                        <Card className="lg:col-span-2 border-border bg-card">
                            <CardHeader>
                                <CardTitle>Active Locations</CardTitle>
                                <CardDescription>Your current operational locations.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {locations.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">No locations configured yet.</p>
                                    ) : (
                                        locations.map((loc) => (
                                            <div key={loc.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        <MapPin className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-foreground">{loc.name}</p>
                                                            <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] uppercase font-bold rounded-full border border-accent/20">
                                                                {loc.city}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{loc.address}, {loc.province}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteLocation(loc.id)}
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLocations;
