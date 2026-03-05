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
    AlertCircle
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

const ScanCheckIn = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scannedResult, setScannedResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const lastScannedToken = useRef<string | null>(null);
    const processingToken = useRef<boolean>(false);

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
        return () => unsubscribeAuth();
    }, [navigate]);

    const stopScanner = useCallback(() => {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
            setScannerReady(false);
        }
    }, []);

    const startScanner = useCallback(async () => {
        if (!videoRef.current) return;

        stopScanner();

        try {
            const qrScanner = new QrScanner(
                videoRef.current,
                (result) => {
                    const token = result.data.trim();
                    if (token !== lastScannedToken.current && !processingToken.current) {
                        handleVerifyAndCheckIn(token);
                    }
                },
                {
                    preferredCamera: 'environment',
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    maxScansPerSecond: 25,
                }
            );

            qrScannerRef.current = qrScanner;
            await qrScanner.start();
            setScannerReady(true);
            setIsScannerActive(true);
            setError(null);
        } catch (err: any) {
            console.error("Unable to start scanner", err);
            setError("Camera access denied or not found.");
            setScannerReady(false);
        }
    }, [stopScanner]);

    useEffect(() => {
        if (!loading && !scannedResult && isScannerActive) {
            startScanner();
        } else if (!isScannerActive || scannedResult) {
            stopScanner();
        }
        return () => {
            stopScanner();
        };
    }, [loading, scannedResult, startScanner, stopScanner, isScannerActive]);

    const handleVerifyAndCheckIn = async (token: string) => {
        // Clean the scanned value thoroughly
        let cleanToken = token.trim();

        // Try URL decoding in case the QR was generated with encoded characters
        try { cleanToken = decodeURIComponent(cleanToken); } catch (e) { /* ignore */ }
        cleanToken = cleanToken.trim();

        console.log("[Scanner] Raw scanned value:", JSON.stringify(token));
        console.log("[Scanner] Clean token:", JSON.stringify(cleanToken));

        if (processingToken.current) return;
        processingToken.current = true;
        setIsProcessing(true);
        lastScannedToken.current = cleanToken;

        try {
            // Strategy 1: Exact match on checkInToken
            console.log("[Scanner] Strategy 1: Exact match for:", cleanToken);
            let q = query(collection(db, "reservations"), where("checkInToken", "==", cleanToken));
            let querySnapshot = await getDocs(q);

            // Strategy 2: If no match, try fetching ALL reservations and compare manually
            if (querySnapshot.empty) {
                console.warn("[Scanner] Strategy 1 failed. Trying Strategy 2: Full scan...");
                const allReservationsSnapshot = await getDocs(collection(db, "reservations"));

                let matchedDoc: any = null;
                allReservationsSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const storedToken = (data.checkInToken || "").trim();

                    // Log every token for debugging
                    if (storedToken) {
                        console.log(`[Scanner] DB token for ${data.name}: "${storedToken}" vs scanned: "${cleanToken}"`);
                    }

                    // Try various matching strategies
                    if (storedToken === cleanToken) {
                        matchedDoc = { id: docSnap.id, ...data };
                    } else if (storedToken.toLowerCase() === cleanToken.toLowerCase()) {
                        matchedDoc = { id: docSnap.id, ...data };
                    } else if (cleanToken.includes(storedToken) && storedToken.length > 5) {
                        matchedDoc = { id: docSnap.id, ...data };
                    } else if (storedToken.includes(cleanToken) && cleanToken.length > 5) {
                        matchedDoc = { id: docSnap.id, ...data };
                    }
                });

                if (matchedDoc) {
                    console.log("[Scanner] Strategy 2 matched:", matchedDoc.name);
                    // Create a fake snapshot result to continue with existing logic
                    querySnapshot = { empty: false, docs: [{ id: matchedDoc.id, data: () => matchedDoc }] } as any;
                }
            }

            if (querySnapshot.empty) {
                console.warn("[Scanner] All strategies failed for token:", cleanToken);
                toast({
                    variant: "destructive",
                    title: "No Match Found",
                    description: `Scanned: "${cleanToken.substring(0, 12)}..." — not linked to any reservation.`,
                });
                lastScannedToken.current = null;
                processingToken.current = false;
                setIsProcessing(false);
                return;
            }

            const reservation = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as any;
            console.log("[Scanner] Match Found:", reservation.name, "Status:", reservation.status);

            if (reservation.status === "approved") {
                await updateDoc(doc(db, "reservations", reservation.id), {
                    status: "arrived",
                    checkInTime: new Date(),
                    updatedAt: new Date()
                });

                if (reservation.tableId) {
                    const slotDocId = `${reservation.tableId}_${reservation.date}_${reservation.time}`;
                    await setDoc(doc(db, "table_slots", slotDocId), {
                        tableId: reservation.tableId,
                        date: reservation.date,
                        slot: reservation.time,
                        status: "occupied",
                        updatedAt: new Date()
                    }, { merge: true });
                }

                reservation.status = "arrived";
                toast({
                    title: "Checked In ✓",
                    description: `${reservation.name} marked as Arrived.`,
                });
            } else if (reservation.status === "arrived" || reservation.status === "active") {
                toast({
                    title: "Already Arrived",
                    description: `${reservation.name} has already been scanned.`,
                });
            }

            setScannedResult(reservation);
            stopScanner();
            setIsScannerActive(false);

        } catch (error) {
            console.error("[Scanner] Error:", error);
            toast({ variant: "destructive", title: "Scan Error", description: "Failed to process QR." });
            lastScannedToken.current = null;
        } finally {
            setIsProcessing(false);
            processingToken.current = false;
        }
    };

    const handleRescan = () => {
        setScannedResult(null);
        lastScannedToken.current = null;
        setIsScannerActive(true);
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans">
            <AdminSidebar userEmail={user?.email} />
            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
                                <QrCode className="w-10 h-10 text-primary" />
                                SCANNER
                            </h2>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs font-sans">High-Precision Detection</p>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="file"
                                id="qr-file-input"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setIsProcessing(true);
                                    stopScanner(); // Stop camera to free resources

                                    try {
                                        // Pre-process image with Canvas for better detection
                                        const imageUrl = URL.createObjectURL(file);
                                        const img = new Image();
                                        await new Promise((resolve, reject) => {
                                            img.onload = resolve;
                                            img.onerror = reject;
                                            img.src = imageUrl;
                                        });

                                        const canvas = document.createElement("canvas");
                                        const ctx = canvas.getContext("2d");

                                        // Scale down if too large (helps QR detection performance)
                                        const MAX_SIZE = 1000;
                                        let width = img.width;
                                        let height = img.height;
                                        if (width > height) {
                                            if (width > MAX_SIZE) {
                                                height *= MAX_SIZE / width;
                                                width = MAX_SIZE;
                                            }
                                        } else {
                                            if (height > MAX_SIZE) {
                                                width *= MAX_SIZE / height;
                                                height = MAX_SIZE;
                                            }
                                        }

                                        canvas.width = width;
                                        canvas.height = height;
                                        ctx?.drawImage(img, 0, 0, width, height);

                                        // Scan the canvas instead of the raw file
                                        const decodedText = await QrScanner.scanImage(canvas, {
                                            returnDetailedScanResult: true
                                        });

                                        URL.revokeObjectURL(imageUrl);
                                        await handleVerifyAndCheckIn(decodedText.data);
                                    } catch (err) {
                                        console.error("File scan error", err);
                                        toast({
                                            variant: "destructive",
                                            title: "Detection Failed",
                                            description: "We couldn't find a QR code. Try a clearer, closer photo of just the QR.",
                                        });
                                    } finally {
                                        setIsProcessing(false);
                                        if (e.target) e.target.value = "";
                                        // Re-start scanner if no result found
                                        if (!scannedResult) startScanner();
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-bold uppercase text-[10px] border-primary/20 hover:bg-primary/5 shadow-sm"
                                onClick={() => document.getElementById('qr-file-input')?.click()}
                            >
                                <RefreshCw className="mr-2 h-4 w-4 text-primary" /> Upload Photo
                            </Button>

                            <Button
                                variant={isScannerActive ? "destructive" : "default"}
                                size="sm"
                                className="rounded-xl font-bold uppercase text-[10px] shadow-sm ml-2"
                                onClick={() => {
                                    if (isScannerActive) {
                                        stopScanner();
                                        setIsScannerActive(false);
                                    } else {
                                        setIsScannerActive(true);
                                    }
                                }}
                            >
                                <Camera className="mr-2 h-4 w-4" /> {isScannerActive ? "Stop Camera" : "Start Camera"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Camera Section */}
                        <div className="space-y-4">
                            <div className="relative group perspective-1000">
                                <div className="absolute -inset-2 bg-gradient-to-tr from-primary/40 via-accent/20 to-primary/40 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                                <div className="relative bg-black rounded-[2rem] overflow-hidden shadow-2xl aspect-square border-4 border-white/10 ring-1 ring-white/20">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover grayscale-[0.2] contrast-125"
                                    />

                                    {/* Scan Focus Ring */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-64 border-2 border-primary/30 rounded-3xl relative">
                                            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl animate-pulse"></div>
                                            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl animate-pulse"></div>
                                            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl animate-pulse"></div>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl animate-pulse"></div>

                                            {/* Scanning Line */}
                                            <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                                        </div>
                                    </div>

                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-4 z-30">
                                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                            <p className="font-black text-xl tracking-tighter uppercase italic text-white">Detecting...</p>
                                        </div>
                                    )}

                                    {!scannerReady && !isProcessing && !scannedResult && (
                                        <div className="absolute inset-0 bg-zinc-900 border-2 border-white/5 flex flex-col items-center justify-center p-12 text-center space-y-6">
                                            {error ? (
                                                <div className="space-y-4">
                                                    <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                                                    <p className="text-white font-bold text-lg">{error}</p>
                                                    <Button onClick={() => setIsScannerActive(true)} variant="outline" className="rounded-2xl border-white/20 text-white hover:bg-white/10">Re-initialize</Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-primary/10">
                                                        <Camera className="w-10 h-10 text-primary" />
                                                    </div>
                                                    <Button onClick={() => setIsScannerActive(true)} className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs py-7 px-10 rounded-2xl shadow-2xl shadow-primary/30 transform active:scale-95 transition-all">
                                                        Start Camera
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {scannedResult && (
                                        <div className="absolute inset-0 bg-sage/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center transition-all duration-700 z-40">
                                            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-3xl animate-in zoom-in-75 duration-500 ring-8 ring-white/10">
                                                <Check className="w-16 h-16 text-white" />
                                            </div>
                                            <h3 className="font-black text-4xl tracking-tighter text-white mb-2 italic">CAPTURED</h3>
                                            <p className="text-sm font-black text-white/80 uppercase tracking-widest mb-10">{scannedResult.name}</p>
                                            <Button
                                                variant="outline"
                                                className="rounded-2xl font-black text-xs uppercase h-14 px-12 bg-white text-sage border-none shadow-xl hover:bg-white/90 transform hover:-translate-y-1 transition-all"
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
                                    <div className="h-4 w-full bg-sage" />

                                    <CardHeader className="p-8 pb-4 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Verified Guest</p>
                                                <CardTitle className="text-5xl font-black tracking-tighter">{scannedResult.name}</CardTitle>
                                                <CardDescription className="font-bold text-base text-muted-foreground pt-1">{scannedResult.email}</CardDescription>
                                            </div>
                                            <div className="px-6 py-2 bg-sage/10 text-sage rounded-2xl border-2 border-sage/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {scannedResult.status}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-3xl border border-border/50">
                                            <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center shadow-inner">
                                                <CheckCircle className="w-6 h-6 text-sage" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-black uppercase tracking-[0.1em] text-foreground">Entry Clearance Approved</span>
                                                <p className="text-[10px] text-muted-foreground font-semibold">Guest is now cleared for seating.</p>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-8 pt-4 space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-muted/20 rounded-[2rem] border border-border/40 hover:bg-muted/30 transition-colors">
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Group Count</p>
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-6 h-6 text-primary" />
                                                    <span className="text-4xl font-black tracking-tighter">{scannedResult.guests}</span>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-muted/20 rounded-[2rem] border border-border/40 hover:bg-muted/30 transition-colors">
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Arrival Slot</p>
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-6 h-6 text-accent" />
                                                    <span className="text-2xl font-black tracking-tight font-sans">{formatToAmPm(scannedResult.time)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-10 bg-primary/5 rounded-[3rem] border-2 border-primary/20 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group shadow-inner">
                                            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                                                <MapIcon className="w-64 h-64 text-primary" />
                                            </div>
                                            <p className="text-[11px] text-primary font-black uppercase tracking-[0.4em]">Designated Sanctuary</p>
                                            <p className="text-8xl font-black text-primary tracking-tighter uppercase leading-none font-sans drop-shadow-sm">
                                                {scannedResult.tableMarking || "TBA"}
                                            </p>
                                            <div className="flex items-center gap-2 text-primary/60 font-black text-[11px] uppercase tracking-widest mt-4 bg-white/80 px-4 py-2 rounded-full border border-primary/10 shadow-sm">
                                                <ChevronRight className="w-5 h-5" />
                                                {scannedResult.location?.split(',')[0]}
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
                                <div className="h-full min-h-[550px] flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-border/40 rounded-[3rem] space-y-10 bg-muted/5 backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
                                    <div className="relative">
                                        <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[80px] animate-pulse"></div>
                                        <div className="relative p-14 bg-white rounded-full shadow-3xl border-2 border-border/50 ring-8 ring-primary/5">
                                            <QrCode className="w-24 h-24 text-primary opacity-30" />
                                        </div>
                                    </div>
                                    <div className="space-y-4 max-w-xs relative z-10">
                                        <p className="text-4xl font-black tracking-tighter uppercase italic text-foreground opacity-90 leading-none">Standby</p>
                                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                                            Align the guest pass within the digital scan frame for instantaneous verification.
                                        </p>
                                    </div>

                                    <div className="w-40 h-1 rounded-full bg-gradient-to-r from-transparent via-border to-transparent" />

                                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.5em] mt-4">Earth Monk Sanctuary Logic</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ScanCheckIn;
