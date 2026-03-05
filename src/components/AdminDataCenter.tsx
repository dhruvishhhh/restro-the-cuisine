import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Table as TableIcon, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDataCenter = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const { toast } = useToast();

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

    const convertToCSV = (data: Record<string, any>[], columns: { key: string; label: string }[]) => {
        if (data.length === 0) return "";
        const headers = columns.map(c => c.label).join(",");
        const rows = data.map(item => {
            return columns.map(col => {
                let val = item[col.key];
                if (val === undefined || val === null) val = "";
                // Handle Firestore Timestamps
                if (val?.toDate) val = val.toDate().toLocaleString();
                if (typeof val === "object") val = JSON.stringify(val);
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(",");
        });
        return [headers, ...rows].join("\n");
    };

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
        const blob = new Blob([bom + content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportReservations = () => {
        const today = new Date().toISOString().split('T')[0]; // e.g. 2026-03-04
        const columns = [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "guests", label: "Guests" },
            { key: "location", label: "Location" },
            { key: "status", label: "Status" },
            { key: "tableMarking", label: "Table" },
        ];
        const csv = convertToCSV(reservations, columns);
        downloadFile(csv, `${today}_R.csv`, "text/csv;charset=utf-8;");
        toast({ title: "Export Complete", description: `Downloaded as ${today}_R.csv` });
    };

    const handleExportTables = () => {
        const today = new Date().toISOString().split('T')[0];
        const columns = [
            { key: "marking", label: "Marking" },
            { key: "location", label: "Location" },
            { key: "capacity", label: "Capacity" },
            { key: "shape", label: "Shape" },
        ];
        // Group by location for naming
        const locations = [...new Set(tables.map(t => t.location || "All"))];
        const locationName = locations.length === 1 ? locations[0].replace(/[^a-zA-Z0-9]/g, '') : "AllLocations";
        const csv = convertToCSV(tables, columns);
        downloadFile(csv, `${locationName}_${today}.csv`, "text/csv;charset=utf-8;");
        toast({ title: "Export Complete", description: `Downloaded as ${locationName}_${today}.csv` });
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
                        <CardDescription>Download your central data for offline management.</CardDescription>
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
    );
};

export default AdminDataCenter;
