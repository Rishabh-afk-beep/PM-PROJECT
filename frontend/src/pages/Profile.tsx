import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Shield } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({ name, phone });
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (!user) return null;

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="page-shell max-w-3xl">
      <div className="page-header">
        <div className="section-label mb-3">Account Center</div>
        <h1 className="text-2xl font-display font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information</p>
      </div>

      <Card className="shadow-elevated border-border/40">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-display">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-display text-lg">{user.name}</CardTitle>
              <Badge variant="secondary" className="mt-1 capitalize">
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input value={user.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
