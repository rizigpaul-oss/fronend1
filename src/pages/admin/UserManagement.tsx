import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users, UserCheck, ShieldAlert, Mail, Clock, Shield, Edit, Trash2, ChevronLeft, ChevronRight, Loader2, Sparkles, UserX, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers, getUserById, inviteUser, updateUser, deleteUser } from "@/lib/api";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "viewer";
  status: "Active" | "Invited" | "Disabled";
  joinedAt: string;
  profileCompleted?: boolean;
  profileCompletionRequested?: boolean;
  userType?: string;
  purpose?: string;
  communicationMode?: string;
  institution?: string;
  address?: string;
  additionalInfo?: string;
  updatedAt?: string;
};

const statusBadge: Record<AdminUser["status"], string> = {
  Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Invited: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Disabled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const roleLabel: Record<AdminUser["role"] | "All", string> = {
  All: "All Roles",
  admin: "Admin",
  moderator: "Moderator",
  viewer: "Viewer",
};

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUser["role"] | "All">("All");
  
  // Invite State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminUser["role"]>("viewer");
  const [isInviting, setIsInviting] = useState(false);
  
  // Edit State
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  // Profile details State
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const openProfile = async (user: AdminUser) => {
    setProfileUser(user); // show modal immediately with cached data
    try {
      setProfileLoading(true);
      const fresh = await getUserById(user.id);
      console.log("Fresh user data from API:", fresh);
      setProfileUser(fresh);
    } catch (err) {
      console.error("Failed to fetch fresh user data:", err);
      // keep the cached version already shown
    } finally {
      setProfileLoading(false);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load generic users");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const s = search.trim().toLowerCase();
      const matchesSearch =
        s.length === 0 ||
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s);
      const matchesRole = roleFilter === "All" ? true : u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Pagination bounds
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    try {
      setIsInviting(true);
      const newUser = await inviteUser({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setUsers((prev) => [newUser, ...prev]);
      toast.success("Team member securely invited!");
      setInviteName("");
      setInviteEmail("");
      setInviteRole("viewer");
      setIsInviteOpen(false);
    } catch (err) {
      toast.error("Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      const updated = await updateUser(editUser.id, { role: editUser.role });
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...editUser, ...updated } : u)));
      toast.success(`${editUser.name}'s settings securely updated.`);
    } catch {
      toast.error("Failed to update user.");
    } finally {
      setEditUser(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User access has been permanently revoked.");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleRequestProfileCompletion = async (userId: string, requested: boolean) => {
    try {
      const updated = await updateUser(userId, { profileCompletionRequested: requested });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
      if (profileUser && profileUser.id === userId) {
        setProfileUser({ ...profileUser, ...updated });
      }
      toast.success(requested ? "Profile completion requested." : "Profile completion request dismissed.");
    } catch {
      toast.error("Failed to update profile request.");
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === "Active").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="bg-slate-950 min-h-screen p-6 -mx-6 -mt-6 xl:p-10 pb-16 text-slate-50">
      
      {/* Modern Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-10 animate-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 mb-2 hover:bg-indigo-500/20 cursor-default">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Workspace Administration
          </Badge>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white pb-1">
            Team Directory
          </h1>
          <p className="text-slate-400 max-w-lg">
            Manage your high-security internal staff and control hierarchy permissions elegantly.
          </p>
        </div>
        
        {/* Quick Metric Pills */}
          <div className="flex flex-wrap lg:flex-nowrap gap-3 xl:gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-none transition-colors">
            <div className="bg-blue-500/20 p-1.5 rounded-full"><Users className="w-4 h-4 text-blue-400" /></div>
            <span className="text-sm font-bold text-white">{totalUsers} <span className="font-medium text-slate-400 ml-1">Total</span></span>
          </div>
          <div className="bg-emerald-950/20 backdrop-blur-md border border-emerald-500/10 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-none transition-colors">
            <div className="bg-emerald-500/20 p-1.5 rounded-full"><UserCheck className="w-4 h-4 text-emerald-400" /></div>
            <span className="text-sm font-bold text-white">{activeCount} <span className="font-medium text-emerald-200/50 ml-1">Active</span></span>
          </div>
          <div className="bg-indigo-950/20 backdrop-blur-md border border-indigo-500/10 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-none transition-colors">
            <div className="bg-indigo-500/20 p-1.5 rounded-full"><ShieldAlert className="w-4 h-4 text-indigo-400" /></div>
            <span className="text-sm font-bold text-white">{adminCount} <span className="font-medium text-indigo-200/50 ml-1">Admins</span></span>
          </div>
        </div>
      </div>

      {/* Smart Toolbar Layer */}
      <div className="bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-10 z-10 shadow-none animate-in fade-in duration-700">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
          <Input 
            placeholder="Search team members by name or email..." 
            className="w-full bg-slate-950/50 border-white/5 pl-10 rounded-xl h-11 text-sm focus-visible:ring-indigo-500/50 hover:bg-slate-950/80 transition-colors" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Floating Role Segment Filter */}
          <div className="flex gap-1 bg-slate-950/60 p-1 rounded-xl w-full sm:w-auto overflow-x-auto shadow-inner border border-white/5">
            {(["All", "admin", "moderator", "viewer"] as const).map(r => (
              <button 
                key={r}
                onClick={() => setRoleFilter(r)} 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  roleFilter === r 
                    ? 'bg-white/10 text-white border border-white/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {roleLabel[r]}
              </button>
            ))}
          </div>

          <Button 
            onClick={() => setIsInviteOpen(true)} 
            className="w-full sm:w-auto h-11 px-6 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-colors font-bold"
          >
            <UserPlus className="w-4 h-4 mr-2.5" /> Invite Member
          </Button>
        </div>
      </div>

      {/* Directory Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <span className="font-medium animate-pulse">Loading directory credentials...</span>
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl py-24 flex flex-col items-center justify-center shadow-inner">
          <div className="bg-slate-800 p-4 rounded-full mb-6">
            <UserX className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Profiles Located</h3>
          <p className="text-slate-400 max-w-sm text-center mb-6">
            We couldn't locate any user securely matching the active filter criteria. Try adjusting the query fields above.
          </p>
          <Button variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200" onClick={() => { setSearch(""); setRoleFilter("All"); }}>
            Clear Search Params
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
          {paginatedUsers.map((user) => (
            <div
              key={user.id}
              role="button"
              tabIndex={0}
              onClick={() => openProfile(user)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openProfile(user);
              }}
              className="relative group cursor-pointer bg-[#1e293b]/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-none hover:-translate-y-1 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-full overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                    <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-bold border border-white/10 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 transition-transform duration-300 group-hover:translate-x-1">
                      <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors truncate pr-2" title={user.name}>{user.name}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1.5 truncate pr-2 mt-0.5" title={user.email}>
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" /> 
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Badge variant="outline" className={`${statusBadge[user.status]} px-3 py-1 font-semibold capitalize rounded-md`}>
                    {user.status === "Active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>}
                    {user.status}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-md border border-white/5 font-medium">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="capitalize">{roleLabel[user.role]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-md border border-white/5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{user.joinedAt}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-2 border-t border-white/5 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-indigo-500/15 text-indigo-300 font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditUser(user);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-rose-500/15 text-rose-400 hover:text-rose-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Floating Pagination Logics */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12 bg-slate-900/60 p-3 rounded-2xl border border-white/5 w-max mx-auto backdrop-blur-md shadow-none">
          <Button
            variant="outline"
            className="rounded-xl border-white/10 bg-slate-800/50 hover:bg-indigo-500/20 text-white w-10 h-10 p-0"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-sm font-bold text-white px-4 flex items-center bg-slate-950 border border-white/5 rounded-xl h-10">
            Page <span className="text-indigo-400 mx-1">{currentPage}</span> of {totalPages}
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-white/10 bg-slate-800/50 hover:bg-indigo-500/20 text-white w-10 h-10 p-0"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Invite Flow Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="bg-[#0f172a] border border-indigo-500/20 text-white shadow-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400"><UserPlus className="w-6 h-6" /></div>
              Issue Invitation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Full Member Name
              </label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="bg-slate-900/80 border-white/10 focus-visible:ring-indigo-500 h-12"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Secure Email Address
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-slate-900/80 border-white/10 focus-visible:ring-indigo-500 h-12"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Assigned Network Role
              </label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as AdminUser["role"])}>
                <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-indigo-500 h-12 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10 text-white font-medium">
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="moderator">Content Moderator</SelectItem>
                  <SelectItem value="viewer">Basic Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 pt-4 mt-2">
            <Button variant="ghost" className="hover:bg-white/5 text-slate-300" onClick={() => setIsInviteOpen(false)}>
              Discard
            </Button>
            <Button className="bg-white/10 hover:bg-white/15 text-white font-bold px-6 border border-white/10 shadow-none transition-colors" onClick={handleInvite} disabled={!inviteName.trim() || !inviteEmail.trim() || isInviting}>
              {isInviting ? "Transmitting..." : "Send Secure Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Details Flow Modal */}
      <Dialog open={editUser !== null} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="bg-[#0f172a] border border-blue-500/20 text-white shadow-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><Edit className="w-6 h-6" /></div>
              Configure Security Options
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-5 py-4">
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 text-lg font-bold">
                  {editUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{editUser.name}</div>
                  <div className="text-slate-400 text-sm hidden sm:block">{editUser.email}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Hierarchy Role
                </label>
                <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value as AdminUser["role"] })}>
                  <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-blue-500 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="moderator">Content Moderator</SelectItem>
                    <SelectItem value="viewer">Basic Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Status
                </label>
                <Select value={editUser.status} onValueChange={(value) => setEditUser({ ...editUser, status: value as AdminUser["status"] })}>
                  <SelectTrigger className="bg-slate-900/80 border-white/10 focus:ring-blue-500 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                    <SelectItem value="Active">Active Standing</SelectItem>
                    <SelectItem value="Disabled">Disabled / Revoked</SelectItem>
                    <SelectItem value="Invited">Invite Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-white/10 pt-4 mt-2">
            <Button variant="ghost" className="hover:bg-white/5 text-slate-300" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-none shadow-inner border border-blue-500/20" onClick={handleSaveEdit}>
              Update Identity Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Details Flow Modal */}
      <Dialog open={profileUser !== null} onOpenChange={(open) => !open && setProfileUser(null)}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white shadow-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <div className="bg-white/5 p-2 rounded-xl">
                <UserCheck className="w-6 h-6 text-blue-300" />
              </div>
              User Profile
            </DialogTitle>
          </DialogHeader>

          {profileUser && (
            <div className="space-y-5 py-2">
              {profileLoading && (
                <div className="flex items-center gap-2 text-[12px] text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Loading latest profile data…
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xl">{profileUser.name}</div>
                  <div className="text-slate-400 text-sm">{profileUser.email}</div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`${statusBadge[profileUser.status]} px-3 py-1 font-semibold capitalize rounded-md`}
                  >
                    {profileUser.status}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-md border border-white/5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="capitalize">{roleLabel[profileUser.role]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-md border border-white/5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Joined {profileUser.joinedAt}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      userType
                    </div>
                    <div className="text-sm text-white/85">{profileUser?.userType || "—"}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      purpose
                    </div>
                    <div className="text-sm text-white/85">{profileUser?.purpose || "—"}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      communicationMode
                    </div>
                    <div className="text-sm text-white/85">{profileUser?.communicationMode || "—"}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      institution
                    </div>
                    <div className="text-sm text-white/85">{profileUser?.institution || "—"}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      address
                    </div>
                    <div className="text-sm text-white/85">{profileUser?.address || "—"}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      updatedAt
                    </div>
                    <div className="text-sm text-white/85">{profileUser?.updatedAt || "—"}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    additionalInfo
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-sm text-white/85 bg-white/5 border border-white/10 rounded-xl p-4 max-h-52 overflow-y-auto custom-scrollbar">
                    {profileUser?.additionalInfo || "—"}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-white/10 pt-4 mt-2 flex justify-between">
            <div className="flex items-center gap-3">
              {profileUser?.profileCompletionRequested ? (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1">
                  Profile Completion Requested
                </Badge>
              ) : profileUser?.profileCompleted ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                  Profile Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20 px-3 py-1">
                  Profile Not Completed
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {!profileUser?.profileCompleted && profileUser && (
                <Button
                  variant="outline"
                  className={profileUser?.profileCompletionRequested 
                    ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" 
                    : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                  }
                  onClick={() => handleRequestProfileCompletion(profileUser.id, !profileUser?.profileCompletionRequested)}
                >
                  {profileUser?.profileCompletionRequested ? "Dismiss Request" : "Request Profile Completion"}
                </Button>
              )}
              <Button variant="ghost" className="hover:bg-white/5 text-slate-300" onClick={() => setProfileUser(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
