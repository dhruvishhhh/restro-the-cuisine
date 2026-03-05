import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Users, Plus, Trash2, MapPin, Loader2, Calendar, Map as MapIcon, Move, Save, Edit2, Grid, Layers, Download } from "lucide-react";
import { motion } from "framer-motion";
import { format, isSameDay } from "date-fns";
import { generateTimeSlots, getPreviousSlot, getCurrentSlot, isSlotInRange } from "@/lib/timeSlots";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

const timeSlots = generateTimeSlots();
const GRID_SIZE = 2; // 2% grid snapping
const SNAP_THRESHOLD = 1.5; // % - magnetic pull distance
const SNAP_STRENGTH = 0.6; // 0-1, how hard the snap pulls (1 = instant snap)
const EDGE_SNAP_THRESHOLD = 2.0; // % for edge alignment

// Table dimensions in % of container for edge snapping
const getTableDimensions = (shape: string): { w: number; h: number } => {
    // These are approximate % sizes based on pixel sizes relative to container
    switch (shape) {
        case 'rect': case 'oval': return { w: 6, h: 5 };
        case 't-shape': return { w: 6, h: 5.5 };
        default: return { w: 5, h: 5 }; // square, circle
    }
};

const TableWithChairs = ({ table, isReserved, editMode, isSelected, onSelect, isActiveDrag, localPos, onPointerDown }: any) => {
    const capacity = parseInt(table.capacity) || 2;
    const marking = table.marking || "T";
    const shape = table.shape || "square";

    // Use localPos during drag, otherwise use stored position
    const posX = localPos ? localPos.x : (table.x ?? 50);
    const posY = localPos ? localPos.y : (table.y ?? 50);

    return (
        <div
            onPointerDown={editMode ? onPointerDown : undefined}
            style={{
                left: `${posX}%`,
                top: `${posY}%`,
                position: 'absolute',
                cursor: editMode ? (isActiveDrag ? 'grabbing' : 'grab') : 'pointer',
                zIndex: isActiveDrag ? 100 : (isSelected ? 50 : 10),
                transform: `translate(-50%, -50%) scale(${isActiveDrag ? 1.08 : 1})`,
                width: shape === 'rect' || shape === 'oval' ? '120px' : '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                overflow: 'visible',
                opacity: isActiveDrag ? 0.85 : 1,
                transition: isActiveDrag ? 'transform 0.1s ease, opacity 0.1s ease' : 'left 0.15s ease, top 0.15s ease, transform 0.15s ease, opacity 0.15s ease',
                willChange: isActiveDrag ? 'left, top' : 'auto',
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (!editMode) onSelect(isSelected ? null : table.id);
            }}
            className="group"
        >
            <div className={`absolute inset-0 rounded-full border-2 transition-all ${isSelected ? 'border-accent ring-4 ring-accent/20' : 'border-transparent'}`} />

            <div className="relative pointer-events-none">
                {[...Array(capacity)].map((_, i) => {
                    const angle = (i / capacity) * Math.PI * 2;
                    let distance = 38;
                    if (shape === 'rect' || shape === 'oval') distance = 45;
                    else if (shape === 't-shape') distance = 50;

                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;

                    return (
                        <div
                            key={i}
                            className={`absolute w-2.5 h-2.5 rounded-full border border-black/10 shadow-sm transition-all duration-500 ${isReserved ? 'bg-terracotta/80' : 'bg-sage/80'}`}
                            style={{
                                left: `calc(50% + ${x}px - 5px)`,
                                top: `calc(50% + ${y}px - 5px)`,
                            }}
                        />
                    );
                })}

                <div className={`pointer-events-auto flex flex-col items-center justify-center shadow-xl border-2 transition-all duration-500 ${shape === 'circle' ? 'rounded-full w-14 h-14' :
                    shape === 'oval' ? 'rounded-[2rem] w-22 h-14' :
                        shape === 't-shape' ? 'rounded-lg w-22 h-20' :
                            shape === 'rect' ? 'rounded-lg w-22 h-14' :
                                'rounded-xl w-14 h-14'
                    } ${table.status === 'occupied' ? 'bg-emerald-100/30 border-emerald-500/60 text-emerald-700' :
                        table.status === 'cleaning' ? 'bg-blue-100/50 border-blue-400 text-blue-800' :
                            isReserved ? 'bg-amber-100/30 border-gold/60 text-gold' :
                                'bg-white/95 border-gold/40 text-primary'
                    } ${isSelected ? 'ring-4 ring-gold/20' : ''}`}>
                    <span className="text-[6px] font-black tracking-[0.2em] uppercase opacity-40 mb-0.5 pointer-events-none">UNIT</span>
                    <span className="text-sm font-serif font-black pointer-events-none">{marking}</span>
                    <span className="text-[8px] font-bold opacity-60 mt-0.5">{capacity}</span>
                </div>

                {editMode && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] px-2 py-1 rounded-full shadow-lg font-black uppercase tracking-widest invisible group-hover:visible whitespace-nowrap z-50 pointer-events-none border border-primary-foreground/20">
                        {isActiveDrag ? 'Placing...' : 'Move Table'}
                    </div>
                )}
            </div>
        </div>
    );
};

