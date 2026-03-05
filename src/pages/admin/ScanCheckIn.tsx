import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatToAmPm } from "@/lib/timeSlots";
import {
    Calendar,
    Users,
    Map as MapIcon,
    QrCode,
    CheckCircle,
    Loader2,
    RefreshCw,
    Camera,
    Check,
    ChevronRight,
    AlertCircle,
    Upload,
    CameraOff
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

                    console.log(`[Scanner] Comparing DB:"${stored}" vs Scanned:"${cleanToken}"`);

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
                    description: `Scanned: "${cleanToken.substring(0, 12)}${cleanToken.length > 12 ? "..." : ""}" — not linked to any reservation.`,
                });
                lastScannedToken.current = null;
                processingToken.current = false;
                setIsProcessing(false);
                return;
            }

            console.log("[Scanner] Match Found:", reservation.name, "Status:", reservation.status);

            // Auto-arrival update
            if (reservation.status === "approved") {
                await updateDoc(doc(db, "reservations", reservation.id), {
                    status: "arrived",
                    arrivedAt: new Date(),
                    checkInTime: new Date(),
                    updatedAt: new Date(),
                });

                if (reservation.tableId) {
                    const slotDocId = `${reservation.tableId}_${reservation.date}_${reservation.time}`;
                    await setDoc(doc(db, "table_slots", slotDocId), {
                        tableId: reservation.tableId,
                        date: reservation.date,
                        slot: reservation.time,
                        status: "occupied",
                        updatedAt: new Date(),
                    }, { merge: true });
                }

                reservation.status = "arrived";
                toast({ title: "Checked In ✓", description: `${reservation.name} marked as Arrived.` });
            } else if (reservation.status === "arrived" || reservation.status === "active") {
                toast({ title: "Already Arrived", description: `${reservation.name} has already been scanned.` });
            } else {
                toast({ title: "Reservation Found", description: `Status: ${reservation.status}` });
            }

            setScannedResult(reservation);
            setIsScannerActive(false);
        } catch (err) {
            console.error("[Scanner] Error:", err);
            toast({ variant: "destructive", title: "Scan Error", description: "Failed to process QR code." });
            lastScannedToken.current = null;
        } finally {
            setIsProcessing(false);
            processingToken.current = false;
        }
    }, [toast]);

    // Start scanner helper
    const startScanner = useCallback(async () => {
        if (!videoRef.current) return;
        stopScanner();
        setError(null);

        try {
            const scanner = new QrScanner(
                videoRef.current,
                (result) => {
                    const token = result.data.trim();
                    if (token && token !== lastScannedToken.current && !processingToken.current) {
                        handleVerifyAndCheckIn(token);
                    }
                },
                {
                    preferredCamera: "environment",
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    maxScansPerSecond: 25,
                }
            );

            qrScannerRef.current = scanner;
            await scanner.start();
            setScannerReady(true);
            console.log("[Scanner] Camera started successfully");
        } catch (err: any) {
            console.error("[Scanner] Camera error:", err);
            setError(err?.message || "Camera access denied or not available.");
            setScannerReady(false);
            setIsScannerActive(false);
        }
    }, [stopScanner, handleVerifyAndCheckIn]);

    // React to isScannerActive changes
    useEffect(() => {
        if (loading) return;

        if (isScannerActive && !scannedResult) {
            startScanner();
        } else {
            stopScanner();
        }

        return () => stopScanner();
    }, [isScannerActive, scannedResult, loading]); // intentionally omit startScanner/stopScanner to avoid loops

    // File upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        stopScanner();
        setIsScannerActive(false);

        try {
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Failed to load image"));
                img.src = imageUrl;
            });

            // Canvas pre-processing for better detection
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const MAX_SIZE = 1000;
            let w = img.width, h = img.height;
            if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
            else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
            canvas.width = w;
            canvas.height = h;
            ctx?.drawImage(img, 0, 0, w, h);

            URL.revokeObjectURL(imageUrl);

            const result = await QrScanner.scanImage(canvas, { returnDetailedScanResult: true });
            console.log("[Scanner] File scan result:", result.data);
            await handleVerifyAndCheckIn(result.data);
        } catch (err) {
            console.error("[Scanner] File scan error:", err);
            toast({
                variant: "destructive",
                title: "Detection Failed",
                description: "We couldn't find a QR code. Try a clearer, closer photo of just the QR.",
            });
            setIsProcessing(false);
        } finally {
            if (e.target) e.target.value = "";
        }
    };

    const handleRescan = () => {
        setScannedResult(null);
        lastScannedToken.current = null;
        processingToken.current = false;
        setIsProcessing(false);
        setIsScannerActive(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "arrived": return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
            case "active": return "bg-blue-500/15 text-blue-700 border-blue-500/30";
            case "approved": return "bg-amber-500/15 text-amber-700 border-amber-500/30";
            case "completed": return "bg-muted text-muted-foreground border-border";
            case "cancelled": return "bg-destructive/15 text-destructive border-destructive/30";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans">
            <AdminSidebar userEmail={user?.email} />
            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
                                <QrCode className="w-10 h-10 text-primary" />
                                SCANNER
                            </h2>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
                                High-Precision Detection
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-bold uppercase text-[10px] border-border hover:bg-muted shadow-sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                            >
                                <Upload className="mr-2 h-4 w-4 text-primary" /> Upload Photo
                            </Button>

                            <Button
                                variant={isScannerActive ? "destructive" : "default"}
                                size="sm"
                                className="rounded-xl font-bold uppercase text-[10px] shadow-sm"
                                onClick={() => {
                                    if (isScannerActive) {
                                        stopScanner();
                                        setIsScannerActive(false);
                                    } else {
                                        setScannedResult(null);
                                        setIsScannerActive(true);
                                    }
                                }}
                                disabled={isProcessing}
                            >
                                {isScannerActive
                                    ? <><CameraOff className="mr-2 h-4 w-4" /> Stop Camera</>
                                    : <><Camera className="mr-2 h-4 w-4" /> Start Camera</>
                                }
                            </Button>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                        {/* Camera Section */}
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-tr from-primary/30 via-accent/10 to-primary/30 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000" />
                                <div className="relative bg-black rounded-[2rem] overflow-hidden shadow-2xl aspect-square border-4 border-border/20 ring-1 ring-border/10">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        playsInline
                                        muted
                                    />

                                    {/* Scan zone overlay - only when camera is active */}
                                    {scannerReady && !isProcessing && !scannedResult && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-64 h-64 border-2 border-primary/30 rounded-3xl relative">
                                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                                                {/* Animated scan line */}
                                                <div
                                                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                                                    style={{
                                                        animation: "scanLine 2.5s ease-in-out infinite",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Processing overlay */}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-30">
                                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                            <p className="font-black text-xl tracking-tighter uppercase italic text-primary-foreground">
                                                Detecting...
                                            </p>
                                        </div>
                                    )}

                                    {/* Camera off / standby */}
                                    {!isScannerActive && !scannerReady && !isProcessing && !scannedResult && (
                                        <div className="absolute inset-0 bg-card flex flex-col items-center justify-center p-12 text-center space-y-6">
                                            {error ? (
                                                <div className="space-y-4">
                                                    <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                                                    <p className="text-foreground font-bold text-lg">{error}</p>
                                                    <Button
                                                        onClick={() => { setError(null); setIsScannerActive(true); }}
                                                        variant="outline"
                                                        className="rounded-2xl border-border"
                                                    >
                                                        Re-initialize
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-primary/5">
                                                        <Camera className="w-10 h-10 text-primary" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-medium">
                                                        Tap below to activate the scanner
                                                    </p>
                                                    <Button
                                                        onClick={() => setIsScannerActive(true)}
                                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs py-7 px-10 rounded-2xl shadow-2xl active:scale-95 transition-all"
                                                    >
                                                        Start Camera
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Captured overlay */}
                                    {scannedResult && (
                                        <div className="absolute inset-0 bg-emerald-800/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center z-40">
                                            <div className="w-28 h-28 bg-emerald-100/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-100/10 animate-in zoom-in-75 duration-500">
                                                <Check className="w-14 h-14 text-emerald-100" />
                                            </div>
                                            <h3 className="font-black text-4xl tracking-tighter text-emerald-50 mb-2 italic">
                                                CAPTURED
                                            </h3>
                                            <p className="text-sm font-black text-emerald-100/80 uppercase tracking-widest mb-10">
                                                {scannedResult.name}
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="rounded-2xl font-black text-xs uppercase h-14 px-12 bg-emerald-50 text-emerald-900 border-none shadow-xl hover:bg-emerald-100 active:scale-95 transition-all"
                                                onClick={handleRescan}
                                            >
                                                Next Scan
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Results Column */}
                        <div className="lg:pt-4">
                            {scannedResult ? (
                                <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden bg-card animate-in slide-in-from-bottom-8 duration-500">
                                    <div className="h-3 w-full bg-emerald-600" />
                                    <CardHeader className="p-8 pb-4 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                                    Verified Guest
                                                </p>
                                                <CardTitle className="text-5xl font-black tracking-tighter">
                                                    {scannedResult.name}
                                                </CardTitle>
                                                <CardDescription className="font-bold text-base text-muted-foreground pt-1">
                                                    {scannedResult.email}
                                                </CardDescription>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${getStatusColor(scannedResult.status)}`}>
                                                {scannedResult.status}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-5 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-black uppercase tracking-[0.1em] text-foreground">
                                                    Entry Clearance Approved
                                                </span>
                                                <p className="text-[10px] text-muted-foreground font-semibold">
                                                    Guest is cleared for seating.
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-8 pt-4 space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/40">
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">
                                                    Group Count
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-6 h-6 text-primary" />
                                                    <span className="text-4xl font-black tracking-tighter">
                                                        {scannedResult.guests}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/40">
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">
                                                    Arrival Slot
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-6 h-6 text-accent" />
                                                    <span className="text-2xl font-black tracking-tight">
                                                        {formatToAmPm(scannedResult.time)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table assignment */}
                                        <div className="p-10 bg-primary/5 rounded-[3rem] border-2 border-primary/15 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group">
                                            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                                                <MapIcon className="w-64 h-64 text-primary" />
                                            </div>
                                            <p className="text-[11px] text-primary font-black uppercase tracking-[0.4em]">
                                                Designated Sanctuary
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
                                        Earth Monk Sanctuary
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Scan line animation */}
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
