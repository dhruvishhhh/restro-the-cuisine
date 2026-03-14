import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { format, differenceInMinutes, parse } from "date-fns";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatToAmPm, normalizeTimeTo24h } from "@/lib/timeSlots";
import {
    Calendar,
    Users,
    Map as MapIcon,
    QrCode,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    Camera,
    Check,
    ChevronRight,
    AlertCircle,
    Upload,
    CameraOff,
    Clock
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

const ScanCheckIn = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scannedResult, setScannedResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const lastScannedToken = useRef<string | null>(null);
    const processingToken = useRef<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    // Auth check
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); setLoading(false); }
            else navigate("/admin/login");
        });
        return () => unsub();
    }, [navigate]);

    // Stop scanner helper
    const stopScanner = useCallback(() => {
        try {
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }
        } catch (e) {
            console.warn("[Scanner] Stop error:", e);
        }
        setScannerReady(false);
    }, []);

    // Token verification & check-in
    const handleVerifyAndCheckIn = useCallback(async (token: string) => {
        let cleanToken = token.trim();
        try { cleanToken = decodeURIComponent(cleanToken); } catch (_) { /* ignore */ }
        cleanToken = cleanToken.trim();

        console.log("[Scanner] Raw:", JSON.stringify(token));
        console.log("[Scanner] Clean:", JSON.stringify(cleanToken));

        if (!cleanToken || processingToken.current) return;
        processingToken.current = true;
        setIsProcessing(true);
        lastScannedToken.current = cleanToken;

        try {
            // Strategy 1: Exact Firestore query
            console.log("[Scanner] Strategy 1: Exact match for:", cleanToken);
            const q = query(collection(db, "reservations"), where("checkInToken", "==", cleanToken));
            const snapshot = await getDocs(q);

            let reservation: any = null;

            if (!snapshot.empty) {
                const d = snapshot.docs[0];
                reservation = { id: d.id, ...d.data() };
                console.log("[Scanner] Strategy 1 matched:", reservation.name);
            } else {
                // Strategy 2: Full scan with fuzzy matching
                console.warn("[Scanner] Strategy 1 failed. Trying Strategy 2: Full scan...");
                const allDocs = await getDocs(collection(db, "reservations"));

                allDocs.forEach((docSnap) => {
                    if (reservation) return; // already found
                    const data = docSnap.data();
                    const stored = (data.checkInToken || "").trim();
                    if (!stored) return;

                    console.log(`[Scanner] Comparing DB: "${stored}" vs Scanned: "${cleanToken}"`);

                    if (stored === cleanToken) {
                        reservation = { id: docSnap.id, ...data };
                    } else if (stored.toLowerCase() === cleanToken.toLowerCase()) {
                        reservation = { id: docSnap.id, ...data };
                    } else if (cleanToken.includes(stored) && stored.length > 5) {
                        reservation = { id: docSnap.id, ...data };
                    } else if (stored.includes(cleanToken) && cleanToken.length > 5) {
                        reservation = { id: docSnap.id, ...data };
                    }
                });

                if (reservation) console.log("[Scanner] Strategy 2 matched:", reservation.name);
            }

            if (!reservation) {
                console.warn("[Scanner] All strategies failed for token:", cleanToken);
                toast({
                    variant: "destructive",
                    title: "No Match Found",
                    description: `Scanned: "${cleanToken.substring(0, 12)}${cleanToken.length > 12 ? "..." : ""}" not linked to any reservation.`,
                });
                lastScannedToken.current = null;
                processingToken.current = false;
                setIsProcessing(false);
                return;
            }

            console.log("[Scanner] Match Found:", reservation.name, "Status:", reservation.status);

            // Time difference calculation
            const now = new Date();
            const resDateStr = reservation.date || format(now, "yyyy-MM-dd");
            const resTime24 = normalizeTimeTo24h(reservation.time || "12:00 PM");
            
            let diffMinutes = 0;
            try {
                const resDateTime = parse(`${resDateStr} ${resTime24}`, "yyyy-MM-dd HH:mm", new Date());
                diffMinutes = differenceInMinutes(now, resDateTime);
            } catch (e) {
                console.warn("[Scanner] Date parsing error:", e);
            }

            let arrivalMessage = "";
            let isWarning = false;
            let isExpired = false;

            if (isNaN(diffMinutes)) {
                arrivalMessage = "Time invalid / unscheduled arrival.";
            } else if (diffMinutes > 60) {
                isExpired = true;
                arrivalMessage = `EXPIRED: ${diffMinutes} mins past schedule (>1 hour late).`;
            } else if (Math.abs(diffMinutes) <= 30) {
                if (diffMinutes < 0) {
                    arrivalMessage = `${Math.abs(diffMinutes)} minutes early.`;
                } else if (diffMinutes > 0) {
                    arrivalMessage = `${diffMinutes} minutes late.`;
                } else {
                    arrivalMessage = "Perfect timing!";
                }
            } else {
                isWarning = true;
                if (diffMinutes < -30) {
                    arrivalMessage = `Too early! (${Math.abs(diffMinutes)} mins before schedule).`;
                } else {
                    arrivalMessage = `Too late! (${diffMinutes} mins past schedule).`;
                }
            }

            // Auto-arrival update / Expulsion of late reservations
            if (isExpired || (reservation.status === "cancelled" && reservation.cancelReason === "auto_expired")) {
                toast({
                    variant: "destructive",
                    title: "Reservation Expired",
                    description: `Cannot check in. Guest did not arrive within the 60-minute active window.`
                });
                reservation.status = "expired";
                reservation.arrivalNote = "EXPIRED (Late > 60 mins)";
                if (reservation.status !== "cancelled") {
                    await updateDoc(doc(db, "reservations", reservation.id), {
                        status: "cancelled",
                        cancelReason: "auto_expired",
                        updatedAt: now,
                        arrivalNote: "EXPIRED (Late > 60 mins)"
                    });
                }
            } else if (["approved", "pending"].includes(reservation.status)) {
                
                await updateDoc(doc(db, "reservations", reservation.id), {
                    status: "arrived",
                    arrivedAt: now,
                    activeAt: now,
                    checkInTime: now,
                    updatedAt: now,
                    arrivalDiffMinutes: isNaN(diffMinutes) ? 0 : diffMinutes,
                    arrivalNote: arrivalMessage,
                    cancelReason: null // clear if it was auto-expired
                });

                if (reservation.tableId) {
                    const slotDocId = `${reservation.tableId}_${reservation.date}_${reservation.time}`;
                    await setDoc(doc(db, "table_slots", slotDocId), {
                        tableId: reservation.tableId,
                        date: reservation.date,
                        slot: reservation.time,
                        status: "occupied",
                        updatedAt: now,
                    }, { merge: true });
                }

                reservation.status = "arrived";
                reservation.arrivedAt = now; // For UI display
                reservation.arrivalNote = arrivalMessage;

                toast({
                    variant: isWarning ? "destructive" : "default",
                    title: isWarning ? "⚠️ Schedule Alert" : "Checked In ✓",
                    description: `${reservation.name}: ${arrivalMessage}`
                });
            } else if (reservation.status === "cancelled") {
                toast({
                    variant: "destructive",
                    title: "Reservation Cancelled",
                    description: reservation.cancelReason ? `Cancelled: ${reservation.cancelReason}` : `This reservation was manually cancelled.`
                });
                reservation.arrivalNote = "CANCELLED";
            } else if (reservation.status === "arrived" || reservation.status === "active") {
                toast({ title: "Already Arrived", description: `${reservation.name} has already been scanned.` });
                reservation.arrivalNote = arrivalMessage || "Already Checked In";
            } else {
                toast({ title: "Reservation Found", description: `Status: ${reservation.status}` });
                reservation.arrivalNote = "Status: " + reservation.status;
            }

            setScannedResult(reservation);
            setIsScannerActive(false);
            stopScanner();
        } catch (err: any) {
            console.error("[Scanner] Error:", err);
            toast({ variant: "destructive", title: "Scan Error", description: err.message || JSON.stringify(err) || "Failed to process QR code." });
            lastScannedToken.current = null;
        } finally {
            setIsProcessing(false);
            processingToken.current = false;
        }
    }, [toast, stopScanner]);

    // Start scanner helper
    const startScanner = useCallback(() => {
        setIsScannerActive(true);
        
        setTimeout(async () => {
            if (!videoRef.current) {
                setIsScannerActive(false);
                return;
            }
            
            stopScanner();
            setError(null);

            try {
                const scanner = new QrScanner(
                    videoRef.current,
                    (result) => {
                        console.log("[Scanner] RAW Decode Result:", result);
                        const data = typeof result === 'string' ? result : result?.data;
                        const token = data ? data.trim() : '';
                        if (token && token !== lastScannedToken.current && !processingToken.current) {
                            handleVerifyAndCheckIn(token);
                        }
                    },
                    {
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        maxScansPerSecond: 10, // lowered for stability
                    }
                );

                qrScannerRef.current = scanner;
                
                await scanner.start();
                setScannerReady(true);
            } catch (e: any) {
                console.error("[Scanner] Start failed:", e);
                setError(e.message || "Failed to access camera.");
                setIsScannerActive(false);
            }
        }, 300); // Give DOM a proper moment to mount the video element before starting
    }, [handleVerifyAndCheckIn, stopScanner]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopScanner();
    }, [stopScanner]);

    // Handle image upload scanning
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const result = await QrScanner.scanImage(file);
            console.log("[Scanner] Image RAW Result:", result);
            const data = typeof result === 'string' ? result : (result as any)?.data;
            if (data) {
                handleVerifyAndCheckIn(data);
            } else {
                toast({ variant: "destructive", title: "Scan Failed", description: "No clear QR code data could be extracted." });
            }
        } catch (err) {
            console.error("[Scanner] File error:", err);
            toast({ variant: "destructive", title: "Scan Failed", description: "No QR code found in image." });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRescan = () => {
        setScannedResult(null);
        lastScannedToken.current = null;
        startScanner();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "arrived": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "active": return "bg-sky-500/10 text-sky-600 border-sky-500/20";
            case "approved": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
            case "expired": return "bg-destructive/10 text-destructive border-destructive/20";
            case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <AdminSidebar userEmail={user?.email} />
            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Biometric Entry Point</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none text-foreground">
                                Reception <span className="text-primary underline decoration-primary/20 underline-offset-8">Terminal</span>
                            </h1>
                            <p className="text-muted-foreground font-medium text-lg max-w-xl leading-relaxed">
                                Universal QR Verification System for instantaneous guest check-in and table allocation.
                            </p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
                        {/* Scanner Area */}
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl relative group">
                                <CardHeader className="border-b border-border/50 p-8 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">Active Lens</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Live feed verification</CardDescription>
                                        </div>
                                    </div>

                                    {!scannedResult && (
                                        <Button
                                            onClick={isScannerActive ? stopScanner : startScanner}
                                            variant={isScannerActive ? "destructive" : "default"}
                                            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-lg hover:scale-105 transition-all"
                                        >
                                            {isScannerActive ? (
                                                <><CameraOff className="w-4 h-4" /> Shutdown</>
                                            ) : (
                                                <><Camera className="w-4 h-4" /> Initialize</>
                                            )}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                        {isScannerActive ? (
                                            <>
                                                <video ref={videoRef} className="w-full h-full object-cover grayscale-[0.3] brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000" />
                                                <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-primary/50 rounded-[4rem] pointer-events-none">
                                                    <div className="absolute -top-2 -left-2 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                                                    <div className="absolute -top-2 -right-2 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                                                    <div className="absolute -bottom-2 -left-2 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                                                    <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-[3.8rem]" />
                                                    {/* Scanning Line */}
                                                    <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-[scanLine_4s_linear_infinite]" />
                                                </div>
                                                {scannerReady && (
                                                    <div className="absolute bottom-10 left-10 flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full border border-white/10 text-white/90 text-[10px] font-black tracking-widest uppercase backdrop-blur-md">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                        Lens Synced
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-8 p-20 text-center group">
                                                <div className="p-10 bg-muted/20 rounded-full border-2 border-dashed border-muted-foreground/30 relative">
                                                    <Camera className="w-16 h-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black uppercase tracking-tighter opacity-40">System Idle</h3>
                                                    <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-[0.2em]">Deployment Required</p>
                                                </div>
                                            </div>
                                        )}

                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-50">
                                                <div className="relative">
                                                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                                    <div className="absolute inset-0 blur-2xl bg-primary/30 animate-pulse" />
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-[0.4em] text-primary-foreground animate-pulse">
                                                    Decrypting Secure Token...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8 bg-muted/30 border-t border-border/50">
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full sm:w-auto h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 border-2 border-border/50 hover:bg-card transition-all"
                                            >
                                                <Upload className="w-4 h-4" /> Import Archive
                                            </Button>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:block">
                                                Or upload a capture from storage
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {error && (
                                <div className="p-6 bg-red-500/10 text-red-500 rounded-3xl border-2 border-red-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                                    <AlertCircle className="w-6 h-6 shrink-0" />
                                    <p className="text-xs font-black uppercase tracking-widest leading-relaxed">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Result Display Area */}
                        <div className="h-full">
                            {scannedResult ? (
                                <Card className="h-full border-2 border-primary/20 bg-card rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        {scannedResult.status === "expired" || scannedResult.status === "cancelled" ? (
                                            <XCircle className="w-48 h-48 text-destructive opacity-50" />
                                        ) : (
                                            <CheckCircle className="w-48 h-48 text-primary" />
                                        )}
                                    </div>

                                    <CardHeader className="p-10 pb-0">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${getStatusColor(scannedResult.status)}`}>
                                                    {scannedResult.status}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                    Order Ref: <span className="text-foreground">{scannedResult.id.slice(-8).toUpperCase()}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className={`text-5xl font-black tracking-tighter uppercase italic leading-none ${scannedResult.status === "expired" || scannedResult.status === "cancelled" ? "text-destructive" : "text-foreground"}`}>
                                                    {scannedResult.name}
                                                </h2>
                                                <p className={`font-black uppercase tracking-[0.3em] text-[10px] ${scannedResult.status === "expired" || scannedResult.status === "cancelled" ? "text-destructive" : "text-muted-foreground"}`}>
                                                    {scannedResult.status === "expired" || scannedResult.status === "cancelled" ? "Guest Checked-in Failed ✗" : "Guest Verified ✓"}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-10 space-y-8 flex-1">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/50">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Party Size</span>
                                                </div>
                                                <div className="text-3xl font-black text-foreground tracking-tighter">{scannedResult.guestCount} <span className="text-xs text-muted-foreground">PAX</span></div>
                                            </div>
                                            <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/50">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Reservation</span>
                                                </div>
                                                <div className="text-xl font-black text-foreground tracking-tight leading-none">
                                                    {scannedResult.time}
                                                    <span className="block text-[10px] text-muted-foreground mt-1 uppercase">
                                                        {format(new Date(scannedResult.date), "MMM dd")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Professional Arrival Note */}
                                        <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-4 rounded-2xl border flex items-center justify-center ${scannedResult.arrivalNote?.includes("Too") ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"}`}>
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Arrival Status</p>
                                                    <p className="text-xl font-black text-foreground tracking-tight">
                                                        {scannedResult.arrivalNote || "Guest Arrived"}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-bold">
                                                        Exact: {scannedResult.arrivedAt ? format(new Date(scannedResult.arrivedAt.toDate ? scannedResult.arrivedAt.toDate() : scannedResult.arrivedAt), "HH:mm:ss") : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table assignment */}
                                        <div className="p-10 bg-primary/5 rounded-[3rem] border-2 border-primary/15 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group">
                                            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                                                <MapIcon className="w-64 h-64 text-primary" />
                                            </div>
                                            <p className="text-[11px] text-primary font-black uppercase tracking-[0.4em]">
                                                Designated Location
                                            </p>
                                            <p className="text-8xl font-black text-primary tracking-tighter uppercase leading-none drop-shadow-sm">
                                                {scannedResult.tableMarking || "TBA"}
                                            </p>
                                            <div className="flex items-center gap-2 text-primary/60 font-black text-[11px] uppercase tracking-widest mt-4 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                                                <ChevronRight className="w-5 h-5" />
                                                {scannedResult.location?.split(",")[0]}
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            className="w-full h-16 rounded-[1.5rem] text-muted-foreground font-black uppercase tracking-[0.2em] text-xs gap-3 hover:bg-muted hover:text-foreground border border-border/50 transition-all shadow-lg active:scale-[0.98]"
                                            onClick={handleRescan}
                                        >
                                            <RefreshCw className="w-5 h-5" /> New Session
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full min-h-[550px] flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-border/40 rounded-[3rem] space-y-10 bg-muted/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
                                    <div className="relative">
                                        <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[80px] animate-pulse" />
                                        <div className="relative p-14 bg-card rounded-full shadow-xl border-2 border-border/50 ring-8 ring-primary/5">
                                            <QrCode className="w-24 h-24 text-primary opacity-30" />
                                        </div>
                                    </div>
                                    <div className="space-y-4 max-w-xs relative z-10">
                                        <p className="text-4xl font-black tracking-tighter uppercase italic text-foreground opacity-90 leading-none">
                                            Standby
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                                            Align the guest pass within the digital scan frame for instantaneous verification.
                                        </p>
                                    </div>
                                    <div className="w-40 h-1 rounded-full bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.5em] mt-4">
                                        Restro Global Cuisine
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes scanLine {
                    0%, 100% { top: 8px; opacity: 0; }
                    10% { opacity: 1; }
                    50% { top: calc(100% - 8px); opacity: 1; }
                    60% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default ScanCheckIn;