const Tables = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>("all");
    const [newTable, setNewTable] = useState({ marking: "", capacity: "", location: "", shape: "square" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewSlot, setViewSlot] = useState(getCurrentSlot());
    const [viewDate, setViewDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [isLiveSlot, setIsLiveSlot] = useState(true);
    const [reservations, setReservations] = useState<any[]>([]);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [slotStatuses, setSlotStatuses] = useState<Record<string, string>>({});
    const [smartAlignment, setSmartAlignment] = useState(true);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeLines, setActiveLines] = useState<any[]>([]);
    const [localDragPos, setLocalDragPos] = useState<Record<string, { x: number; y: number }>>({});

    // Refs for drag state to avoid stale closures
    const dragStartRef = useRef<{ tableX: number; tableY: number; pointerX: number; pointerY: number } | null>(null);
    const isDraggingRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const lastDragPosRef = useRef<{ x: number; y: number } | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;
    const offsetRef = useRef(offset);
    offsetRef.current = offset;

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

        const q = query(collection(db, "tables"));
        const tableSub = onSnapshot(q, (snapshot) => {
            // Don't update tables from Firestore while dragging - prevents "jump" reset
            if (isDraggingRef.current) return;
            const allTables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            allTables.sort((a: any, b: any) => {
                if (a.location !== b.location) return a.location.localeCompare(b.location);
                return a.marking.localeCompare(b.marking);
            });
            setTables(allTables);
        });

        const resSub = onSnapshot(collection(db, "reservations"), (snapshot) => {
            setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });

        // Fetch Slot-Specific Statuses
        const slotStatusQuery = query(collection(db, "table_slots"));
        const slotStatusSub = onSnapshot(slotStatusQuery, (snapshot) => {
            const statuses: Record<string, string> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const key = `${data.tableId}_${data.date}_${data.slot}`;
                statuses[key] = data.status;
            });
            setSlotStatuses(statuses);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeLocations();
            tableSub();
            resSub();
            slotStatusSub();
        };
    }, [navigate]);

    // Auto-update to current slot when in live mode
    useEffect(() => {
        if (!isLiveSlot) return;
        const interval = setInterval(() => {
            const currentSlot = getCurrentSlot();
            const today = format(new Date(), "yyyy-MM-dd");
            setViewSlot(currentSlot);
            setViewDate(today);
        }, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [isLiveSlot]);

    // Handle non-passive wheel listener to prevent page scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (editMode) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const nextZoom = Math.min(Math.max(0.1, zoom * delta), 10);

                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const canvasX = (mouseX - offset.x) / zoom;
                const canvasY = (mouseY - offset.y) / zoom;

                const nextOffsetX = mouseX - canvasX * nextZoom;
                const nextOffsetY = mouseY - canvasY * nextZoom;

                setZoom(nextZoom);
                setOffset({ x: nextOffsetX, y: nextOffsetY });
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [editMode, zoom, offset]);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTable.marking || !newTable.capacity || !newTable.location) {
            toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
            return;
        }

        setIsSubmitting(true);
        try {
            // Offset new table to avoid overlapping at center
            const randomOffset = (tables.length % 5) * 4;
            await addDoc(collection(db, "tables"), {
                ...newTable,
                capacity: parseInt(newTable.capacity),
                status: "available",
                x: 40 + randomOffset,
                y: 40 + randomOffset,
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

    // ==========================================
    // PRECISION DRAG ENGINE (Pointer-based)
    // ==========================================

    const clientToCanvas = (clientX: number, clientY: number): { x: number; y: number } | null => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        // Client → container-local → undo pan → undo zoom → to percentage
        const px = (clientX - rect.left - offset.x) / zoom;
        const py = (clientY - rect.top - offset.y) / zoom;
        return {
            x: (px / rect.width) * 100,
            y: (py / rect.height) * 100,
        };
    };

    const computeSnap = (rawX: number, rawY: number, dragTableId: string): { x: number; y: number; lines: any[] } => {
        let x = rawX;
        let y = rawY;
        const lines: any[] = [];

        const currentTable = tables.find(t => t.id === dragTableId);
        if (!currentTable) return { x, y, lines };

        const currentDims = getTableDimensions(currentTable.shape || 'square');

        if (smartAlignment) {
            const otherTables = tables.filter(t =>
                t.id !== dragTableId &&
                t.location?.trim().toLowerCase() === currentTable.location?.trim().toLowerCase()
            );

            let snappedX = false;
            let snappedY = false;
            let bestDx = Infinity;
            let bestDy = Infinity;

            for (const other of otherTables) {
                const ox = other.x ?? 50;
                const oy = other.y ?? 50;
                const otherDims = getTableDimensions(other.shape || 'square');

                // === Center-to-Center ===
                const dxCenter = Math.abs(x - ox);
                if (dxCenter < SNAP_THRESHOLD && dxCenter < bestDx) {
                    bestDx = dxCenter;
                    x = ox;
                    snappedX = true;
                }
                const dyCenter = Math.abs(y - oy);
                if (dyCenter < SNAP_THRESHOLD && dyCenter < bestDy) {
                    bestDy = dyCenter;
                    y = oy;
                    snappedY = true;
                }

                // === Edge-to-Edge (left-to-left, right-to-right, left-to-right, etc.) ===
                const myLeft = x - currentDims.w / 2;
                const myRight = x + currentDims.w / 2;
                const myTop = y - currentDims.h / 2;
                const myBottom = y + currentDims.h / 2;

                const oLeft = ox - otherDims.w / 2;
                const oRight = ox + otherDims.w / 2;
                const oTop = oy - otherDims.h / 2;
                const oBottom = oy + otherDims.h / 2;

                // Left edge alignments
                const edgePairsX = [
                    { from: myLeft, to: oLeft, offset: currentDims.w / 2 },    // left-to-left
                    { from: myRight, to: oRight, offset: -currentDims.w / 2 }, // right-to-right
                    { from: myLeft, to: oRight, offset: currentDims.w / 2 },   // left-to-right (flush)
                    { from: myRight, to: oLeft, offset: -currentDims.w / 2 },  // right-to-left (flush)
                ];
                for (const pair of edgePairsX) {
                    const d = Math.abs(pair.from - pair.to);
                    if (d < EDGE_SNAP_THRESHOLD && d < bestDx) {
                        bestDx = d;
                        x = pair.to + pair.offset;
                        snappedX = true;
                    }
                }

                const edgePairsY = [
                    { from: myTop, to: oTop, offset: currentDims.h / 2 },
                    { from: myBottom, to: oBottom, offset: -currentDims.h / 2 },
                    { from: myTop, to: oBottom, offset: currentDims.h / 2 },
                    { from: myBottom, to: oTop, offset: -currentDims.h / 2 },
                ];
                for (const pair of edgePairsY) {
                    const d = Math.abs(pair.from - pair.to);
                    if (d < EDGE_SNAP_THRESHOLD && d < bestDy) {
                        bestDy = d;
                        y = pair.to + pair.offset;
                        snappedY = true;
                    }
                }
            }

            // Build guide lines for snapped axes
            if (snappedX) {
                lines.push({ x1: x, y1: 0, x2: x, y2: 100, type: 'vertical', color: '#C5A059' });
            }
            if (snappedY) {
                lines.push({ x1: 0, y1: y, x2: 100, y2: y, type: 'horizontal', color: '#C5A059' });
            }
        }

        // Grid snap (after alignment so grid doesn't override magnetic snapping)
        if (snapToGrid) {
            x = Math.round(x / GRID_SIZE) * GRID_SIZE;
            y = Math.round(y / GRID_SIZE) * GRID_SIZE;
        }

        // Clamp
        x = Math.max(2, Math.min(98, x));
        y = Math.max(2, Math.min(98, y));

        return { x, y, lines };
    };

    const handlePointerDown = (tableId: string, e: React.PointerEvent) => {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();

        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        isDraggingRef.current = true;
        dragStartRef.current = {
            tableX: table.x ?? 50,
            tableY: table.y ?? 50,
            pointerX: e.clientX,
            pointerY: e.clientY,
        };
        setActiveDragId(tableId);

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const handlePointerMove = (ev: PointerEvent) => {
            if (!dragStartRef.current || !containerRef.current) return;

            // Cancel any pending RAF to avoid double updates
            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                if (!dragStartRef.current || !containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();

                // Delta in pixels → delta in canvas %
                const deltaPixelX = ev.clientX - dragStartRef.current.pointerX;
                const deltaPixelY = ev.clientY - dragStartRef.current.pointerY;

                // Convert pixel delta to % delta, accounting for zoom
                const deltaPctX = (deltaPixelX / zoomRef.current / rect.width) * 100;
                const deltaPctY = (deltaPixelY / zoomRef.current / rect.height) * 100;

                const rawX = dragStartRef.current.tableX + deltaPctX;
                const rawY = dragStartRef.current.tableY + deltaPctY;

                const { x, y, lines } = computeSnap(rawX, rawY, tableId);

                setLocalDragPos(prev => ({ ...prev, [tableId]: { x, y } }));
                lastDragPosRef.current = { x, y };
                setActiveLines(lines);
            });
        };

        const handlePointerUp = async () => {
            target.removeEventListener('pointermove', handlePointerMove);
            target.removeEventListener('pointerup', handlePointerUp);

            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            const finalPos = lastDragPosRef.current || { x: dragStartRef.current?.tableX ?? 50, y: dragStartRef.current?.tableY ?? 50 };

            isDraggingRef.current = false;
            dragStartRef.current = null;
            lastDragPosRef.current = null;
            setActiveDragId(null);
            setActiveLines([]);

            try {
                let fx = finalPos.x;
                let fy = finalPos.y;

                // Persist to Firestore
                await updateDoc(doc(db, "tables", tableId), { x: fx, y: fy });

                // Update local tables state immediately to prevent visual jump
                setTables(prev => prev.map(t => t.id === tableId ? { ...t, x: fx, y: fy } : t));
            } catch (error) {
                console.error("Table drag update failed:", error);
                toast({
                    variant: "destructive",
                    title: "Layout Error",
                    description: "Failed to save table position."
                });
            } finally {
                // Clear local drag position
                setLocalDragPos(prev => {
                    const next = { ...prev };
                    delete next[tableId];
                    return next;
                });
            }
        };

        target.addEventListener('pointermove', handlePointerMove);
        target.addEventListener('pointerup', handlePointerUp);
    };

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const lastPinchDistance = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            lastPinchDistance.current = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastPinchDistance.current !== null) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const delta = dist / lastPinchDistance.current;
            setZoom(prev => Math.min(Math.max(0.5, prev * delta), 5));
            lastPinchDistance.current = dist;
        }
    };

    const handleTouchEnd = () => {
        lastPinchDistance.current = null;
    };

    const handleZoom = (e: React.WheelEvent) => {
        // Handled by non-passive effect now
    };

    const handlePan = (e: any, info: any) => {
        if (isDraggingRef.current) return; // Don't pan while dragging a table
        setOffset(prev => ({
            x: prev.x + info.delta.x,
            y: prev.y + info.delta.y
        }));
    };

    const resetView = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
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
            const slotKey = `${id}_${viewDate}_${viewSlot}`;
            await updateDoc(doc(db, "table_slots", slotKey), {
                status: newStatus,
                tableId: id,
                date: viewDate,
                slot: viewSlot,
                updatedAt: new Date()
            }).catch(async (error) => {
                // If document doesn't exist, create it
                if (error.code === 'not-found') {
                    await addDoc(collection(db, "table_slots"), {
                        status: newStatus,
                        tableId: id,
                        date: viewDate,
                        slot: viewSlot,
                        updatedAt: new Date()
                    });
                } else {
                    throw error;
                }
            });
            toast({ title: "Status Updated", description: `Table is now ${newStatus} for this slot.` });
        } catch (error) {
            console.error("Status update failed", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleAssignReservation = async (reservation: any, table: any) => {
        if (!table || !reservation) return;

        if (reservation.guests > table.capacity) {
            toast({
                variant: "destructive",
                title: "Capacity Error",
                description: `This request is for ${reservation.guests} guests, but Table ${table.marking} only has ${table.capacity} chairs.`
            });
            return;
        }

        setIsAssigning(true);
        try {
            await updateDoc(doc(db, "reservations", reservation.id), {
                tableId: table.id,
                status: "approved" // Automatically approve if assigned to a table
            });
            toast({
                title: "Reservation Assigned",
                description: `Assigned ${reservation.name} to Table ${table.marking}.`
            });
            setSelectedTableId(null);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign reservation."
            });
        } finally {
            setIsAssigning(false);
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
        : tables.filter(t => t.location?.trim().toLowerCase() === selectedLocation.trim().toLowerCase());

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <AdminSidebar userEmail={user?.email} />
            <main className="flex-1 overflow-auto">
                <AdminHeader />
                <div className="p-4 md:p-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col">
                                <h2 className="text-2xl font-serif font-black text-foreground">Sanctuary Seating Plan</h2>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Operational Layout Management</p>
                            </div>
                            <div className="h-10 w-px bg-border hidden md:block" />
                            <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block mb-1">Total Tables</span>
                                <span className="text-xl font-bold text-primary">{filteredTables.length} / {tables.length}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="date-pick" className="text-[10px] uppercase tracking-widest text-muted-foreground">Select Date</Label>
                                <Input
                                    id="date-pick"
                                    type="date"
                                    className="h-10 bg-background text-sm"
                                    value={viewDate}
                                    onChange={(e) => {
                                        setViewDate(e.target.value);
                                        setIsLiveSlot(e.target.value === format(new Date(), "yyyy-MM-dd") && viewSlot === getCurrentSlot());
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="slot-pick" className="text-[10px] uppercase tracking-widest text-muted-foreground">Time Slot</Label>
                                <div className="flex items-center gap-2">
                                    <select
                                        id="slot-pick"
                                        className="h-10 bg-background border border-border rounded-lg px-3 text-sm focus:ring-2 focus:ring-primary outline-none min-w-[140px]"
                                        value={viewSlot}
                                        onChange={(e) => {
                                            setViewSlot(e.target.value);
                                            setIsLiveSlot(e.target.value === getCurrentSlot() && viewDate === format(new Date(), "yyyy-MM-dd"));
                                        }}
                                    >
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>
                                                {slot === getCurrentSlot() ? `⚡ NOW — ${slot}` : slot}
                                            </option>
                                        ))}
                                    </select>
                                    {!isLiveSlot && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10 text-[10px] font-black uppercase tracking-wider gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                            onClick={() => {
                                                setViewSlot(getCurrentSlot());
                                                setViewDate(format(new Date(), "yyyy-MM-dd"));
                                                setIsLiveSlot(true);
                                            }}
                                        >
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            Live
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="loc-pick" className="text-[10px] uppercase tracking-widest text-muted-foreground">Area Filter</Label>
                                <select
                                    id="loc-pick"
                                    className="h-10 bg-background border border-border rounded-lg px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                >
                                    <option value="all">All Sanctuaries</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* CSV Download */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">&nbsp;</Label>
                                <Button
                                    variant="outline"
                                    className="h-10 gap-2 text-xs font-bold"
                                    onClick={() => {
                                        if (filteredTables.length === 0) {
                                            toast({ variant: "destructive", title: "No Data", description: "No tables to export." });
                                            return;
                                        }
                                        const columns = [
                                            { key: "marking", label: "Marking" },
                                            { key: "location", label: "Location" },
                                            { key: "capacity", label: "Capacity" },
                                            { key: "shape", label: "Shape" },
                                        ];
                                        const headers = columns.map(c => c.label).join(",");
                                        const rows = filteredTables.map(item =>
                                            columns.map(col => {
                                                const val = (item as any)[col.key] ?? "";
                                                return `"${String(val).replace(/"/g, '""')}"`;
                                            }).join(",")
                                        );
                                        const csv = [headers, ...rows].join("\n");
                                        const bom = "\uFEFF";
                                        const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        const locName = selectedLocation === "all" ? "AllLocations" : selectedLocation.replace(/[^a-zA-Z0-9]/g, '');
                                        const fileName = `${locName}_${viewDate}.csv`;
                                        link.href = url;
                                        link.download = fileName;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                        toast({ title: "Export Complete", description: `Downloaded as ${fileName}` });
                                    }}
                                >
                                    <Download className="w-4 h-4" /> CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Add Table Form */}
                        <div className="lg:col-span-1">
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
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="shape"
                                                        value="rect"
                                                        checked={newTable.shape === "rect"}
                                                        onChange={() => setNewTable({ ...newTable, shape: "rect" })}
                                                        className="w-4 h-4 accent-primary"
                                                    />
                                                    <span className="text-sm">Rect</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="shape"
                                                        value="oval"
                                                        checked={newTable.shape === "oval"}
                                                        onChange={() => setNewTable({ ...newTable, shape: "oval" })}
                                                        className="w-4 h-4 accent-primary"
                                                    />
                                                    <span className="text-sm">Oval</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="shape"
                                                        value="t-shape"
                                                        checked={newTable.shape === "t-shape"}
                                                        onChange={() => setNewTable({ ...newTable, shape: "t-shape" })}
                                                        className="w-4 h-4 accent-primary"
                                                    />
                                                    <span className="text-sm">T-Shape</span>
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
                        </div>

                        {/* Cafe Layout Visualizer */}
                        <Card className="lg:col-span-2 border-border bg-card overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-accent" />
                                        Sanctuary Seating Plan
                                    </CardTitle>
                                    <CardDescription>Arrange and align your units with precision.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSmartAlignment(!smartAlignment)}
                                        className={`h-9 gap-2 ${smartAlignment ? 'bg-accent/10 text-accent border-accent/20' : ''}`}
                                    >
                                        <Move className="w-4 h-4" />
                                        {smartAlignment ? "Smart Alignment On" : "Smart Alignment Off"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSnapToGrid(!snapToGrid)}
                                        className={`h-9 gap-2 ${snapToGrid ? 'bg-primary/5 text-primary border-primary/20' : ''}`}
                                    >
                                        <Grid className="w-4 h-4" />
                                        {snapToGrid ? "Grid Snapping On" : "Grid Snapping Off"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetView}
                                        className="h-9"
                                    >
                                        Reset View
                                    </Button>
                                    <Button
                                        variant={editMode ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => editMode ? saveLayout() : setEditMode(true)}
                                        className="gap-2 h-9"
                                    >
                                        {editMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                        {editMode ? "Save Arrangement" : "Edit Layout"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent
                                className="p-0 bg-[#F8F8F5] relative overflow-hidden h-[600px] w-full border-b border-border shadow-inner cursor-grab active:cursor-grabbing touch-none"
                                ref={containerRef}
                                onWheel={handleZoom}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        scale: zoom,
                                        x: offset.x,
                                        y: offset.y,
                                        transformOrigin: '0 0'
                                    }}
                                >
                                    {/* "Infinite" Grid Background */}
                                    <div className="absolute pointer-events-none"
                                        style={{
                                            top: -5000,
                                            left: -5000,
                                            width: 10000,
                                            height: 10000,
                                            opacity: 0.05,
                                            backgroundImage: snapToGrid ? `
                                            linear-gradient(to right, #000 1px, transparent 1px),
                                            linear-gradient(to bottom, #000 1px, transparent 1px)
                                         ` : 'radial-gradient(#000 1px, transparent 0)',
                                            backgroundSize: '40px 40px'
                                        }}
                                    />

                                    <div className="absolute inset-0">
                                        {/* Dedicated Pan Layer: Captures background drag without affecting tables */}
                                        <motion.div
                                            className="absolute inset-0 z-0"
                                            onPan={handlePan}
                                            style={{ pointerEvents: 'auto' }}
                                        />

                                        {/* Tables Layer: Higher z-index than Pan Layer */}
                                        <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }}>
                                            {filteredTables.map((table, index) => {
                                                const reservation = reservations.find(res =>
                                                    res.tableId === table.id &&
                                                    res.date === viewDate &&
                                                    isSlotInRange(viewSlot, res.time, 90)
                                                );

                                                const isArrived = reservation?.status === 'arrived';
                                                const isReserved = reservation?.status === 'approved' && !isArrived;

                                                // Slot-specific manual status
                                                const manualStatus = slotStatuses[`${table.id}_${viewDate}_${viewSlot}`];

                                                const finalStatus = isArrived || manualStatus === 'occupied' ? 'occupied' :
                                                    manualStatus === 'cleaning' ? 'cleaning' :
                                                        (isReserved ? 'reserved' : 'available');
                                                const statusLabel = finalStatus === 'occupied' ? 'A' : (isReserved ? 'R' : '');

                                                // Check for overlaps and apply jitter visually if needed
                                                const displayX = table.x || 50;
                                                const displayY = table.y || 50;

                                                return (
                                                    <TableWithChairs
                                                        key={table.id}
                                                        table={{ ...table, status: finalStatus, x: displayX, y: displayY }}
                                                        isReserved={isReserved}
                                                        editMode={editMode}
                                                        isSelected={selectedTableId === table.id}
                                                        onSelect={setSelectedTableId}
                                                        isActiveDrag={activeDragId === table.id}
                                                        localPos={localDragPos[table.id]}
                                                        onPointerDown={(e: React.PointerEvent) => handlePointerDown(table.id, e)}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Alignment Guides Overlay */}
                                        {editMode && activeLines.length > 0 && (
                                            <svg className="absolute inset-0 z-50 pointer-events-none w-full h-full overflow-visible">
                                                {activeLines.map((line, i) => (
                                                    <motion.line
                                                        key={i}
                                                        x1={`${line.x1}%`}
                                                        y1={`${line.y1}%`}
                                                        x2={`${line.x2}%`}
                                                        y2={`${line.y2}%`}
                                                        stroke={line.color || "#C5A059"}
                                                        strokeWidth="1"
                                                        strokeDasharray="4,2"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 0.8 }}
                                                    />
                                                ))}
                                            </svg>
                                        )}

                                        {filteredTables.length === 0 && tables.length > 0 && selectedLocation !== "all" && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-white/50 backdrop-blur-sm z-50">
                                                <p className="text-sm font-bold">No tables found in this area.</p>
                                                <Button variant="link" size="sm" onClick={() => setSelectedLocation("all")}>
                                                    Show All {tables.length} Tables
                                                </Button>
                                            </div>
                                        )}

                                        {filteredTables.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center opacity-40">
                                                    <Grid className="w-8 h-8" />
                                                </div>
                                                <p className="italic text-sm">No tables assigned to this sanctuary area.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Zoom Indicator */}
                                <div className="absolute bottom-4 right-4 flex items-center gap-3 z-50">
                                    <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground pointer-events-none">
                                        Zoom: {Math.round(zoom * 100)}% | Drag to Pan
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected Table / Assignment Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            {selectedTableId ? (() => {
                                const selectedTable = tables.find(t => t.id === selectedTableId);
                                if (!selectedTable) return null;

                                const currentReservation = reservations.find(res =>
                                    res.tableId === selectedTableId &&
                                    res.date === viewDate &&
                                    isSlotInRange(viewSlot, res.time, 90)
                                );

                                const availableRequests = reservations.filter(res =>
                                    res.date === viewDate &&
                                    res.time === viewSlot &&
                                    !res.tableId &&
                                    (res.status === 'pending' || res.status === 'approved')
                                );

                                return (
                                    <Card className="border-gold/30 bg-gold/[0.02] shadow-gold/5 sticky top-8">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/60">Selected Unit</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedTableId(null)}>
                                                    <Plus className="w-3 h-3 rotate-45" />
                                                </Button>
                                            </div>
                                            <CardTitle className="text-xl font-serif">Table {selectedTable.marking}</CardTitle>
                                            <CardDescription className="flex items-center gap-2">
                                                <Users className="w-3 h-3" /> {selectedTable.capacity} Seats • {selectedTable.location}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {currentReservation ? (
                                                <div className="p-4 rounded-xl bg-sage/10 border border-sage/20">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-sage mb-2">Current Occupant</p>
                                                    <p className="text-sm font-bold">{currentReservation.name}</p>
                                                    <p className="text-xs text-muted-foreground">{currentReservation.guests} Guests • {currentReservation.phone}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-4 h-8 text-[10px] uppercase font-bold tracking-widest border-terracotta/20 text-terracotta hover:bg-terracotta/5"
                                                        onClick={() => handleAssignReservation({ id: currentReservation.id, name: "Unassigned", guests: 0 }, { id: null, marking: "None" })}
                                                        disabled={isAssigning}
                                                    >
                                                        Unassign
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Assignment</p>
                                                        <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full font-bold">{availableRequests.length} Available</span>
                                                    </div>

                                                    {availableRequests.length > 0 ? (
                                                        <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                                                            {availableRequests.map(req => (
                                                                <button
                                                                    key={req.id}
                                                                    className={`w-full text-left p-3 rounded-lg border transition-all text-sm group ${req.guests > selectedTable.capacity
                                                                        ? 'bg-muted/30 border-border opacity-50 cursor-not-allowed'
                                                                        : 'bg-white border-border hover:border-gold/50 hover:shadow-md'
                                                                        }`}
                                                                    onClick={() => req.guests <= selectedTable.capacity && handleAssignReservation(req, selectedTable)}
                                                                    disabled={isAssigning || req.guests > selectedTable.capacity}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-bold">{req.name}</span>
                                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${req.guests > selectedTable.capacity ? 'bg-terracotta/10 text-terracotta' : 'bg-sage/10 text-sage'
                                                                            }`}>
                                                                            {req.guests}P
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground truncate">{req.phone}</p>
                                                                    {req.guests > selectedTable.capacity && (
                                                                        <p className="text-[9px] text-terracotta font-bold mt-1 uppercase tracking-tighter">Capacity Exceeded</p>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                                                            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                                                            <p className="text-xs text-muted-foreground">No pending requests for this slot.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })() : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                    <Users className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-sm font-serif italic text-center">Select a table in the layout to manage assignments or edit its details.</p>
                                </div>
                            )}
                        </div>

                        {/* Active Tables List */}
                        <Card className="lg:col-span-4 border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Table Inventory</CardTitle>
                                        <CardDescription>Detailed management of all registered tables.</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-terracotta/10 text-terracotta border border-terracotta/20 rounded-lg text-[10px] font-bold">
                                            {filteredTables.filter(t => {
                                                const prevSlot = getPreviousSlot(viewSlot);
                                                const res = reservations.find(r => r.tableId === t.id && r.date === viewDate && (r.time === viewSlot || r.time === prevSlot));
                                                const manualStatus = slotStatuses[`${t.id}_${viewDate}_${viewSlot}`];
                                                return res?.status === 'arrived' || manualStatus === 'occupied';
                                            }).length} Active
                                        </div>
                                        <div className="px-3 py-1 bg-amber-100/50 text-gold border border-gold/20 rounded-lg text-[10px] font-bold">
                                            {filteredTables.filter(t => {
                                                const prevSlot = getPreviousSlot(viewSlot);
                                                const res = reservations.find(r => r.tableId === t.id && r.date === viewDate && (r.time === viewSlot || r.time === prevSlot));
                                                return res?.status === 'approved' && res?.status !== 'arrived';
                                            }).length} Reserved
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredTables.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                            <p className="text-muted-foreground">No tables found.</p>
                                        </div>
                                    ) : (
                                        [...filteredTables]
                                            .sort((a, b) => {
                                                const getWeight = (t: any) => {
                                                    const prevSlot = getPreviousSlot(viewSlot);
                                                    const res = reservations.find(r => r.tableId === t.id && r.date === viewDate && (r.time === viewSlot || r.time === prevSlot));
                                                    const manualStatus = slotStatuses[`${t.id}_${viewDate}_${viewSlot}`];
                                                    if (res?.status === 'arrived' || manualStatus === 'occupied') return 0; // Active
                                                    if (res?.status === 'approved') return 1; // Reserved
                                                    return 2; // Available
                                                };
                                                return getWeight(a) - getWeight(b);
                                            })
                                            .map((table) => {
                                                const prevSlot = getPreviousSlot(viewSlot);
                                                const reservation = reservations.find(res =>
                                                    res.tableId === table.id &&
                                                    res.date === viewDate &&
                                                    (res.time === viewSlot || res.time === prevSlot)
                                                );

                                                const isArrived = reservation?.status === 'arrived';
                                                const isReserved = reservation?.status === 'approved' && !isArrived;

                                                const manualStatus = slotStatuses[`${table.id}_${viewDate}_${viewSlot}`];
                                                const finalStatus = isArrived || manualStatus === 'occupied' ? 'occupied' :
                                                    manualStatus === 'cleaning' ? 'cleaning' :
                                                        (isReserved ? 'reserved' : 'available');
                                                const statusLabel = finalStatus === 'occupied' ? 'A' : (isReserved ? 'R' : '');

                                                return (
                                                    <div key={table.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-xl border border-border gap-4 hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-inner ${finalStatus === 'occupied' ? "bg-emerald-100 text-emerald-700" : isReserved ? "bg-amber-100 text-gold" : "bg-sage/10 text-sage"}`}>
                                                                {table.marking ? table.marking[0].toUpperCase() : "T"}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-foreground font-serif">{table.marking}</p>
                                                                    <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] uppercase font-bold rounded-lg border border-primary/10">
                                                                        {table.capacity} Persons
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{table.location}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${finalStatus === 'occupied' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : isReserved ? "bg-amber-50 text-gold border-gold/20" :
                                                                "bg-muted/30 text-muted-foreground border-border"
                                                                }`}>
                                                                {statusLabel === 'A' ? "Active" : statusLabel === 'R' ? "Reserved" : "Available"}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {finalStatus === 'occupied' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleStatusToggle(table.id, 'occupied')}
                                                                        className="h-8 text-[10px] uppercase tracking-widest font-bold border-terracotta/30 text-terracotta hover:bg-terracotta/10"
                                                                    >
                                                                        Clear Table
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteTable(table.id)}
                                                                    className="text-muted-foreground hover:text-destructive h-9 w-9"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
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

export default Tables;
