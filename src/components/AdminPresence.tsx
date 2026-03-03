import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AdminPresence = () => {
    useEffect(() => {
        let heartbeatInterval: NodeJS.Timeout;

        const startHeartbeat = (email: string) => {
            const updatePresence = async () => {
                try {
                    const presenceRef = doc(db, "admin_presence", email.toLowerCase());
                    await setDoc(presenceRef, {
                        email: email.toLowerCase(),
                        lastSeen: serverTimestamp(),
                        status: "online"
                    }, { merge: true });
                } catch (error) {
                    console.error("Heartbeat error:", error);
                }
            };

            // Initial update
            updatePresence();

            // Setup interval (every 30 seconds)
            heartbeatInterval = setInterval(updatePresence, 30000);
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email) {
                startHeartbeat(user.email);
            } else {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
        });

        return () => {
            unsubscribe();
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, []);

    return null; // This component doesn't render anything
};

export default AdminPresence;
