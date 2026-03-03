import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    LayoutDashboard,
    Calendar,
    Users,
    Map as MapIcon,
    QrCode,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    Camera
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

const ScanCheckIn = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(true);
    const [scannedResult, setScannedResult] = useState<any>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

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

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText: string) {
            scanner.clear();
            setIsScanning(false);
            handleVerifyToken(decodedText);
        }

        function onScanFailure(error: any) {
            // Silence noise
        }

        return () => {
            unsubscribeAuth();
            scanner.clear().catch(err => console.error("Scanner cleanup error", err));
        };
    }, [navigate]);

    const handleVerifyToken = async (token: string) => {
        setIsCheckingIn(true);
        try {
            const q = query(collection(db, "reservations"), where("checkInToken", "==", token));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "Invalid QR Code",
                    description: "This code does not match any approved reservation."
                });
                setIsScanning(true);
                return;
            }

            const reservation = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as any;

            if (reservation.status === "arrived") {
                toast({
                    title: "Already Checked In",
                    description: `${reservation.name} has already arrived.`
                });
                setScannedResult(reservation);
            } else if (reservation.status !== "approved") {
                toast({
                    variant: "destructive",
                    title: "Reservation Not Approved",
                    description: `This reservation is currently ${reservation.status}.`
                });
                setIsScanning(true);
            } else {
                setScannedResult(reservation);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Verification failed." });
            setIsScanning(true);
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!scannedResult) return;
        setIsCheckingIn(true);
        try {
            // 1. Update Reservation Status
            await updateDoc(doc(db, "reservations", scannedResult.id), {
                status: "arrived",
                checkInTime: new Date()
            });

            // 2. Update Linked Table Status (global + slot-specific)
            if (scannedResult.tableId) {
                // Global status
                await updateDoc(doc(db, "tables", scannedResult.tableId), {
                    status: "occupied"
                });

                // Update table_slots for this specific date/time
                const slotDocId = `${scannedResult.tableId}_${scannedResult.date}_${scannedResult.time}`;
                await setDoc(doc(db, "table_slots", slotDocId), {
                    tableId: scannedResult.tableId,
                    date: scannedResult.date,
                    slot: scannedResult.time,
                    status: "occupied",
                    updatedAt: new Date()
                }, { merge: true });
            }

            toast({
                title: "Check-in Successful",
                description: `${scannedResult.name} has been checked in and Table ${scannedResult.tableMarking || "assigned seat"} is now Active.`
            });

            setScannedResult(null);
            setIsScanning(true);
            // Restarting scanner after state change is handled by reload or manual button
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Check-in failed." });
        } finally {
            setIsCheckingIn(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <AdminSidebar userEmail={user?.email} />
            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-4 md:p-8 space-y-8 flex flex-col items-center">
                    <div className="w-full max-w-md text-center">
                        <h2 className="text-3xl font-bold text-foreground">Entry Check-In</h2>
                        <p className="text-muted-foreground mt-2">Scan guest QR code to verify and assign seats.</p>
                    </div>

                    <div className="w-full max-w-md">
                        {scannedResult ? (
                            <Card className="border-border bg-card overflow-hidden">
                                <div className="bg-sage h-2 w-full" />
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl">{scannedResult.name}</CardTitle>
                                    <CardDescription>{scannedResult.email}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-muted/30 rounded-lg border border-border text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Guests</p>
                                            <p className="text-lg font-bold">{scannedResult.guests}</p>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg border border-border text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Time</p>
                                            <p className="text-lg font-bold">{scannedResult.time}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                                        <p className="text-xs text-primary font-medium mb-1 flex items-center justify-center gap-2">
                                            <MapIcon className="w-4 h-4" /> Assigned Seating
                                        </p>
                                        <p className="text-3xl font-black text-primary uppercase tracking-tighter">
                                            {scannedResult.tableMarking || "TBA"}
                                        </p>
                                        <p className="text-[10px] text-primary/60 mt-1 uppercase font-bold">
                                            {scannedResult.location.split(',')[0]}
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-border"
                                            onClick={() => {
                                                setScannedResult(null);
                                                window.location.reload();
                                            }}
                                            disabled={isCheckingIn}
                                        >
                                            <RefreshCw className="w-4 h-4" /> Rescan
                                        </Button>
                                        <Button
                                            className="flex-1 gap-2 bg-sage hover:bg-sage/90 text-white"
                                            onClick={handleConfirmCheckIn}
                                            disabled={isCheckingIn || scannedResult.status === "arrived"}
                                        >
                                            {isCheckingIn ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    {scannedResult.status === "arrived" ? "Check-in Done" : "Confirm Entry"}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                                    <div id="reader" className="w-full aspect-square md:aspect-video object-cover"></div>
                                    {!isScanning && (
                                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="font-medium">Verifying Entry Pass...</p>
                                        </div>
                                    )}
                                    <div className="p-6 border-t border-border bg-muted/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Scanning Active</p>
                                                <p className="text-xs text-muted-foreground leading-snug">Align the QR code within the frame to automatically check-in guests.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full max-w-md mt-4 grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center p-4 bg-muted/20 border border-border/50 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-sage mb-2" />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Approved Only</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted/20 border border-border/50 rounded-xl">
                            <XCircle className="w-5 h-5 text-terracotta mb-2" />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Auto-Validation</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ScanCheckIn;
