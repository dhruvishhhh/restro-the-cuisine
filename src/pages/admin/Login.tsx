import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Handle the sign-in link on mount
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem("emailForSignIn");

            if (!emailForSignIn) {
                emailForSignIn = window.prompt("Please provide your email for confirmation");
            }

            if (emailForSignIn) {
                setLoading(true);
                signInWithEmailLink(auth, emailForSignIn, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem("emailForSignIn");
                        toast({
                            title: "Success",
                            description: "You have been signed in.",
                        });
                        navigate("/admin");
                    })
                    .catch((error) => {
                        console.error("Error signing in with email link", error);
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: error.message || "Failed to sign in. The link may have expired.",
                        });
                    })
                    .finally(() => setLoading(false));
            }
        }
    }, [navigate, toast]);

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const actionCodeSettings = {
            // URL you want to redirect back to. Ensure this matches your route.
            url: window.location.origin + "/admin/login",
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem("emailForSignIn", email);
            setSent(true);
            toast({
                title: "Link Sent",
                description: "Check your email for the magic link to sign in.",
            });
        } catch (error: any) {
            console.error("Error sending link", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to send the link. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border bg-card text-card-foreground">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-accent" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            We've sent a sign-in link to <span className="text-accent font-medium">{email}</span>. Click the link to securely access the admin panel.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-4">
                        <p className="text-xs text-center text-muted-foreground">
                            Can't find the email? Check your spam folder or try again.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full border-border bg-transparent hover:bg-muted text-muted-foreground"
                            onClick={() => setSent(false)}
                        >
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border bg-card text-card-foreground">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Enter your email to receive a secure sign-in link
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSendLink}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="admin@earthmonksanctuary.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background border-border focus:border-accent transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Magic Link"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
