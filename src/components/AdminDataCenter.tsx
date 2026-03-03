import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, Table as TableIcon, Calendar, Power, ShieldOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDataCenter = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isTogglingPause, setIsTogglingPause] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeRes = onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            setReservations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubscribeTables = onSnapshot(collection(db, "tables"), (snap) => {
            setTables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubscribePause = onSnapshot(doc(db, "settings", "reservations"), (docSnap) => {
            if (docSnap.exists()) {
                setIsPaused(docSnap.data().isPaused || false);
            }
        });
        return () => {
            unsubscribeRes();
            unsubscribeTables();
            unsubscribePause();
        };
    }, []);

    const toggleBookingStatus = async () => {
        setIsTogglingPause(true);
        try {
            await setDoc(doc(db, "settings", "reservations"), { isPaused: !isPaused }, { merge: true });
            toast({
                title: !isPaused ? "Reservations Paused" : "Reservations Resumed",
                description: !isPaused ? "Public booking is now disabled." : "Public booking is now accepting requests."
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to toggle booking status." });
        } finally {
            setIsTogglingPause(false);
        }
    };

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
        <div className="space-y-6">
            {/* Master Booking Toggle */}
            <Card className={`border-border bg-card overflow-hidden transition-all ${isPaused ? 'ring-1 ring-destructive/30' : 'ring-1 ring-accent/20'}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isPaused ? 'bg-destructive/10' : 'bg-accent/10'}`}>
                                {isPaused ? <ShieldOff className="w-5 h-5 text-destructive" /> : <Power className="w-5 h-5 text-accent" />}
                            </div>
                            <div>
                                <CardTitle className="text-base">Booking Engine</CardTitle>
                                <CardDescription className="text-xs">
                                    {isPaused ? "Public reservations are disabled." : "Accepting new reservation requests."}
                                </CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={!isPaused}
                            onCheckedChange={toggleBookingStatus}
                            disabled={isTogglingPause}
                        />
                    </div>
                </CardHeader>
                {isPaused && (
                    <div className="px-6 pb-4 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <p className="text-[10px] text-destructive font-medium uppercase tracking-wider">The website is currently showing "Reservations Paused" to all potential guests.</p>
                    </div>
                )}
            </Card>

            {/* Data Export */}
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
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDataCenter;
