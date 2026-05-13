import { useState, useMemo } from "react";
import { type MentorshipCategory, type MenteeStudent } from "@/lib/types";
import {
  useMentorshipCategories, useMentees,
  useCreateMentorshipCategory, useDeleteMentorshipCategory,
  useCreateMentee, useUpdateMentee, useDeleteMentee,
} from "@/hooks/use-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Users, Tag, FileSpreadsheet, Phone, Mail, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/loading-skeleton";
import ConfirmDelete from "@/components/ConfirmDelete";
import EmptyState from "@/components/resource-library/EmptyState";

const Mentorship = () => {
  const { data: categories = [], isLoading: catsLoading } = useMentorshipCategories();
  const { data: students = [], isLoading } = useMentees();

  const createCategory = useCreateMentorshipCategory();
  const deleteCategory = useDeleteMentorshipCategory();
  const createMentee = useCreateMentee();
  const updateMentee = useUpdateMentee();
  const deleteMentee = useDeleteMentee();

  const [newCatName, setNewCatName] = useState("");
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<MenteeStudent | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: "", email: "", phone: "", marks_sheet_link: "",
    category_values: {} as Record<string, string>,
  });
  const [selectedStudent, setSelectedStudent] = useState<MenteeStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cats = categories as MentorshipCategory[];
  const q = searchQuery.toLowerCase();
  const filteredStudents = useMemo(() =>
    (students as MenteeStudent[]).filter(s =>
      !q || (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q) || (s.phone || "").includes(q)
    ),
    [students, q]
  );

  const resetStudentForm = () => {
    setStudentForm({ name: "", email: "", phone: "", marks_sheet_link: "", category_values: {} });
    setEditingStudent(null);
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    await createCategory.mutateAsync(newCatName.trim());
    setNewCatName(""); setCatDialogOpen(false);
  };

  const openAddStudent = () => { resetStudentForm(); setStudentDialogOpen(true); };
  const openEditStudent = (s: MenteeStudent) => {
    setEditingStudent(s);
    setStudentForm({ name: s.name, email: s.email, phone: s.phone, marks_sheet_link: s.marks_sheet_link || "", category_values: { ...(s.category_values || {}) } });
    setStudentDialogOpen(true);
  };

  const saveStudent = async () => {
    if (!studentForm.name.trim() || !studentForm.email.trim()) return;
    const payload = { ...studentForm, marks_sheet_link: studentForm.marks_sheet_link || undefined };
    if (editingStudent) {
      await updateMentee.mutateAsync({ id: editingStudent.id, data: payload });
    } else {
      await createMentee.mutateAsync(payload);
    }
    setStudentDialogOpen(false); resetStudentForm();
  };

  return (
    <div className="page-shell">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-label mb-3">Student Overview</div>
          <h1 className="text-2xl font-display font-semibold">Mentorship Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage students, categories & marks</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Tag className="h-4 w-4 mr-1" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">New Category</DialogTitle>
                <DialogDescription className="sr-only">Add a new category to track for students.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Category Name</Label><Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Blood Group, Address..." /></div>
                <Button onClick={addCategory} className="w-full" disabled={createCategory.isPending}>{createCategory.isPending ? "Creating..." : "Create Category"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={openAddStudent}><Plus className="h-4 w-4 mr-1" /> Add Student</Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {catsLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-6 w-20 rounded bg-muted animate-pulse" />)}
        {!catsLoading && cats.map((cat) => (
          <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
            {cat.name}
            <ConfirmDelete
              itemName={`category "${cat.name}"`}
              onConfirm={async () => { await deleteCategory.mutateAsync(cat.id); }}
              className="h-5 w-5 ml-0.5"
              size="icon"
            />
          </Badge>
        ))}
        {!catsLoading && cats.length === 0 && <p className="text-sm text-muted-foreground">No categories yet. Add one to get started.</p>}
      </div>

      {/* Stats + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 pt-4">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-display font-bold">{filteredStudents.length}</p><p className="text-xs text-muted-foreground">Total Students</p></div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 pt-4">
            <Tag className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-display font-bold">{cats.length}</p><p className="text-xs text-muted-foreground">Categories</p></div>
          </CardContent>
        </Card>
        <div className="flex-[2] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students by name, email, or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-full" />
        </div>
      </div>

      {/* Student Table */}
      <Card>
        <CardHeader><CardTitle className="text-base font-display">Student Records</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? <SkeletonTable rows={5} cols={4} /> : filteredStudents.length === 0 ? (
            <EmptyState icon={Users} message={searchQuery ? "No students match your search" : "No students yet"} description="Add students using the button above" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  {cats.map((cat) => <TableHead key={cat.id} className="hidden md:table-cell">{cat.name}</TableHead>)}
                  <TableHead className="hidden md:table-cell">Marks Sheet</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedStudent(s)}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{s.email}</div>
                        <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{s.phone}</div>
                      </div>
                    </TableCell>
                    {cats.map((cat) => <TableCell key={cat.id} className="hidden md:table-cell text-sm">{(s.category_values || {})[cat.id] || "—"}</TableCell>)}
                    <TableCell className="hidden md:table-cell">
                      {s.marks_sheet_link ? (
                        <a href={s.marks_sheet_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="gap-1"><FileSpreadsheet className="h-3.5 w-3.5" /> Open</Button>
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditStudent(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <ConfirmDelete itemName={`student "${s.name}"`} onConfirm={async () => { if (selectedStudent?.id === s.id) setSelectedStudent(null); await deleteMentee.mutateAsync(s.id); }} className="h-7 w-7" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Student Detail */}
      {selectedStudent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display">{selectedStudent.name} — Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>Close</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Email:</span> {selectedStudent.email}</div>
              <div><span className="text-muted-foreground">Phone:</span> {selectedStudent.phone}</div>
              {cats.map((cat) => <div key={cat.id}><span className="text-muted-foreground">{cat.name}:</span> {(selectedStudent.category_values || {})[cat.id] || "—"}</div>)}
              <div>
                <span className="text-muted-foreground">Marks Sheet:</span>{" "}
                {selectedStudent.marks_sheet_link ? <a href={selectedStudent.marks_sheet_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Excel Sheet</a> : "Not uploaded"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Student Dialog */}
      <Dialog open={studentDialogOpen} onOpenChange={(open) => { if (!open) resetStudentForm(); setStudentDialogOpen(open); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingStudent ? "Edit Student" : "Add Student"}</DialogTitle>
            <DialogDescription className="sr-only">Enter the details for the student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="Student name" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="Email" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} placeholder="Phone" /></div>
            <div className="space-y-2"><Label>Marks Sheet Link</Label><Input value={studentForm.marks_sheet_link} onChange={(e) => setStudentForm({ ...studentForm, marks_sheet_link: e.target.value })} placeholder="https://docs.google.com/spreadsheets/..." /></div>
            {cats.length > 0 && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-sm font-medium text-muted-foreground">Category Details</p>
                {cats.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <Label className="text-xs">{cat.name}</Label>
                    <Input value={studentForm.category_values[cat.id] || ""} onChange={(e) => setStudentForm({ ...studentForm, category_values: { ...studentForm.category_values, [cat.id]: e.target.value } })} placeholder={`Enter ${cat.name.toLowerCase()}`} />
                  </div>
                ))}
              </div>
            )}
            <Button onClick={saveStudent} className="w-full" disabled={createMentee.isPending || updateMentee.isPending}>
              {(createMentee.isPending || updateMentee.isPending) ? "Saving..." : editingStudent ? "Save Changes" : "Add Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mentorship;
