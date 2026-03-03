import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, FileJson, Table as TableIcon, Calendar, Power, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const AdminDataCenter = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [updating, setUpdating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeSettings = onSnapshot(doc(db, "settings", "reservations"), (docSnap) => {
            if (docSnap.exists()) {
                setIsPaused(docSnap.data().isPaused || false);
            }
        });
        return () => unsubscribeSettings();
    }, []);

    const toggleBookingSystem = async () => {
        setUpdating(true);
        try {
            const settingsRef = doc(db, "settings", "reservations");
            const snap = await getDoc(settingsRef);
            if (snap.exists()) {
                await updateDoc(settingsRef, { isPaused: !isPaused });
            } else {
                await setDoc(settingsRef, { isPaused: !isPaused });
            }
            toast({
                title: !isPaused ? "Booking System Paused" : "Booking System Active",
                description: !isPaused ? "Guests will see an out-of-table message." : "Normal booking operations resumed."
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update system status." });
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        const unsubscribeRes = onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            setReservations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubscribeTables = onSnapshot(collection(db, "tables"), (snap) => {
            setTables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => {
            unsubscribeRes();
            unsubscribeTables();
        };
    }, []);

    const convertToCSV = (data: any[]) => {
        if (data.length === 0) return "";
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(item => {
            return Object.values(item).map(val => {
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(",");
        });
        return [headers, ...rows].join("\n");
    };

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportReservations = () => {
        const csv = convertToCSV(reservations);
        downloadFile(csv, `reservations_export_${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
        toast({ title: "Export Started", description: "Your reservation data is being downloaded." });
    };

    const handleExportTables = () => {
        const csv = convertToCSV(tables);
        downloadFile(csv, `tables_export_${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
        toast({ title: "Export Started", description: "Your table inventory data is being downloaded." });
    };

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                        <Download className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <CardTitle>Data Export Center</CardTitle>
                        <CardDescription>Download your sanctuary data for offline management.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-border hover:border-accent/40 hover:bg-accent/5 group transition-all"
                    onClick={handleExportReservations}
                >
                    <Calendar className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                    <div className="text-center">
                        <p className="font-bold text-sm">Reservations CSV</p>
                        <p className="text-[10px] text-muted-foreground">{reservations.length} Records</p>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-border hover:border-accent/40 hover:bg-accent/5 group transition-all"
                    onClick={handleExportTables}
                >
                    <TableIcon className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                    <div className="text-center">
                        <p className="font-bold text-sm">Table Inventory CSV</p>
                        <p className="text-[10px] text-muted-foreground">{tables.length} Records</p>
                    </div>
                </Button>

                <div className="sm:col-span-2 p-4 bg-muted/20 border border-border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isPaused ? 'bg-destructive/10 text-destructive' : 'bg-sage/10 text-sage'}`}>
                            <Power className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{isPaused ? "System: OFFLINE" : "System: ONLINE"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Master Booking Control</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{isPaused ? "Reservations Paused" : "Accepting Bookings"}</span>
                        <Switch checked={!isPaused} onCheckedChange={toggleBookingSystem} disabled={updating} />
                    </div>
                </div>

                {isPaused && (
                    <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <p className="text-[10px] text-destructive font-medium">The website is currently showing "Reservations Paused" to all potential guests.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AdminDataCenter;
