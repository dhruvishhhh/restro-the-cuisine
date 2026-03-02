import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Users, Plus, Trash2, MapPin, Loader2, Calendar, Map as MapIcon, Move, Save, Edit2, Grid, Layers } from "lucide-react";
import { motion } from "framer-motion";
// Removed duplicate Import statement here:

const Tables = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>("all");
    const [newTable, setNewTable] = useState({ marking: "", capacity: "", location: "", shape: "square" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewSlot, setViewSlot] = useState("Now");
    const [reservations, setReservations] = useState<any[]>([]);

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

        // Fetch Locations for dropdown
        const unsubscribeLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
            const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setLocations(locs);
            if (locs.length > 0 && !newTable.location) {
                setNewTable(prev => ({ ...prev, location: locs[0].name }));
            }
        });

        const q = query(collection(db, "tables"), orderBy("location"), orderBy("marking"));
        const tableSub = onSnapshot(q, (snapshot) => {
            setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });

        const resSub = onSnapshot(collection(db, "reservations"), (snapshot) => {
            setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeLocations();
            tableSub();
            resSub();
        };
    }, [navigate]);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTable.marking || !newTable.capacity || !newTable.location) {
            toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "tables"), {
                ...newTable,
                capacity: parseInt(newTable.capacity),
                status: "available",
                x: 50,
                y: 50,
                createdAt: new Date(),
            });
            setNewTable({ ...newTable, marking: "", capacity: "" });
            toast({ title: "Table Added", description: `Table ${newTable.marking} registered at ${newTable.location}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to add table." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTableDrag = async (id: string, info: any) => {
        if (!editMode) return;
        try {
            await updateDoc(doc(db, "tables", id), {
                x: info.point.x,
                y: info.point.y
            });
        } catch (error) {
            console.error("Drag update failed", error);
        }
    };

    const saveLayout = () => {
        setEditMode(false);
        toast({ title: "Layout Saved", description: "Table positions updated successfully." });
    };

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        let newStatus = "available";
        if (currentStatus === "available") newStatus = "occupied";
        else if (currentStatus === "occupied") newStatus = "cleaning";
        else if (currentStatus === "cleaning") newStatus = "available";

        try {
            await updateDoc(doc(db, "tables", id), { status: newStatus });
            toast({ title: "Status Updated", description: `Table is now ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm("Are you sure you want to delete this table?")) return;
        try {
            await deleteDoc(doc(db, "tables", id));
            toast({ title: "Table Deleted", description: "The table has been removed." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete table." });
        }
    };

    const filteredTables = selectedLocation === "all"
        ? tables
        : tables.filter(t => t.location === selectedLocation);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-b md:border-r border-border bg-card flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6" /> Admin Panel
                    </h1>
                </div>
                <nav className="flex-1 px-4 pb-4 md:pb-0 space-y-2">
                    <a href="/admin" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </a>
                    <a href="/admin/reservations" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <Calendar className="w-5 h-5" /> Reservations
                    </a>
                    <a href="/admin/tables" className="flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg transition-colors">
                        <Users className="w-5 h-5" /> Table Management
                    </a>
                    <a href="/admin/locations" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <MapIcon className="w-5 h-5" /> Locations
                    </a>
                    <a href="/admin/scan" className="flex md:hidden items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                        <MapPin className="w-5 h-5" /> QR Scanner
                    </a>
                </nav>
            </aside>

            <main className="flex-1 p-4 md:p-8 space-y-8 overflow-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Table Management</h2>
                        <p className="text-muted-foreground text-sm">Manage seating and real-time availability.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="filter" className="whitespace-nowrap hidden sm:block">Filter by Location:</Label>
                        <select
                            id="filter"
                            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Table Form */}
                    <Card className="border-border bg-card h-fit">
                        <CardHeader>
                            <CardTitle>Add New Table</CardTitle>
                            <CardDescription>Assign a table to a specific location.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddTable} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Select Location</Label>
                                    <select
                                        id="location"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={newTable.location}
                                        onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="marking">Table Name / Marking</Label>
                                    <Input
                                        id="marking"
                                        placeholder="e.g. Table-12"
                                        value={newTable.marking}
                                        onChange={(e) => setNewTable({ ...newTable, marking: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity (Guests)</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        placeholder="4"
                                        value={newTable.capacity}
                                        onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Table Shape</Label>
                                    <div className="flex gap-4 pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="shape"
                                                value="square"
                                                checked={newTable.shape === "square"}
                                                onChange={() => setNewTable({ ...newTable, shape: "square" })}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className="text-sm">Square</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="shape"
                                                value="circle"
                                                checked={newTable.shape === "circle"}
                                                onChange={() => setNewTable({ ...newTable, shape: "circle" })}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className="text-sm">Circle</span>
                                        </label>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full gap-2" disabled={isSubmitting || locations.length === 0}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {locations.length === 0 ? "Add Location First" : "Register Table"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Cafe Layout Visualizer */}
                    <Card className="lg:col-span-2 border-border bg-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-accent" />
                                    Cafe Layout - {selectedLocation === 'all' ? 'All Areas' : selectedLocation}
                                </CardTitle>
                                <CardDescription>Visual seating arrangement and occupancy.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    className="bg-background border border-border rounded-lg px-3 py-1 text-xs focus:ring-2 focus:ring-primary outline-none"
                                    value={viewSlot}
                                    onChange={(e) => setViewSlot(e.target.value)}
                                >
                                    <option value="Now">View: Live Status</option>
                                    <option value="Lunch">View: Lunch (12-3 PM)</option>
                                    <option value="Dinner">View: Dinner (7-10 PM)</option>
                                </select>
                                <Button
                                    variant={editMode ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => editMode ? saveLayout() : setEditMode(true)}
                                    className="gap-2"
                                >
                                    {editMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                    {editMode ? "Save Layout" : "Edit Positions"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 bg-[#F5F5F0] relative overflow-hidden h-[500px] border-b border-border">
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                            <div className="absolute inset-0 p-8">
                                {filteredTables.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                                        Assign tables to this location to see the layout.
                                    </div>
                                ) : (
                                    filteredTables.map((table) => {
                                        const isReserved = reservations.some(res =>
                                            res.tableId === table.id &&
                                            res.status === 'approved' &&
                                            (viewSlot === 'Now' || res.timeSlot === viewSlot)
                                        );

                                        return (
                                            <motion.div
                                                key={table.id}
                                                drag={editMode}
                                                dragMomentum={false}
                                                dragElastic={0}
                                                initial={false}
                                                onDragEnd={(e, info) => handleTableDrag(table.id, info)}
                                                style={{
                                                    left: table.x || 50,
                                                    top: table.y || 50,
                                                    position: 'absolute',
                                                    cursor: editMode ? 'move' : 'default'
                                                }}
                                                className="group"
                                            >
                                                <div className="relative">
                                                    <div className={`w-16 h-16 flex flex-col items-center justify-center shadow-lg border-2 transition-all duration-300 ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
                                                        } ${table.status === 'occupied' ? 'bg-terracotta/20 border-terracotta/40 text-terracotta' :
                                                            table.status === 'cleaning' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                                                                isReserved ? 'bg-amber-100 border-amber-300 text-amber-700' :
                                                                    'bg-sage/20 border-sage/40 text-sage'
                                                        }`}>
                                                        <span className="text-xs font-bold">{table.marking}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-bold opacity-80 uppercase">
                                                                {table.status === 'occupied' ? 'A' : table.status === 'cleaning' ? 'CLEAN' : isReserved ? 'R' : 'FREE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {[...Array(parseInt(table.capacity))].map((_, i) => {
                                                        const angle = (i / parseInt(table.capacity)) * Math.PI * 2;
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`absolute w-3 h-3 rounded-full border border-border shadow-sm transition-colors ${table.status === 'available' ? 'bg-sage/40' : 'bg-terracotta/40'
                                                                    }`}
                                                                style={{
                                                                    left: `calc(50% + ${Math.cos(angle) * 35}px - 6px)`,
                                                                    top: `calc(50% + ${Math.sin(angle) * 35}px - 6px)`
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                    {editMode && (
                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] px-1 rounded uppercase tracking-tighter invisible group-hover:visible whitespace-nowrap">
                                                            Drag to Reposition
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Tables List */}
                    <Card className="lg:col-span-3 border-border bg-card">
                        <CardHeader>
                            <CardTitle>Table Inventory</CardTitle>
                            <CardDescription>Detailed management of all registered tables.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredTables.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                        <p className="text-muted-foreground">No tables found.</p>
                                    </div>
                                ) : (
                                    filteredTables.map((table) => (
                                        <div key={table.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-lg border border-border gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold shadow-inner ${table.status === "available" ? "bg-sage/10 text-sage" : "bg-terracotta/10 text-terracotta"}`}>
                                                    {table.marking[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-foreground">{table.marking}</p>
                                                        <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] uppercase font-bold rounded-full border border-accent/20">
                                                            {table.capacity} Persons
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{table.location}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2">
                                                <div className={`mr-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${table.status === "available" ? "bg-sage/10 text-sage border-sage/20" :
                                                    table.status === "occupied" ? "bg-terracotta/10 text-terracotta border-terracotta/20" :
                                                        "bg-blue-100 text-blue-700 border-blue-200"
                                                    }`}>
                                                    {table.status}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusToggle(table.id, table.status)}
                                                    className="text-xs"
                                                >
                                                    {table.status === "available" ? "Mark Occupied" :
                                                        table.status === "occupied" ? "Mark Cleaning" : "Mark Available"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTable(table.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Tables;
