"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Camera, Trash2, Pencil, Check, X, Loader2,
  User, Mail, GraduationCap, Building2,
  CalendarDays, BookMarked
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile, updateProfile } from "@/lib/api";

interface Profile {
  avatar:        string;
  fullName:      string;
  email:         string;
  institution:   string;
  fieldOfStudy:  string;
  yearLevel:     string;
  studentId:     string;
  dailyGoal:     string;
  studyTime:     string;
  learningStyle: string;
}

const defaultProfile = (): Profile => ({
  avatar: "", fullName: "", email: "", institution: "",
  fieldOfStudy: "", yearLevel: "", studentId: "",
  dailyGoal: "", studyTime: "", learningStyle: "",
});

interface FieldDef {
  key: keyof Profile;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  options?: string[];
  readOnly?: boolean;
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Personal Information",
    fields: [
      { key: "fullName",  label: "Full Name",     icon: User,        placeholder: "Enter your full name" },
      { key: "email",     label: "Email Address", icon: Mail,        placeholder: "you@example.com", readOnly: true },
      { key: "studentId", label: "Student ID",    icon: BookMarked,  placeholder: "e.g. 2024-00123" },
    ],
  },
  {
    title: "Academic Information",
    fields: [
      { key: "institution",  label: "School / University", icon: Building2,     placeholder: "e.g. University of the Philippines" },
      { key: "fieldOfStudy", label: "Field of Study",      icon: GraduationCap, placeholder: "e.g. Computer Science" },
      {
        key: "yearLevel", label: "Year Level", icon: CalendarDays, placeholder: "Select year level",
        options: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"],
      },
    ],
  },
];

interface ProfilePageProps {
  username?: string;
  userEmail?: string;
  onProfileChange?: (avatar: string) => void;
}

export function ProfilePage({ username, onProfileChange }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<keyof Profile | null>(null);
  const [draft, setDraft] = useState("");
  const [hovering, setHovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile from API
  useEffect(() => {
    setLoading(true);
    getProfile()
      .then(({ profile: p, user }) => {
        setProfile({
          avatar:        p.avatar,
          fullName:      p.fullName || user.username,
          email:         user.email,
          institution:   p.institution,
          fieldOfStudy:  p.fieldOfStudy,
          yearLevel:     p.yearLevel,
          studentId:     p.studentId,
          dailyGoal:     p.dailyGoal,
          studyTime:     p.studyTime,
          learningStyle: p.learningStyle,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async (updated: Profile) => {
    setProfile(updated);
    setSaving(true);
    try {
      await updateProfile({
        avatar:        updated.avatar,
        fullName:      updated.fullName,
        institution:   updated.institution,
        fieldOfStudy:  updated.fieldOfStudy,
        yearLevel:     updated.yearLevel,
        studentId:     updated.studentId,
        dailyGoal:     updated.dailyGoal,
        studyTime:     updated.studyTime,
        learningStyle: updated.learningStyle,
      });
      onProfileChange?.(updated.avatar);
      window.dispatchEvent(new CustomEvent("taskzen_profile_updated", { detail: updated }));
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => save({ ...profile, avatar: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteAvatar = () => save({ ...profile, avatar: "" });

  const startEdit = (key: keyof Profile) => {
    if (key === "email") return; // email is read-only
    setEditing(key);
    setDraft(profile[key] as string);
  };
  const confirmEdit = () => {
    if (!editing) return;
    save({ ...profile, [editing]: draft });
    setEditing(null);
  };
  const cancelEdit = () => setEditing(null);

  const initials = (profile.fullName || username || "U")
    .trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <div>
        <h2 className="text-xl font-bold">My Profile</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your personal and academic information</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            <div
              className="relative shrink-0"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center select-none">
                {profile.avatar
                  ? <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
                }
              </div>
              {hovering && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center gap-2"
                >
                  <button onClick={() => fileRef.current?.click()}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors" title="Upload photo">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                  {profile.avatar && (
                    <button onClick={deleteAvatar}
                      className="p-1.5 bg-white/20 hover:bg-red-500/70 rounded-full transition-colors" title="Remove photo">
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </motion.div>
              )}
              <input ref={fileRef} type="file" accept="image/*" aria-label="Upload profile photo" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {profile.fullName || username || "Your Name"}
              </h3>
              {profile.fieldOfStudy && (
                <p className="text-xs text-muted-foreground mt-0.5">{profile.fieldOfStudy}</p>
              )}
              {profile.institution && (
                <p className="text-xs text-muted-foreground">{profile.institution}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {profile.yearLevel && (
                  <span className="text-[0.65rem] px-2 py-0.5 bg-primary/10 text-primary font-medium rounded-full">
                    {profile.yearLevel}
                  </span>
                )}
                {saving && (
                  <span className="text-[0.65rem] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </span>
                )}
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-background font-semibold hover:opacity-80 transition-opacity">
                  <Camera className="h-3 w-3" />
                  {profile.avatar ? "Change Photo" : "Upload Photo"}
                </button>
                {profile.avatar && (
                  <button onClick={deleteAvatar}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors">
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {section.title}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {section.fields.map(field => (
                <div key={field.key} className="flex items-start gap-3 px-4 py-3.5 group">
                  <field.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.7rem] text-muted-foreground font-medium mb-0.5">{field.label}</p>
                    {editing === field.key ? (
                      <div className="flex items-center gap-2">
                        {field.options ? (
                          <select
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            autoFocus
                            aria-label={field.label}
                            className="flex-1 text-sm px-2 py-1 bg-background border border-border text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                          >
                            <option value="">-- Select --</option>
                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            aria-label={field.label}
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
                            className="flex-1 text-sm px-2 py-1 bg-background border border-border text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                          />
                        )}
                        <button aria-label="Confirm" onClick={confirmEdit} className="text-green-500 hover:text-green-600 transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                        <button aria-label="Cancel" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm ${profile[field.key] ? "text-foreground font-medium" : "text-muted-foreground/40 italic font-normal"}`}>
                          {(profile[field.key] as string) || field.placeholder}
                        </p>
                        {!field.readOnly && (
                          <button
                            aria-label={`Edit ${field.label}`}
                            onClick={() => startEdit(field.key)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
